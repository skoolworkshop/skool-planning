"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { vereisRol, ipAdres } from "@/lib/auth";
import { PLANNEN } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const RondeSchema = z.object({
  nummer: z.number(),
  startTijd: z.string(),
  eindTijd: z.string(),
  groep: z.string().optional(),
  afdeling: z.string().optional(),
  aantalGroepen: z.number().int().min(1).max(20).default(1),
  deelnemers: z.number().default(0),
});

const SessieSchema = z.object({
  workshopId: z.string().uuid(),
  datum: z.string(),
  startTijd: z.string().regex(/^\d{2}:\d{2}$/),
  eindTijd: z.string().regex(/^\d{2}:\d{2}$/),
  aanwezigVanaf: z.string().optional(),
  afbouwTot: z.string().optional(),
  groepenPerRonde: z.number().int().min(1).max(20).optional(),
  deelnemers: z.number().default(0),
  leeftijd: z.string().optional(),
  doelgroep: z.string().optional(),
  ruimte: z.string().optional(),
  vergoeding: z.number().default(0),
  aantalDocenten: z.number().min(1).default(1),
  aantalAssistenten: z.number().min(0).default(0),
  benodigdheden: z.string().optional(),
  kleding: z.string().optional(),
  bijzonderheden: z.string().optional(),
  aanmeldDeadline: z.string().optional(),
  rondes: z.array(RondeSchema).default([]),
});

const ProjectSchema = z.object({
  clientId: z.string().uuid(),
  locationId: z.string().uuid().optional().or(z.literal("")),
  contactId: z.string().uuid().optional().or(z.literal("")),
  naam: z.string().min(2),
  omzet: z.number().default(0),
  notitie: z.string().optional(),
  interneNotitie: z.string().optional(),
  sessies: z.array(SessieSchema).min(1),
});

export type ProjectInvoer = z.infer<typeof ProjectSchema>;

async function volgendOrdernummer() {
  const jaar = new Date().getFullYear();
  const n = await db.project.count({ where: { ordernummer: { startsWith: `SW${jaar}-` } } });
  return `SW${jaar}-${String(n + 1).padStart(4, "0")}`;
}

export async function projectAanmaken(invoer: ProjectInvoer) {
  const u = await vereisRol(...PLANNEN);
  const parsed = ProjectSchema.safeParse(invoer);
  if (!parsed.success) {
    return { fout: "Controleer het formulier: " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") };
  }
  const d = parsed.data;

  for (const s of d.sessies) {
    if (s.eindTijd <= s.startTijd) return { fout: "De eindtijd moet na de starttijd liggen." };
  }

  const ordernummer = await volgendOrdernummer();
  const datums = d.sessies.map((s) => new Date(s.datum)).sort((a, b) => a.getTime() - b.getTime());

  const project = await db.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        ordernummer,
        clientId: d.clientId,
        locationId: d.locationId || null,
        naam: d.naam,
        status: "BEVESTIGD",
        startDatum: datums[0],
        eindDatum: datums[datums.length - 1],
        omzet: d.omzet,
        notitie: d.notitie || null,
        interneNotitie: d.interneNotitie || null,
        createdById: u.id,
        updatedById: u.id,
      },
    });

    for (const s of d.sessies) {
      const sessie = await tx.workshopSession.create({
        data: {
          projectId: p.id,
          workshopId: s.workshopId,
          locationId: d.locationId || null,
          contactId: d.contactId || null,
          datum: new Date(s.datum),
          startTijd: s.startTijd,
          eindTijd: s.eindTijd,
          aanwezigVanaf: s.aanwezigVanaf || null,
          afbouwTot: s.afbouwTot || null,
          deelnemers: s.deelnemers,
          leeftijd: s.leeftijd || null,
          doelgroep: s.doelgroep || null,
          aantalRondes: Math.max(1, s.rondes.length),
          ruimte: s.ruimte || null,
          benodigdheden: s.benodigdheden || null,
          kleding: s.kleding || null,
          bijzonderheden: s.bijzonderheden || null,
          vergoeding: s.vergoeding,
          aanmeldDeadline: s.aanmeldDeadline ? new Date(s.aanmeldDeadline) : null,
          status: "NIET_GEPUBLICEERD",
        },
      });

      for (const r of s.rondes) {
        await tx.workshopRound.create({
          data: {
            sessionId: sessie.id,
            nummer: r.nummer,
            startTijd: r.startTijd,
            eindTijd: r.eindTijd,
            groep: r.groep || null,
            afdeling: r.afdeling || null,
            aantalGroepen: r.aantalGroepen,
            deelnemers: r.deelnemers,
          },
        });
      }

      await tx.staffingPosition.create({
        data: { sessionId: sessie.id, rol: "WORKSHOPDOCENT", aantal: s.aantalDocenten, vergoeding: s.vergoeding },
      });
      if (s.aantalAssistenten > 0) {
        await tx.staffingPosition.create({
          data: { sessionId: sessie.id, rol: "ASSISTENT", aantal: s.aantalAssistenten, vergoeding: Math.round(s.vergoeding * 0.6 * 100) / 100 },
        });
      }
    }
    return p;
  });

  await logAudit({ userId: u.id, actie: "PROJECT_AANGEMAAKT", entiteit: "Project", entiteitId: project.id, nieuw: { ordernummer, sessies: d.sessies.length }, ip: ipAdres() });
  revalidatePath("/beheer/projecten");
  revalidatePath("/beheer/opdrachten");
  return { ok: true, id: project.id, ordernummer };
}

export async function klantAanmaken(formData: FormData) {
  const u = await vereisRol(...PLANNEN);
  const naam = String(formData.get("naam") ?? "").trim();
  const type = String(formData.get("type") ?? "BASISSCHOOL");
  const plaats = String(formData.get("plaats") ?? "").trim();
  if (!naam || !plaats) return { fout: "Vul minimaal een naam en plaats in." };

  const dubbel = await db.client.findFirst({ where: { naam: { equals: naam, mode: "insensitive" } } });
  if (dubbel) return { fout: `Er bestaat al een klant met de naam ${naam}.` };

  const n = await db.client.count();
  const klant = await db.client.create({
    data: {
      klantnummer: `K${String(n + 1001)}`,
      naam,
      type: type as never,
      locations: {
        create: {
          naam: String(formData.get("locatienaam") || naam),
          straat: String(formData.get("straat") ?? "") || null,
          huisnummer: String(formData.get("huisnummer") ?? "") || null,
          postcode: String(formData.get("postcode") ?? "") || null,
          plaats,
        },
      },
      contacts: formData.get("contactNaam")
        ? {
            create: {
              naam: String(formData.get("contactNaam")),
              email: String(formData.get("contactEmail") ?? "") || null,
              telefoon: String(formData.get("contactTelefoon") ?? "") || null,
              primair: true,
              opDeDag: true,
            },
          }
        : undefined,
    },
  });

  await logAudit({ userId: u.id, actie: "KLANT_AANGEMAAKT", entiteit: "Client", entiteitId: klant.id, ip: ipAdres() });
  revalidatePath("/beheer/klanten");
  return { ok: true, id: klant.id };
}
