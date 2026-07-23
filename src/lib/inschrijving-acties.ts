"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { magWijzigen } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { maakCodes, normaliseerCode, leesLeerlingenCsv, verdeelVoorkeuren } from "@/lib/inschrijving";
import type { CodeScope, EnrollmentMode } from "@prisma/client";

const LEERLING_COOKIE = "sw_leerling";

async function vereisPlanner() {
  const u = await vereisGebruiker();
  if (!magWijzigen(u.role)) throw new Error("Je hebt geen rechten om dit te wijzigen.");
  return u;
}

/* ====================== Beheer ====================== */

export async function inschrijvingAanmaken(formData: FormData) {
  const u = await vereisPlanner();
  const projectId = String(formData.get("projectId") ?? "");
  const titel = String(formData.get("titel") ?? "").trim();
  const modus = String(formData.get("modus") ?? "DIRECTE_KEUZE") as EnrollmentMode;
  const codeScope = String(formData.get("codeScope") ?? "KLAS") as CodeScope;
  const sluiting = String(formData.get("sluitingsdatum") ?? "");

  if (!projectId) return { fout: "Kies eerst een project." };

  const project = await db.project.findUnique({ where: { id: projectId }, include: { enrollment: true } });
  if (!project) return { fout: "Dit project bestaat niet." };
  if (project.enrollment) return { fout: "Op dit project loopt al een inschrijving." };

  const e = await db.enrollment.create({
    data: {
      projectId,
      titel: titel || project.naam,
      modus,
      codeScope,
      sluitingsdatum: sluiting ? new Date(sluiting) : null,
      status: "CONCEPT",
    },
  });

  await logAudit({ userId: u.id, actie: "INSCHRIJVING_AANGEMAAKT", entiteit: "Enrollment", entiteitId: e.id });
  revalidatePath("/beheer/inschrijvingen");
  return { ok: true, id: e.id };
}

export async function inschrijvingOpslaan(formData: FormData) {
  const u = await vereisPlanner();
  const id = String(formData.get("id") ?? "");
  const sluiting = String(formData.get("sluitingsdatum") ?? "");

  await db.enrollment.update({
    where: { id },
    data: {
      titel: String(formData.get("titel") ?? "").trim() || undefined,
      modus: String(formData.get("modus") ?? "DIRECTE_KEUZE") as EnrollmentMode,
      codeScope: String(formData.get("codeScope") ?? "KLAS") as CodeScope,
      keuzesPerRonde: Number(formData.get("keuzesPerRonde") ?? 1),
      voorkeurenAantal: Number(formData.get("voorkeurenAantal") ?? 3),
      herhalingToegestaan: formData.get("herhalingToegestaan") === "on",
      wijzigenToegestaan: formData.get("wijzigenToegestaan") === "on",
      toonVrijePlekken: formData.get("toonVrijePlekken") === "on",
      welkomtekst: String(formData.get("welkomtekst") ?? "").trim() || null,
      sluitingsdatum: sluiting ? new Date(sluiting) : null,
    },
  });

  await logAudit({ userId: u.id, actie: "INSCHRIJVING_GEWIJZIGD", entiteit: "Enrollment", entiteitId: id });
  revalidatePath(`/beheer/inschrijvingen/${id}`);
  return { ok: true };
}

export async function rondeToevoegen(enrollmentId: string, startTijd: string, eindTijd: string, naam?: string) {
  await vereisPlanner();
  const laatste = await db.enrollmentRound.findFirst({
    where: { enrollmentId },
    orderBy: { nummer: "desc" },
  });
  await db.enrollmentRound.create({
    data: {
      enrollmentId,
      nummer: (laatste?.nummer ?? 0) + 1,
      startTijd,
      eindTijd,
      naam: naam || null,
    },
  });
  revalidatePath(`/beheer/inschrijvingen/${enrollmentId}`);
  return { ok: true };
}

export async function rondeVerwijderen(roundId: string, enrollmentId: string) {
  await vereisPlanner();
  await db.enrollmentRound.delete({ where: { id: roundId } });
  revalidatePath(`/beheer/inschrijvingen/${enrollmentId}`);
  return { ok: true };
}

export async function slotToevoegen(formData: FormData) {
  await vereisPlanner();
  const roundId = String(formData.get("roundId") ?? "");
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const workshopId = String(formData.get("workshopId") ?? "");
  const ruimte = String(formData.get("ruimte") ?? "").trim() || null;
  const capaciteit = Number(formData.get("capaciteit") ?? 25);
  const teacherId = String(formData.get("teacherId") ?? "") || null;

  if (!workshopId) return { fout: "Kies een workshop." };
  if (capaciteit < 1) return { fout: "De capaciteit moet minimaal 1 zijn." };

  const bestaat = await db.enrollmentSlot.findFirst({ where: { roundId, workshopId, ruimte } });
  if (bestaat) return { fout: "Deze workshop staat al in deze ronde in dezelfde ruimte." };

  await db.enrollmentSlot.create({
    data: { roundId, workshopId, ruimte, capaciteit, teacherId },
  });

  revalidatePath(`/beheer/inschrijvingen/${enrollmentId}`);
  return { ok: true };
}

export async function slotVerwijderen(slotId: string, enrollmentId: string) {
  await vereisPlanner();
  const keuzes = await db.choice.count({ where: { slotId } });
  if (keuzes > 0) return { fout: `Er zitten al ${keuzes} leerlingen in deze workshop. Verplaats ze eerst.` };
  await db.enrollmentSlot.delete({ where: { id: slotId } });
  revalidatePath(`/beheer/inschrijvingen/${enrollmentId}`);
  return { ok: true };
}

export async function leerlingenImporteren(enrollmentId: string, csv: string) {
  await vereisPlanner();
  const { leerlingen, fouten } = leesLeerlingenCsv(csv);
  if (leerlingen.length === 0) {
    return { fout: fouten[0] ?? "Er stonden geen leerlingen in het bestand." };
  }

  const bestaand = await db.participant.findMany({
    where: { enrollmentId },
    select: { voornaam: true, achternaam: true, klas: true },
  });
  const sleutel = (v: string, a: string, k: string) => `${v}|${a}|${k}`.toLowerCase();
  const alGehad = new Set(bestaand.map((b) => sleutel(b.voornaam, b.achternaam ?? "", b.klas)));

  const nieuw = leerlingen.filter((l) => !alGehad.has(sleutel(l.voornaam, l.achternaam, l.klas)));

  await db.participant.createMany({
    data: nieuw.map((l) => ({
      enrollmentId,
      voornaam: l.voornaam,
      achternaam: l.achternaam || null,
      klas: l.klas,
      email: l.email || null,
    })),
  });

  revalidatePath(`/beheer/inschrijvingen/${enrollmentId}`);
  return {
    ok: true,
    toegevoegd: nieuw.length,
    overgeslagen: leerlingen.length - nieuw.length,
    fouten,
  };
}

export async function codesGenereren(enrollmentId: string) {
  const u = await vereisPlanner();
  const e = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { deelnemers: true, codes: true },
  });
  if (!e) return { fout: "Deze inschrijving bestaat niet." };

  await db.accessCode.deleteMany({ where: { enrollmentId, schoolPortaal: false } });

  let rijen: { code: string; scope: CodeScope; klas?: string | null; participantId?: string | null }[] = [];

  if (e.codeScope === "EVENEMENT") {
    rijen = [{ code: maakCodes(1, 6)[0], scope: "EVENEMENT" }];
  } else if (e.codeScope === "KLAS") {
    const klassen = [...new Set(e.deelnemers.map((d) => d.klas))].sort();
    if (klassen.length === 0) return { fout: "Voeg eerst leerlingen toe, anders zijn er geen klassen." };
    const codes = maakCodes(klassen.length, 6);
    rijen = klassen.map((k, i) => ({ code: codes[i], scope: "KLAS" as CodeScope, klas: k }));
  } else {
    if (e.deelnemers.length === 0) return { fout: "Voeg eerst leerlingen toe." };
    const codes = maakCodes(e.deelnemers.length, 7);
    rijen = e.deelnemers.map((d, i) => ({
      code: codes[i],
      scope: "LEERLING" as CodeScope,
      klas: d.klas,
      participantId: d.id,
    }));
  }

  await db.accessCode.createMany({
    data: rijen.map((r) => ({ ...r, enrollmentId })),
    skipDuplicates: true,
  });

  // Losse code voor het portaal van de school
  if (!e.codes.some((c) => c.schoolPortaal)) {
    await db.accessCode.create({
      data: { enrollmentId, code: maakCodes(1, 8)[0], scope: "EVENEMENT", schoolPortaal: true },
    });
  }

  await logAudit({ userId: u.id, actie: "CODES_GEGENEREERD", entiteit: "Enrollment", entiteitId: enrollmentId });
  revalidatePath(`/beheer/inschrijvingen/${enrollmentId}`);
  return { ok: true, aantal: rijen.length };
}

export async function inschrijvingStatus(enrollmentId: string, status: "CONCEPT" | "OPEN" | "GESLOTEN" | "DEFINITIEF") {
  const u = await vereisPlanner();

  if (status === "OPEN") {
    const rondes = await db.enrollmentRound.findMany({
      where: { enrollmentId },
      include: { slots: true },
    });
    if (rondes.length === 0) return { fout: "Maak eerst minimaal één ronde aan." };
    const leeg = rondes.filter((r) => r.slots.length === 0);
    if (leeg.length > 0) return { fout: `Ronde ${leeg[0].nummer} heeft nog geen workshops.` };
    const codes = await db.accessCode.count({ where: { enrollmentId, schoolPortaal: false } });
    if (codes === 0) return { fout: "Genereer eerst de toegangscodes." };
  }

  await db.enrollment.update({ where: { id: enrollmentId }, data: { status } });
  await logAudit({ userId: u.id, actie: `INSCHRIJVING_${status}`, entiteit: "Enrollment", entiteitId: enrollmentId });
  revalidatePath(`/beheer/inschrijvingen/${enrollmentId}`);
  return { ok: true };
}

/** Verdeelt iedereen die nog niets heeft gekozen over de vrije plekken. */
export async function restVerdelen(enrollmentId: string): Promise<{ ok?: boolean; fout?: string; geplaatst?: number; problemen?: string[] }> {
  const u = await vereisPlanner();

  const rondes = await db.enrollmentRound.findMany({
    where: { enrollmentId },
    include: { slots: { include: { _count: { select: { keuzes: true } } } } },
  });
  const deelnemers = await db.participant.findMany({
    where: { enrollmentId },
    include: { keuzes: true, voorkeuren: true },
  });

  let geplaatst = 0;
  const problemen: string[] = [];

  for (const ronde of rondes) {
    const zonder = deelnemers.filter((d) => !d.keuzes.some((k) => k.roundId === ronde.id));
    if (zonder.length === 0) continue;

    const slots = ronde.slots.map((s) => ({
      id: s.id,
      capaciteit: s.capaciteit,
      bezet: s._count.keuzes,
    }));

    const invoer = zonder.map((d) => ({
      id: d.id,
      voorkeuren: d.voorkeuren
        .filter((v) => v.roundId === ronde.id)
        .sort((a, b) => a.volgorde - b.volgorde)
        .map((v) => v.slotId),
    }));

    const { toewijzing, nietGeplaatst } = verdeelVoorkeuren(invoer, slots);

    for (const [participantId, slotId] of toewijzing) {
      await db.choice.create({
        data: { participantId, slotId, roundId: ronde.id, automatisch: true },
      });
      geplaatst++;
    }
    if (nietGeplaatst.length > 0) {
      problemen.push(`Ronde ${ronde.nummer}: ${nietGeplaatst.length} leerlingen passen nergens meer bij.`);
    }
  }

  await db.participant.updateMany({
    where: { enrollmentId, ingeschrevenOp: null },
    data: { ingeschrevenOp: new Date() },
  });

  await logAudit({ userId: u.id, actie: "REST_VERDEELD", entiteit: "Enrollment", entiteitId: enrollmentId, nieuw: { geplaatst } });
  revalidatePath(`/beheer/inschrijvingen/${enrollmentId}`);
  return { ok: true, geplaatst, problemen };
}

/* ====================== Leerling ====================== */

// PUBLIEK: leerling komt binnen met een toegangscode, geen account
export async function codeControleren(invoer: string) {
  const code = normaliseerCode(invoer);
  if (code.length < 4) return { fout: "Vul je volledige code in." };

  const gevonden = await db.accessCode.findUnique({
    where: { code },
    include: { enrollment: true },
  });

  if (!gevonden || !gevonden.actief) return { fout: "Deze code kennen we niet. Check hem nog even." };
  if (gevonden.schoolPortaal) {
    cookies().set(LEERLING_COOKIE, gevonden.code, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    return { ok: true, school: true, enrollmentId: gevonden.enrollmentId };
  }

  const e = gevonden.enrollment;
  if (e.status === "CONCEPT") return { fout: "De inschrijving is nog niet open." };
  if (e.status === "GESLOTEN" || e.status === "DEFINITIEF") {
    return { fout: "De inschrijving is gesloten. Vraag je mentor om je rooster." };
  }
  if (e.sluitingsdatum && e.sluitingsdatum < new Date()) {
    return { fout: "De sluitingsdatum is voorbij." };
  }

  await db.accessCode.update({
    where: { id: gevonden.id },
    data: { gebruikt: { increment: 1 }, laatstGebruikt: new Date() },
  });

  cookies().set(LEERLING_COOKIE, gevonden.code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });

  return { ok: true, enrollmentId: gevonden.enrollmentId, code: gevonden.code };
}

// PUBLIEK: leest de toegangscode uit de cookie van de leerling
export async function leerlingSessie() {
  const code = cookies().get(LEERLING_COOKIE)?.value;
  if (!code) return null;
  const gevonden = await db.accessCode.findUnique({
    where: { code },
    include: { enrollment: true, participant: true },
  });
  if (!gevonden || !gevonden.actief) return null;
  return gevonden;
}

// PUBLIEK: leerling wist zijn eigen cookie
export async function leerlingAfmelden() {
  cookies().delete(LEERLING_COOKIE);
  return { ok: true };
}

/** Koppelt de bezoeker aan een leerling, of maakt er een aan als de school geen lijst had. */
// PUBLIEK: leerling kiest zichzelf uit de klaslijst na een geldige code
export async function leerlingKiezen(participantId: string) {
  const sessie = await leerlingSessie();
  if (!sessie) return { fout: "Je sessie is verlopen. Vul je code opnieuw in." };
  cookies().set("sw_leerling_id", participantId, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 4,
  });
  return { ok: true };
}

// PUBLIEK: leerling voegt zichzelf toe na een geldige code
export async function leerlingAanmelden(formData: FormData) {
  const sessie = await leerlingSessie();
  if (!sessie) return { fout: "Je sessie is verlopen. Vul je code opnieuw in." };

  const voornaam = String(formData.get("voornaam") ?? "").trim();
  const achternaam = String(formData.get("achternaam") ?? "").trim();
  const klas = String(formData.get("klas") ?? "").trim() || sessie.klas || "";

  if (!voornaam) return { fout: "Vul je voornaam in." };
  if (!klas) return { fout: "Vul je klas in." };

  const bestaat = await db.participant.findFirst({
    where: {
      enrollmentId: sessie.enrollmentId,
      voornaam: { equals: voornaam, mode: "insensitive" },
      achternaam: achternaam ? { equals: achternaam, mode: "insensitive" } : undefined,
      klas: { equals: klas, mode: "insensitive" },
    },
  });

  const p = bestaat
    ? bestaat
    : await db.participant.create({
        data: { enrollmentId: sessie.enrollmentId, voornaam, achternaam: achternaam || null, klas },
      });

  cookies().set("sw_leerling_id", p.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 4 });
  return { ok: true, participantId: p.id };
}

// PUBLIEK: leest de leerling uit de cookie
export async function huidigeLeerling() {
  const sessie = await leerlingSessie();
  if (!sessie) return null;
  if (sessie.participant) return sessie.participant;
  const id = cookies().get("sw_leerling_id")?.value;
  if (!id) return null;
  const p = await db.participant.findUnique({ where: { id } });
  if (!p || p.enrollmentId !== sessie.enrollmentId) return null;
  return p;
}

/**
 * Legt de keuze van een leerling vast.
 * De capaciteitscontrole en het wegschrijven gebeuren in één transactie,
 * zodat twee leerlingen nooit tegelijk de laatste plek kunnen pakken.
 */
// PUBLIEK: leerling legt zijn eigen keuze vast, beveiligd via de code in de cookie
export async function keuzeVastleggen(slotId: string) {
  const sessie = await leerlingSessie();
  const leerling = await huidigeLeerling();
  if (!sessie || !leerling) return { fout: "Je sessie is verlopen. Vul je code opnieuw in." };

  const e = sessie.enrollment;
  if (e.status !== "OPEN") return { fout: "De inschrijving is gesloten." };
  if (e.sluitingsdatum && e.sluitingsdatum < new Date()) return { fout: "De sluitingsdatum is voorbij." };

  try {
    const uitkomst = await db.$transaction(async (tx) => {
      const slot = await tx.enrollmentSlot.findUnique({
        where: { id: slotId },
        include: { round: true, workshop: true },
      });
      if (!slot) throw new Error("Deze workshop bestaat niet meer.");
      if (slot.round.enrollmentId !== e.id) throw new Error("Deze workshop hoort niet bij jouw dag.");

      const bezet = await tx.choice.count({ where: { slotId } });
      if (bezet >= slot.capaciteit) throw new Error("Net te laat, deze workshop zit vol.");

      const bestaande = await tx.choice.findUnique({
        where: { participantId_roundId: { participantId: leerling.id, roundId: slot.roundId } },
      });

      if (bestaande) {
        if (!e.wijzigenToegestaan) throw new Error("Je keuze staat vast en kan niet meer gewijzigd worden.");
        if (bestaande.slotId === slotId) return { slot, gewijzigd: false };
        await tx.choice.update({ where: { id: bestaande.id }, data: { slotId, automatisch: false } });
        return { slot, gewijzigd: true };
      }

      if (!e.herhalingToegestaan) {
        const zelfdeWorkshop = await tx.choice.findFirst({
          where: {
            participantId: leerling.id,
            slot: { workshopId: slot.workshopId },
          },
        });
        if (zelfdeWorkshop) throw new Error("Je hebt deze workshop al in een andere ronde gekozen.");
      }

      await tx.choice.create({
        data: { participantId: leerling.id, slotId, roundId: slot.roundId },
      });
      return { slot, gewijzigd: false };
    });

    // Klaar met alle rondes? Dan is de leerling ingeschreven.
    const rondes = await db.enrollmentRound.count({ where: { enrollmentId: e.id } });
    const keuzes = await db.choice.count({ where: { participantId: leerling.id } });
    if (keuzes >= rondes && !leerling.ingeschrevenOp) {
      await db.participant.update({ where: { id: leerling.id }, data: { ingeschrevenOp: new Date() } });
    }

    revalidatePath("/inschrijven");
    return { ok: true, workshop: uitkomst.slot.workshop.naam, gewijzigd: uitkomst.gewijzigd };
  } catch (err) {
    return { fout: err instanceof Error ? err.message : "Er ging iets mis. Probeer het opnieuw." };
  }
}

// PUBLIEK: leerling legt zijn eigen voorkeuren vast, beveiligd via de code in de cookie
export async function voorkeurenVastleggen(roundId: string, slotIds: string[]) {
  const sessie = await leerlingSessie();
  const leerling = await huidigeLeerling();
  if (!sessie || !leerling) return { fout: "Je sessie is verlopen. Vul je code opnieuw in." };
  if (sessie.enrollment.status !== "OPEN") return { fout: "De inschrijving is gesloten." };
  if (slotIds.length === 0) return { fout: "Kies minimaal één workshop." };

  await db.$transaction(async (tx) => {
    await tx.preference.deleteMany({ where: { participantId: leerling.id, roundId } });
    for (let i = 0; i < slotIds.length; i++) {
      await tx.preference.create({
        data: { participantId: leerling.id, slotId: slotIds[i], roundId, volgorde: i + 1 },
      });
    }
  });

  revalidatePath("/inschrijven");
  return { ok: true };
}
