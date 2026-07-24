"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { vereisGebruiker, ipAdres } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { isGeldig } from "@/lib/documenten";
import { isDoelgroep } from "@/lib/doelgroepen";
import { berekenVergoeding } from "@/lib/tarieven";
import { haalTarieven } from "@/lib/tarief-acties";
import { meld } from "@/lib/notify";
import { herberekenStatus } from "@/lib/planning-acties";
import { datum as fmtDatum, urenTussen, afstandKm, reistijdMin } from "@/lib/format";

async function mijnProfiel() {
  const u = await vereisGebruiker();
  if (u.role !== "DOCENT") throw new Error("GEEN_RECHTEN");
  const t = await db.teacherProfile.findUnique({ where: { userId: u.id } });
  if (!t) throw new Error("GEEN_PROFIEL");
  return { user: u, teacher: t };
}

/**
 * Controleert of de ingelogde workshopdocent deze opdracht mag zien en aannemen.
 * De workshopdocent komt altijd uit de sessie, nooit uit een meegegeven id,
 * anders zou iemand met een API-call over een ander profiel kunnen vragen.
 */
export async function magOpdracht(sessionId: string) {
  const { teacher } = await mijnProfiel();
  const teacherId = teacher.id;
  const [t, s] = await Promise.all([
    db.teacherProfile.findUnique({ where: { id: teacherId }, include: { skills: true, documents: true } }),
    db.workshopSession.findUnique({ where: { id: sessionId }, include: { workshop: true, positions: true } }),
  ]);
  if (!t || !s) return { mag: false, reden: "Opdracht niet gevonden." };
  if (t.status !== "GOEDGEKEURD") return { mag: false, reden: "Je profiel is nog niet goedgekeurd." };
  if (!t.skills.some((x) => x.workshopId === s.workshopId)) return { mag: false, reden: "Deze workshop staat niet in je profiel." };
  if (!s.positions.some((p) => p.gepubliceerd && !p.gesloten)) return { mag: false, reden: "Deze opdracht staat niet meer open." };

  const nu = new Date();
  const vereist = new Set(s.workshop.vereisteDocumenten);
  for (const type of vereist) {
    const doc = t.documents.find((d) => d.type === type);
    if (!isGeldig(doc, nu)) {
      return { mag: false, reden: "Er ontbreekt een verplicht document in je profiel." };
    }
  }
  return { mag: true };
}

export async function aanmelden(positionId: string, motivatie?: string) {
  const { user, teacher } = await mijnProfiel();
  const pos = await db.staffingPosition.findUnique({
    where: { id: positionId },
    include: { session: { include: { workshop: true } }, assignments: true },
  });
  if (!pos) return { fout: "Positie niet gevonden." };
  if (!pos.gepubliceerd || pos.gesloten) return { fout: "Deze opdracht staat niet meer open." };

  const check = await magOpdracht(pos.sessionId);
  if (!check.mag) return { fout: check.reden };

  // Dubbele boeking bij de docent zelf voorkomen
  const dag = new Date(pos.session.datum); dag.setHours(0, 0, 0, 0);
  const volgende = new Date(dag); volgende.setDate(volgende.getDate() + 1);
  const eigen = await db.assignment.findMany({
    where: { teacherId: teacher.id, uitgevallen: false, position: { session: { datum: { gte: dag, lt: volgende } } } },
    include: { position: { include: { session: true } } },
  });
  if (eigen.some((a) => !(a.position.session.eindTijd <= pos.session.startTijd || a.position.session.startTijd >= pos.session.eindTijd))) {
    return { fout: "Je hebt op dat tijdstip al een opdracht staan." };
  }

  try {
    await db.application.create({
      data: { positionId, teacherId: teacher.id, soort: "AANMELDING", status: "AANGEMELD", motivatie: motivatie ?? null, gereageerdOp: new Date() },
    });
  } catch {
    return { fout: "Je hebt je al aangemeld voor deze positie." };
  }

  await herberekenStatus(pos.sessionId);
  await meld({
    userId: user.id,
    email: user.email,
    sleutel: "AANMELDING_ONTVANGEN",
    vars: { voornaam: teacher.voornaam, workshop: pos.session.workshop.naam, datum: fmtDatum(pos.session.datum) },
    idempotencyKey: `apply:${positionId}:${teacher.id}`,
  });
  await logAudit({ userId: user.id, actie: "DOCENT_AANGEMELD", entiteit: "StaffingPosition", entiteitId: positionId, ip: ipAdres() });
  revalidatePath("/docent/opdrachten");
  revalidatePath("/docent/mijn");
  return { ok: true };
}

export async function aanmeldingIntrekken(applicationId: string) {
  const { user, teacher } = await mijnProfiel();
  const a = await db.application.findUnique({ where: { id: applicationId }, include: { position: true } });
  if (!a || a.teacherId !== teacher.id) return { fout: "Aanmelding niet gevonden." };
  if (["GESELECTEERD", "BEVESTIGD"].includes(a.status)) {
    return { fout: "Je bent al ingepland. Neem contact op met de planner." };
  }
  await db.application.update({ where: { id: applicationId }, data: { status: "INGETROKKEN" } });
  await herberekenStatus(a.position.sessionId);
  await logAudit({ userId: user.id, actie: "AANMELDING_INGETROKKEN", entiteit: "Application", entiteitId: applicationId, ip: ipAdres() });
  revalidatePath("/docent/mijn");
  return { ok: true };
}

export async function uitnodigingBeantwoorden(applicationId: string, akkoord: boolean, reden?: string) {
  const { user, teacher } = await mijnProfiel();
  const a = await db.application.findUnique({
    where: { id: applicationId },
    include: { position: { include: { session: true, assignments: true } } },
  });
  if (!a || a.teacherId !== teacher.id) return { fout: "Uitnodiging niet gevonden." };
  if (a.reactieDeadline && a.reactieDeadline < new Date()) {
    await db.application.update({ where: { id: applicationId }, data: { status: "VERLOPEN" } });
    return { fout: "De reactietermijn van deze uitnodiging is verlopen." };
  }

  if (!akkoord) {
    await db.application.update({ where: { id: applicationId }, data: { status: "GEWEIGERD", motivatie: reden ?? null, gereageerdOp: new Date() } });
    await logAudit({ userId: user.id, actie: "UITNODIGING_GEWEIGERD", entiteit: "Application", entiteitId: applicationId, ip: ipAdres() });
    revalidatePath("/docent/mijn");
    return { ok: true };
  }

  const bezet = a.position.assignments.filter((x) => !x.uitgevallen).length;
  if (bezet >= a.position.aantal) return { fout: "Deze plek is inmiddels vergeven." };

  await db.$transaction(async (tx) => {
    await tx.application.update({ where: { id: applicationId }, data: { status: "TOEGEWEZEN", gereageerdOp: new Date() } });
    await tx.assignment.create({ data: { positionId: a.positionId, teacherId: teacher.id, toegewezenOp: new Date() } });
    if (bezet + 1 >= a.position.aantal) {
      await tx.staffingPosition.update({ where: { id: a.positionId }, data: { gesloten: true } });
    }
  });

  await herberekenStatus(a.position.sessionId);
  await logAudit({ userId: user.id, actie: "UITNODIGING_GEACCEPTEERD", entiteit: "Application", entiteitId: applicationId, ip: ipAdres() });
  revalidatePath("/docent/mijn");
  return { ok: true };
}

export async function werkregistratieIndienen(assignmentId: string, formData: FormData) {
  const { user, teacher } = await mijnProfiel();
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { position: { include: { session: { include: { workshop: true, location: true } } } }, workReg: true },
  });
  if (!a || a.teacherId !== teacher.id) return { fout: "Opdracht niet gevonden." };
  if (a.workReg && ["GOEDGEKEURD", "KLAAR_VOOR_BETALING", "BETAALD"].includes(a.workReg.status)) {
    return { fout: "Deze declaratie is al verwerkt." };
  }

  const startTijd = String(formData.get("startTijd") ?? a.position.session.startTijd);
  const eindTijd = String(formData.get("eindTijd") ?? a.position.session.eindTijd);
  const vervoerRuw = String(formData.get("vervoer") ?? "AUTO");
  const vervoer = (["AUTO", "OV", "FIETS", "ANDERS"].includes(vervoerRuw) ? vervoerRuw : "AUTO") as "AUTO" | "OV" | "FIETS" | "ANDERS";
  const kilometers = Number(formData.get("kilometers") ?? 0);
  const ovKosten = Number(formData.get("ovKosten") ?? 0);
  const parkeerkosten = Number(formData.get("parkeerkosten") ?? 0);
  const overigeKosten = Number(formData.get("overigeKosten") ?? 0);
  const opmerking = String(formData.get("opmerking") ?? "");
  const incident = String(formData.get("incident") ?? "");

  if (!/^\d{2}:\d{2}$/.test(startTijd) || !/^\d{2}:\d{2}$/.test(eindTijd)) return { fout: "Vul de tijden in als uu:mm." };
  const uren = urenTussen(startTijd, eindTijd);
  if (uren <= 0) return { fout: "De eindtijd moet na de starttijd liggen." };
  if (kilometers < 0 || kilometers > 1000) return { fout: "Vul een realistisch aantal kilometers in." };

  // Tarieven uit de instellingen, met het eigen tarief van de workshopdocent als dat afwijkt
  const basisTarieven = await haalTarieven();
  const tarieven = {
    ...basisTarieven,
    uurtarief: Number(teacher.uurtarief ?? 0) > 0 ? Number(teacher.uurtarief) : basisTarieven.uurtarief,
    minimumPerDag: Number(teacher.minDagtarief ?? 0) > 0 ? Number(teacher.minDagtarief) : basisTarieven.minimumPerDag,
    kmTarief: Number(teacher.kmVergoeding ?? 0) > 0 ? Number(teacher.kmVergoeding) : basisTarieven.kmTarief,
  };

  const reistijd = reistijdMin(kilometers);
  const v = berekenVergoeding(
    { uren, kilometers, reistijdMinuten: reistijd, parkeerkosten: parkeerkosten + ovKosten + overigeKosten },
    tarieven
  );
  // Werk en reizen apart bewaren, zodat je later ziet waar het geld heen ging
  const basis = v.uurVergoeding;

  // Reist iemand met het OV, dan vergoeden we het echte kaartje in plaats van kilometers.
  // De reistijdvergoeding geldt in beide gevallen, want de reistijd is dezelfde.
  const kmVergoeding =
    vervoer === "AUTO" || vervoer === "FIETS"
      ? Math.round((v.reiskosten + v.reistijdVergoeding) * 100) / 100
      : Math.round(v.reistijdVergoeding * 100) / 100;

  const totaal = Math.round((basis + kmVergoeding + ovKosten + parkeerkosten + overigeKosten) * 100) / 100;

  const data = {
    teacherId: teacher.id,
    vervoer,
    startTijd, eindTijd, uren, kilometers,
    ovKosten, parkeerkosten, overigeKosten,
    opmerking: opmerking || null,
    incident: incident || null,
    workshopVergoeding: basis,
    kmVergoeding,
    totaal,
    status: "INGEDIEND" as const,
  };

  await db.workRegistration.upsert({
    where: { assignmentId },
    create: { assignmentId, ...data },
    update: data,
  });

  await db.workshopSession.update({ where: { id: a.position.sessionId }, data: { status: "UITGEVOERD" } });
  await logAudit({ userId: user.id, actie: "WERKREGISTRATIE_INGEDIEND", entiteit: "Assignment", entiteitId: assignmentId, nieuw: { uren, vervoer, kilometers, ovKosten, totaal }, ip: ipAdres() });
  revalidatePath("/docent/mijn");
  revalidatePath("/beheer/financieel");
  return { ok: true, totaal };
}

/* ------------------------------------------------------------------ */
/* Profiel                                                             */
/* ------------------------------------------------------------------ */

export async function profielOpslaan(formData: FormData): Promise<{ ok?: boolean; fout?: string }> {
  const { user, teacher } = await mijnProfiel();

  const tekst = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  const getal = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === "") return null;
    return Number(v);
  };

  await db.teacherProfile.update({
    where: { id: teacher.id },
    data: {
      voornaam: tekst("voornaam") ?? teacher.voornaam,
      tussenvoegsel: tekst("tussenvoegsel"),
      achternaam: tekst("achternaam") ?? teacher.achternaam,
      telefoon: tekst("telefoon"),
      geboortedatum: formData.get("geboortedatum") ? new Date(String(formData.get("geboortedatum"))) : null,
      noodcontact: tekst("noodcontact"),
      noodcontactTel: tekst("noodcontactTel"),
      straat: tekst("straat"),
      huisnummer: tekst("huisnummer"),
      postcode: tekst("postcode"),
      plaats: tekst("plaats"),
      samenwerking: tekst("samenwerking"),
      standaardVervoer: (["AUTO", "OV", "FIETS", "ANDERS"].includes(tekst("standaardVervoer") ?? "")
        ? tekst("standaardVervoer")
        : null) as never,
      // KvK en btw horen alleen bij een zzp'er, bij freelance maken we ze leeg
      kvk: tekst("samenwerking") === "ZZP" ? tekst("kvk") : null,
      btwNummer: tekst("samenwerking") === "ZZP" ? tekst("btwNummer") : null,
      iban: tekst("iban"),
      rekeninghouder: tekst("rekeninghouder"),
      maxReisAfstand: getal("maxReisAfstand"),
      eigenVervoer: formData.get("eigenVervoer") === "on",
      rijbewijs: formData.get("rijbewijs") === "on",
      ovMogelijk: formData.get("ovMogelijk") === "on",
      talen: String(formData.get("talen") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      doelgroepen: formData.getAll("doelgroepen").map(String).filter(isDoelgroep),
    },
  });

  await logAudit({ userId: user.id, actie: "PROFIEL_GEWIJZIGD", entiteit: "TeacherProfile", entiteitId: teacher.id, ip: ipAdres() });
  revalidatePath("/docent/profiel");
  return { ok: true };
}

export async function profielTerBeoordeling() {
  const { user, teacher } = await mijnProfiel();
  const ontbreekt: string[] = [];
  if (!teacher.telefoon) ontbreekt.push("mobiel telefoonnummer");
  if (!teacher.plaats) ontbreekt.push("woonplaats");
  if (!teacher.iban) ontbreekt.push("bankrekeningnummer");
  const skills = await db.teacherWorkshopSkill.count({ where: { teacherId: teacher.id } });
  if (skills === 0) ontbreekt.push("minimaal één workshop");
  if (ontbreekt.length) return { fout: `Vul eerst nog in: ${ontbreekt.join(", ")}.` };

  await db.teacherProfile.update({ where: { id: teacher.id }, data: { status: "TER_BEOORDELING" } });
  await logAudit({ userId: user.id, actie: "PROFIEL_TER_BEOORDELING", entiteit: "TeacherProfile", entiteitId: teacher.id, ip: ipAdres() });
  revalidatePath("/docent/profiel");
  return { ok: true };
}

export async function beschikbaarheidZetten(datumIso: string, beschikbaar: boolean) {
  const { teacher } = await mijnProfiel();
  const d = new Date(datumIso);
  d.setHours(12, 0, 0, 0);
  const dagStart = new Date(d); dagStart.setHours(0, 0, 0, 0);
  const dagEind = new Date(dagStart); dagEind.setDate(dagEind.getDate() + 1);

  await db.availability.deleteMany({ where: { teacherId: teacher.id, datum: { gte: dagStart, lt: dagEind } } });
  await db.availability.create({ data: { teacherId: teacher.id, datum: d, beschikbaar } });

  return { ok: true };
}

export async function weekdagBeschikbaarheid(weekdag: number, beschikbaar: boolean) {
  const { teacher } = await mijnProfiel();
  await db.availability.deleteMany({ where: { teacherId: teacher.id, weekdag } });
  if (beschikbaar) await db.availability.create({ data: { teacherId: teacher.id, weekdag, beschikbaar: true } });
  revalidatePath("/docent/profiel");
  return { ok: true };
}

export async function meldingGelezen(id: string) {
  const u = await vereisGebruiker();
  await db.notification.updateMany({ where: { id, userId: u.id }, data: { gelezen: true } });
  revalidatePath("/docent/meldingen");
  return { ok: true };
}

export async function alleMeldingenGelezen() {
  const u = await vereisGebruiker();
  await db.notification.updateMany({ where: { userId: u.id, gelezen: false }, data: { gelezen: true } });
  revalidatePath("/docent/meldingen");
  revalidatePath("/beheer");
  return { ok: true };
}
