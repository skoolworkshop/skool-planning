"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { vereisRol, ipAdres } from "@/lib/auth";
import { PLANNEN, BEHEER } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { isDoelgroep } from "@/lib/doelgroepen";

const TIJD = /^\d{2}:\d{2}$/;

const RondeSchema = z.object({
  nummer: z.number().int().min(1),
  startTijd: z.string().regex(TIJD),
  eindTijd: z.string().regex(TIJD),
  afdeling: z.string().optional(),
  aantalGroepen: z.number().int().min(1).max(20).default(1),
  deelnemers: z.number().int().min(0).default(0),
});

export type RondeInvoer = z.infer<typeof RondeSchema>;

/**
 * Vervangt alle rondes van een workshopmoment.
 * Per ronde leg je vast hoeveel parallelle groepen er draaien en voor welke afdeling.
 */
export async function rondesOpslaan(
  sessionId: string,
  rondes: RondeInvoer[],
  tijden?: { aanwezigVanaf?: string; afbouwTot?: string }
) {
  const u = await vereisRol(...PLANNEN);
  const parsed = z.array(RondeSchema).safeParse(rondes);
  if (!parsed.success) return { fout: "Controleer de tijden van de rondes." };
  const lijst = parsed.data;

  for (const r of lijst) {
    if (r.eindTijd <= r.startTijd) return { fout: `Ronde ${r.nummer} eindigt voor de starttijd.` };
  }

  const sessie = await db.workshopSession.findUnique({ where: { id: sessionId }, include: { positions: true } });
  if (!sessie) return { fout: "Dit workshopmoment bestaat niet." };

  // Combinatie van nummer en afdeling moet uniek zijn
  const sleutels = lijst.map((r) => `${r.nummer}|${r.afdeling?.trim() ?? ""}`);
  if (new Set(sleutels).size !== sleutels.length) {
    return { fout: "Twee rondes hebben hetzelfde nummer binnen dezelfde afdeling." };
  }

  const starts = lijst.map((r) => r.startTijd).sort();
  const einden = lijst.map((r) => r.eindTijd).sort();
  const maxGroepen = lijst.reduce((n, r) => Math.max(n, r.aantalGroepen), 1);

  await db.$transaction(async (tx) => {
    await tx.workshopRound.deleteMany({ where: { sessionId } });
    let volgnummer = 0;
    for (const r of lijst) {
      volgnummer++;
      await tx.workshopRound.create({
        data: {
          sessionId,
          // nummer moet uniek zijn per sessie, dus bij afdelingen tellen we door
          nummer: new Set(lijst.map((x) => x.afdeling?.trim() ?? "")).size > 1 ? volgnummer : r.nummer,
          startTijd: r.startTijd,
          eindTijd: r.eindTijd,
          afdeling: r.afdeling?.trim() || null,
          aantalGroepen: r.aantalGroepen,
          deelnemers: r.deelnemers,
        },
      });
    }

    await tx.workshopSession.update({
      where: { id: sessionId },
      data: {
        aantalRondes: new Set(lijst.map((r) => r.nummer)).size,
        startTijd: starts[0] ?? sessie.startTijd,
        eindTijd: einden[einden.length - 1] ?? sessie.eindTijd,
        aanwezigVanaf: tijden?.aanwezigVanaf?.trim() || sessie.aanwezigVanaf,
        afbouwTot: tijden?.afbouwTot?.trim() || sessie.afbouwTot,
      },
    });

    // Het aantal docenten volgt het hoogste aantal parallelle groepen
    const hoofdpositie = sessie.positions.find((p) => p.rol === "WORKSHOPDOCENT");
    if (hoofdpositie && !hoofdpositie.gesloten && hoofdpositie.aantal < maxGroepen) {
      await tx.staffingPosition.update({ where: { id: hoofdpositie.id }, data: { aantal: maxGroepen } });
    }
  });

  await logAudit({
    userId: u.id,
    actie: "RONDES_AANGEPAST",
    entiteit: "WorkshopSession",
    entiteitId: sessionId,
    nieuw: { rondes: lijst.length, maxGroepen },
    ip: ipAdres(),
  });
  revalidatePath(`/beheer/opdrachten/moment/${sessionId}`);
  revalidatePath(`/beheer/opdrachten/${sessie.projectId}`);
  return { ok: true, rondes: lijst.length, docentenNodig: maxGroepen };
}

/** Voegt nog een workshop toe aan een bestaande opdracht, op dezelfde dag en locatie. */
export async function workshopToevoegen(projectId: string, workshopId: string) {
  const u = await vereisRol(...PLANNEN);
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { sessions: { orderBy: { datum: "asc" }, take: 1 } },
  });
  if (!project) return { fout: "Deze opdracht bestaat niet." };
  const workshop = await db.workshop.findUnique({ where: { id: workshopId } });
  if (!workshop) return { fout: "Deze workshop bestaat niet." };

  const voorbeeld = project.sessions[0];
  const datum = voorbeeld?.datum ?? project.startDatum ?? new Date();

  const sessie = await db.workshopSession.create({
    data: {
      projectId,
      workshopId,
      locationId: voorbeeld?.locationId ?? project.locationId ?? null,
      contactId: voorbeeld?.contactId ?? null,
      datum,
      startTijd: voorbeeld?.startTijd ?? "10:00",
      eindTijd: voorbeeld?.eindTijd ?? "11:00",
      aanwezigVanaf: voorbeeld?.aanwezigVanaf ?? null,
      afbouwTot: voorbeeld?.afbouwTot ?? null,
      deelnemers: 0,
      doelgroep: voorbeeld?.doelgroep ?? null,
      aantalRondes: 1,
      tijdPerRonde: workshop.standaardDuur,
      telefoonOpDeDag: voorbeeld?.telefoonOpDeDag ?? null,
      vergoeding: workshop.standaardVergoeding,
      status: "NIET_GEPUBLICEERD",
      rounds: {
        create: {
          nummer: 1,
          startTijd: voorbeeld?.startTijd ?? "10:00",
          eindTijd: voorbeeld?.eindTijd ?? "11:00",
          aantalGroepen: 1,
        },
      },
      positions: {
        create: { rol: "WORKSHOPDOCENT", aantal: 1, vergoeding: workshop.standaardVergoeding, vereisteDocumenten: workshop.vereisteDocumenten },
      },
    },
  });

  await logAudit({ userId: u.id, actie: "WORKSHOP_TOEGEVOEGD", entiteit: "Project", entiteitId: projectId, nieuw: { workshop: workshop.naam }, ip: ipAdres() });
  revalidatePath(`/beheer/opdrachten/${projectId}`);
  return { ok: true, id: sessie.id };
}

/** Haalt een workshop weer uit de opdracht. Kan niet als er al docenten op staan. */
export async function workshopVerwijderen(sessionId: string) {
  const u = await vereisRol(...PLANNEN);
  const sessie = await db.workshopSession.findUnique({
    where: { id: sessionId },
    include: { positions: { include: { assignments: true } } },
  });
  if (!sessie) return { fout: "Dit workshopmoment bestaat niet." };
  const toegewezen = sessie.positions.flatMap((p) => p.assignments).filter((a) => !a.uitgevallen).length;
  if (toegewezen > 0) return { fout: "Er staan al docenten op deze workshop. Trek eerst de toewijzingen in." };

  await db.workshopSession.delete({ where: { id: sessionId } });
  await logAudit({ userId: u.id, actie: "WORKSHOP_VERWIJDERD", entiteit: "Project", entiteitId: sessie.projectId, ip: ipAdres() });
  revalidatePath(`/beheer/opdrachten/${sessie.projectId}`);
  return { ok: true };
}

/** Slaat de vrije tekst op die in de bevestiging bij "Aantal personen" komt. */
export async function projectTekstOpslaan(projectId: string, aantalPersonenTekst: string) {
  await vereisRol(...PLANNEN);
  await db.project.update({ where: { id: projectId }, data: { aantalPersonenTekst: aantalPersonenTekst.trim() || null } });
  revalidatePath(`/beheer/opdrachten/${projectId}`);
  return { ok: true };
}

/** Klantgegevens bijwerken, inclusief het CJP schoolnummer. */
export async function klantGegevensOpslaan(clientId: string, formData: FormData) {
  const u = await vereisRol(...PLANNEN);
  const cjp = String(formData.get("cjpNummer") ?? "").trim();
  const klant = await db.client.findUnique({ where: { id: clientId } });
  if (!klant) return { fout: "Deze klant bestaat niet." };

  await db.client.update({
    where: { id: clientId },
    data: {
      doelgroepen: formData.getAll("doelgroepen").map(String).filter(isDoelgroep),
      doelgroepToelichting: String(formData.get("doelgroepToelichting") ?? "").trim() || null,
      cjpNummer: cjp || null,
      factuurEmail: String(formData.get("factuurEmail") ?? "").trim() || null,
      factuurAdres: String(formData.get("factuurAdres") ?? "").trim() || null,
      betaaltermijn: Number(formData.get("betaaltermijn") ?? klant.betaaltermijn) || klant.betaaltermijn,
    },
  });

  await logAudit({ userId: u.id, actie: "KLANT_BIJGEWERKT", entiteit: "Client", entiteitId: clientId, ip: ipAdres() });
  revalidatePath(`/beheer/klanten/${clientId}`);
  return { ok: true };
}

/** Standaardtekst van een workshop voor in de bevestiging. */
export async function workshopTekstOpslaan(workshopId: string, formData: FormData) {
  await vereisRol(...BEHEER);
  await db.workshop.update({
    where: { id: workshopId },
    data: {
      klantBenodigdheden: String(formData.get("klantBenodigdheden") ?? "").trim() || null,
      voorbeeldLink: String(formData.get("voorbeeldLink") ?? "").trim() || null,
    },
  });
  revalidatePath("/beheer/workshops");
  return { ok: true };
}

/**
 * Zet wat een workshopdocent met een workshop mag.
 * Alleen een beheerder bepaalt dit, een workshopdocent nooit zelf.
 */
export async function bevoegdheidZetten(teacherId: string, workshopId: string, bevoegdheid: "ZELFSTANDIG" | "ASSISTEREN" | "NIET_INZETBAAR" | "GEEN") {
  const u = await vereisRol(...BEHEER);
  const teacher = await db.teacherProfile.findUnique({ where: { id: teacherId } });
  if (!teacher) return { fout: "Deze workshopdocent bestaat niet." };

  if (bevoegdheid === "GEEN") {
    await db.teacherWorkshopSkill.deleteMany({ where: { teacherId, workshopId } });
  } else {
    await db.teacherWorkshopSkill.upsert({
      where: { teacherId_workshopId: { teacherId, workshopId } },
      create: { teacherId, workshopId, bevoegdheid, gezetDoor: u.id, gezetOp: new Date() },
      update: { bevoegdheid, gezetDoor: u.id, gezetOp: new Date() },
    });
  }

  await logAudit({
    userId: u.id,
    actie: "BEVOEGDHEID_AANGEPAST",
    entiteit: "TeacherWorkshopSkill",
    entiteitId: teacherId,
    nieuw: { workshopId, bevoegdheid },
    ip: ipAdres(),
  });
  revalidatePath(`/beheer/docenten/${teacherId}`);
  return { ok: true };
}
