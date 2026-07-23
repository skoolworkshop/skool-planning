"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { vereisRol, vereisGebruiker, ipAdres, hashWachtwoord } from "@/lib/auth";
import { PLANNEN, FINANCIEEL } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { meld } from "@/lib/notify";
import { datum as fmtDatum, euro } from "@/lib/format";
import crypto from "crypto";

const APP = () => process.env.APP_URL ?? "http://localhost:3000";

/* ------------------------------------------------------------------ */
/* Docenten                                                            */
/* ------------------------------------------------------------------ */

export async function docentUitnodigen(formData: FormData) {
  const u = await vereisRol(...PLANNEN);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const voornaam = String(formData.get("voornaam") ?? "").trim();
  const achternaam = String(formData.get("achternaam") ?? "").trim();
  if (!email || !voornaam || !achternaam) return { fout: "Vul voornaam, achternaam en e-mailadres in." };

  const bestaat = await db.user.findUnique({ where: { email } });
  if (bestaat) return { fout: "Er bestaat al een account met dit e-mailadres." };

  const token = crypto.randomUUID().replace(/-/g, "");
  const user = await db.user.create({
    data: {
      email,
      role: "DOCENT",
      inviteToken: token,
      inviteExpires: new Date(Date.now() + 14 * 24 * 60 * 60_000),
      teacher: { create: { voornaam, achternaam, status: "UITGENODIGD" } },
    },
    include: { teacher: true },
  });

  await meld({
    userId: user.id,
    email,
    sleutel: "UITNODIGING_ACCOUNT",
    vars: { voornaam },
    link: `${APP()}/wachtwoord/${token}`,
    idempotencyKey: `invite:${user.id}`,
  });
  await logAudit({ userId: u.id, actie: "DOCENT_UITGENODIGD", entiteit: "TeacherProfile", entiteitId: user.teacher!.id, ip: ipAdres() });
  revalidatePath("/beheer/docenten");
  return { ok: true, id: user.teacher!.id };
}

export async function docentStatus(teacherId: string, status: "GOEDGEKEURD" | "AANVULLING_NODIG" | "AFGEWEZEN" | "INACTIEF" | "GEBLOKKEERD", reden?: string) {
  const u = await vereisRol(...PLANNEN);
  const t = await db.teacherProfile.findUnique({ where: { id: teacherId }, include: { user: true } });
  if (!t) return { fout: "Docent niet gevonden." };

  await db.teacherProfile.update({
    where: { id: teacherId },
    data: { status, goedgekeurdOp: status === "GOEDGEKEURD" ? new Date() : null, interneNotitie: reden ?? t.interneNotitie },
  });

  if (status === "GOEDGEKEURD") {
    await meld({
      userId: t.userId,
      email: t.user.email,
      telefoon: t.telefoon,
      sleutel: "PROFIEL_GOEDGEKEURD",
      vars: { voornaam: t.voornaam },
      link: `${APP()}/docent/opdrachten`,
      idempotencyKey: `approved:${teacherId}`,
    });
  }
  await logAudit({ userId: u.id, actie: `DOCENT_${status}`, entiteit: "TeacherProfile", entiteitId: teacherId, oud: { status: t.status }, nieuw: { status }, ip: ipAdres() });
  revalidatePath(`/beheer/docenten/${teacherId}`);
  revalidatePath("/beheer/docenten");
  return { ok: true };
}

export async function documentBeoordelen(docId: string, status: "GOEDGEKEURD" | "AFGEKEURD", opmerking?: string) {
  const u = await vereisRol(...PLANNEN);
  await db.teacherDocument.update({
    where: { id: docId },
    data: { status, opmerking: opmerking ?? null, gecontroleerdDoor: u.email, gecontroleerdOp: new Date() },
  });
  await logAudit({ userId: u.id, actie: `DOCUMENT_${status}`, entiteit: "TeacherDocument", entiteitId: docId, ip: ipAdres() });
  revalidatePath("/beheer/docenten");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Publiceren en uitnodigen                                            */
/* ------------------------------------------------------------------ */

async function passendeDocenten(sessionId: string) {
  const sessie = await db.workshopSession.findUnique({ where: { id: sessionId } });
  if (!sessie) return [];
  return db.teacherProfile.findMany({
    where: { status: "GOEDGEKEURD", skills: { some: { workshopId: sessie.workshopId } } },
    include: { user: true },
  });
}

export async function positiePubliceren(positionId: string) {
  const u = await vereisRol(...PLANNEN);
  const pos = await db.staffingPosition.findUnique({
    where: { id: positionId },
    include: { session: { include: { workshop: true, location: true, project: true } } },
  });
  if (!pos) return { fout: "Positie niet gevonden." };
  if (pos.gepubliceerd) return { fout: "Deze positie is al gepubliceerd." };

  await db.$transaction([
    db.staffingPosition.update({ where: { id: positionId }, data: { gepubliceerd: true } }),
    db.workshopSession.update({
      where: { id: pos.sessionId },
      data: { status: "DOCENTEN_GEZOCHT", publicatieDatum: new Date() },
    }),
    db.project.update({ where: { id: pos.session.projectId }, data: { status: "PLANNING_GESTART" } }),
  ]);

  const docenten = await passendeDocenten(pos.sessionId);
  for (const d of docenten) {
    await meld({
      userId: d.userId,
      email: d.user.email,
      telefoon: d.telefoon,
      whatsapp: true,
      sleutel: "NIEUWE_OPDRACHT",
      vars: {
        voornaam: d.voornaam,
        workshop: pos.session.workshop.naam,
        datum: fmtDatum(pos.session.datum),
        starttijd: pos.session.startTijd,
        eindtijd: pos.session.eindTijd,
        plaats: pos.session.location?.plaats ?? "",
        vergoeding: euro(pos.vergoeding),
        reactiedeadline: pos.session.aanmeldDeadline ? fmtDatum(pos.session.aanmeldDeadline) : "zo snel mogelijk",
      },
      link: `${APP()}/docent/opdrachten/${pos.sessionId}`,
      idempotencyKey: `publish:${positionId}:${d.id}`,
    });
  }

  await logAudit({ userId: u.id, actie: "POSITIE_GEPUBLICEERD", entiteit: "StaffingPosition", entiteitId: positionId, ip: ipAdres() });
  revalidatePath(`/beheer/opdrachten/${pos.sessionId}`);
  return { ok: true, verstuurd: docenten.length };
}

export async function directUitnodigen(positionId: string, teacherIds: string[], deadlineDagen = 3) {
  const u = await vereisRol(...PLANNEN);
  const pos = await db.staffingPosition.findUnique({
    where: { id: positionId },
    include: { session: { include: { workshop: true, location: true } } },
  });
  if (!pos) return { fout: "Positie niet gevonden." };

  const deadline = new Date(Date.now() + deadlineDagen * 24 * 60 * 60_000);
  let n = 0;

  for (const teacherId of teacherIds) {
    const t = await db.teacherProfile.findUnique({ where: { id: teacherId }, include: { user: true } });
    if (!t) continue;
    try {
      await db.application.create({
        data: { positionId, teacherId, soort: "UITNODIGING", status: "UITGENODIGD", reactieDeadline: deadline },
      });
    } catch {
      continue; // al uitgenodigd of aangemeld, unieke constraint
    }
    await meld({
      userId: t.userId,
      email: t.user.email,
      telefoon: t.telefoon,
      whatsapp: true,
      sleutel: "DIRECTE_UITNODIGING",
      vars: {
        voornaam: t.voornaam,
        workshop: pos.session.workshop.naam,
        datum: fmtDatum(pos.session.datum),
        starttijd: pos.session.startTijd,
        eindtijd: pos.session.eindTijd,
        plaats: pos.session.location?.plaats ?? "",
        vergoeding: euro(pos.vergoeding),
        reactiedeadline: fmtDatum(deadline),
      },
      link: `${APP()}/docent/opdrachten/${pos.sessionId}`,
      idempotencyKey: `invite:${positionId}:${teacherId}`,
    });
    n++;
  }

  await db.workshopSession.update({ where: { id: pos.sessionId }, data: { status: "DOCENTEN_GEZOCHT" } });
  await logAudit({ userId: u.id, actie: "DOCENTEN_UITGENODIGD", entiteit: "StaffingPosition", entiteitId: positionId, nieuw: { aantal: n }, ip: ipAdres() });
  revalidatePath(`/beheer/opdrachten/${pos.sessionId}`);
  return { ok: true, aantal: n };
}

/* ------------------------------------------------------------------ */
/* Toewijzen                                                           */
/* ------------------------------------------------------------------ */

export async function docentToewijzen(positionId: string, teacherId: string, opties?: { conflictReden?: string }) {
  const u = await vereisRol(...PLANNEN);

  const pos = await db.staffingPosition.findUnique({
    where: { id: positionId },
    include: {
      assignments: true,
      session: { include: { workshop: true, location: true, project: true } },
    },
  });
  if (!pos) return { fout: "Positie niet gevonden." };

  const bezet = pos.assignments.filter((a) => !a.uitgevallen).length;
  if (bezet >= pos.aantal) return { fout: "Deze positie is al volledig bezet." };

  const t = await db.teacherProfile.findUnique({
    where: { id: teacherId },
    include: {
      user: true,
      skills: true,
      documents: true,
      assignments: { include: { position: { include: { session: true } } } },
    },
  });
  if (!t) return { fout: "Workshopdocent niet gevonden." };
  if (t.status !== "GOEDGEKEURD") return { fout: "Deze workshopdocent is nog niet goedgekeurd." };

  // Mag deze workshopdocent deze workshop zelfstandig geven?
  const skill = t.skills.find((sk) => sk.workshopId === pos.session.workshopId);
  if (!skill || skill.bevoegdheid === "NIET_INZETBAAR") {
    return { fout: "Deze workshopdocent is niet bevoegd voor deze workshop." };
  }
  if (skill.bevoegdheid === "ASSISTEREN" && pos.rol === "WORKSHOPDOCENT") {
    return { fout: "Deze workshopdocent mag deze workshop alleen assisteren, niet zelfstandig geven." };
  }

  // Zijn de verplichte documenten in orde? Een VOG kent geen vervaldatum.
  const ontbreekt = pos.vereisteDocumenten.filter((type) => {
    const doc = t.documents.find((d) => d.type === type);
    if (!doc || doc.status !== "GOEDGEKEURD") return true;
    if (type === "VOG") return false;
    return doc.vervaldatum ? doc.vervaldatum < pos.session.datum : false;
  });
  if (ontbreekt.length > 0 && !opties?.conflictReden) {
    return { fout: `Deze workshopdocent mist een geldig document: ${ontbreekt.join(", ")}. Geef een reden op om dit toch door te zetten.`, conflict: true };
  }

  // Dubbele boeking controleren
  const dag = new Date(pos.session.datum); dag.setHours(0, 0, 0, 0);
  const volgende = new Date(dag); volgende.setDate(volgende.getDate() + 1);
  const conflict = t.assignments.find((a) => {
    const s = a.position.session;
    return (
      !a.uitgevallen &&
      s.datum >= dag && s.datum < volgende &&
      !(s.eindTijd <= pos.session.startTijd || s.startTijd >= pos.session.eindTijd)
    );
  });
  if (conflict && !opties?.conflictReden) {
    return { fout: "Deze workshopdocent heeft op dit tijdstip al een opdracht. Geef een reden op om dit toch door te zetten.", conflict: true };
  }

  // De toewijzing is direct definitief. Geen bevestiging door de workshopdocent meer.
  await db.$transaction(async (tx) => {
    await tx.assignment.create({
      data: { positionId, teacherId, toegewezenDoor: u.id, toegewezenOp: new Date() },
    });
    await tx.application.updateMany({
      where: { positionId, teacherId },
      data: { status: "TOEGEWEZEN", gereageerdOp: new Date() },
    });
  });

  const nuBezet = bezet + 1;
  if (nuBezet >= pos.aantal) {
    await db.staffingPosition.update({ where: { id: positionId }, data: { gesloten: true } });
    // Overige kandidaten netjes informeren
    const rest = await db.application.findMany({
      where: { positionId, status: { in: ["AANGEMELD", "IN_BEHANDELING", "UITGENODIGD", "BEKEKEN"] } },
      include: { teacher: { include: { user: true } } },
    });
    for (const a of rest) {
      await db.application.update({ where: { id: a.id }, data: { status: "AFGEWEZEN" } });
      await meld({
        userId: a.teacher.userId,
        email: a.teacher.user.email,
        sleutel: "AFGEWEZEN",
        vars: { voornaam: a.teacher.voornaam, workshop: pos.session.workshop.naam, datum: fmtDatum(pos.session.datum) },
        idempotencyKey: `reject:${a.id}`,
      });
    }
  }
  await herberekenStatus(pos.sessionId);

  await meld({
    userId: t.userId,
    email: t.user.email,
    telefoon: t.telefoon,
    whatsapp: true,
    sleutel: "GESELECTEERD",
    vars: {
      voornaam: t.voornaam,
      workshop: pos.session.workshop.naam,
      datum: fmtDatum(pos.session.datum),
      starttijd: pos.session.startTijd,
      eindtijd: pos.session.eindTijd,
      plaats: pos.session.location?.plaats ?? "",
      vergoeding: euro(pos.vergoeding),
    },
    link: `${APP()}/docent/mijn`,
    idempotencyKey: `assign:${positionId}:${teacherId}`,
  });

  await logAudit({
    userId: u.id,
    actie: "DOCENT_TOEGEWEZEN",
    entiteit: "StaffingPosition",
    entiteitId: positionId,
    nieuw: { teacherId, definitief: true, reden: opties?.conflictReden ?? null },
    ip: ipAdres(),
  });
  revalidatePath(`/beheer/opdrachten/moment/${pos.sessionId}`);
  revalidatePath(`/beheer/opdrachten/${pos.session.projectId}`);
  return { ok: true };
}

export async function toewijzingIntrekken(assignmentId: string, reden: string) {
  const u = await vereisRol(...PLANNEN);
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { position: { include: { session: { include: { workshop: true } } } }, teacher: { include: { user: true } } },
  });
  if (!a) return { fout: "Toewijzing niet gevonden." };

  await db.$transaction([
    db.assignment.delete({ where: { id: assignmentId } }),
    db.staffingPosition.update({ where: { id: a.positionId }, data: { gesloten: false } }),
    db.application.updateMany({ where: { positionId: a.positionId, teacherId: a.teacherId }, data: { status: "INGETROKKEN" } }),
  ]);
  await herberekenStatus(a.position.sessionId);
  await logAudit({ userId: u.id, actie: "TOEWIJZING_INGETROKKEN", entiteit: "Assignment", entiteitId: assignmentId, nieuw: { reden }, ip: ipAdres() });
  revalidatePath(`/beheer/opdrachten/moment/${a.position.sessionId}`);
  return { ok: true };
}

export async function aanmeldingStatus(applicationId: string, status: "IN_BEHANDELING" | "AFGEWEZEN", notitie?: string) {
  const u = await vereisRol(...PLANNEN);
  const a = await db.application.findUnique({
    where: { id: applicationId },
    include: { teacher: { include: { user: true } }, position: { include: { session: { include: { workshop: true } } } } },
  });
  if (!a) return { fout: "Aanmelding niet gevonden." };

  await db.application.update({ where: { id: applicationId }, data: { status, interneBeoordeling: notitie ?? a.interneBeoordeling } });

  if (status === "AFGEWEZEN") {
    await meld({
      userId: a.teacher.userId,
      email: a.teacher.user.email,
      sleutel: "AFGEWEZEN",
      vars: { voornaam: a.teacher.voornaam, workshop: a.position.session.workshop.naam, datum: fmtDatum(a.position.session.datum) },
      idempotencyKey: `appstatus:${applicationId}:${status}`,
    });
  }
  await logAudit({ userId: u.id, actie: `AANMELDING_${status}`, entiteit: "Application", entiteitId: applicationId, ip: ipAdres() });
  revalidatePath("/beheer/aanmeldingen");
  revalidatePath(`/beheer/opdrachten/moment/${a.position.sessionId}`);
  return { ok: true };
}

/**
 * Zet de sessiestatus op basis van het aantal gevulde posities.
 * Wordt intern aangeroepen, maar staat als serveractie in dit bestand,
 * dus we controleren alsnog of er iemand is ingelogd.
 */
export async function herberekenStatus(sessionId: string) {
  await vereisGebruiker();
  const s = await db.workshopSession.findUnique({
    where: { id: sessionId },
    include: { positions: { include: { assignments: true, applications: true } } },
  });
  if (!s || s.status === "GEANNULEERD" || s.status === "UITGEVOERD") return;

  const nodig = s.positions.reduce((n, p) => n + p.aantal, 0);
  const bezet = s.positions.reduce((n, p) => n + p.assignments.filter((a) => !a.uitgevallen).length, 0);
  const aanmeldingen = s.positions.reduce((n, p) => n + p.applications.filter((a) => a.status === "AANGEMELD").length, 0);
  const gepubliceerd = s.positions.some((p) => p.gepubliceerd);

  let status = s.status;
  if (bezet === 0) status = aanmeldingen > 0 ? "AANMELDINGEN_ONTVANGEN" : gepubliceerd ? "DOCENTEN_GEZOCHT" : "NIET_GEPUBLICEERD";
  else if (bezet < nodig) status = "GEDEELTELIJK_BEZET";
  else status = "VOLLEDIG_BEZET";

  await db.workshopSession.update({ where: { id: sessionId }, data: { status } });

  const project = await db.project.findUnique({ where: { id: s.projectId }, include: { sessions: true } });
  if (project && !["GEANNULEERD", "UITGEVOERD", "FINANCIEEL_AFGEROND", "GEARCHIVEERD"].includes(project.status)) {
    const alles = project.sessions.every((x) => x.status === "VOLLEDIG_BEZET" || x.id === sessionId ? status === "VOLLEDIG_BEZET" : false);
    await db.project.update({ where: { id: project.id }, data: { status: alles ? "VOLLEDIG_BEZET" : "PLANNING_GESTART" } });
  }
}

export async function sessieAnnuleren(sessionId: string, reden: string) {
  const u = await vereisRol(...PLANNEN);
  const s = await db.workshopSession.findUnique({
    where: { id: sessionId },
    include: { workshop: true, positions: { include: { assignments: { include: { teacher: { include: { user: true } } } } } } },
  });
  if (!s) return { fout: "Opdracht niet gevonden." };

  await db.workshopSession.update({ where: { id: sessionId }, data: { status: "GEANNULEERD", bijzonderheden: reden } });

  for (const p of s.positions) {
    for (const a of p.assignments) {
      await meld({
        userId: a.teacher.userId,
        email: a.teacher.user.email,
        telefoon: a.teacher.telefoon,
        whatsapp: true,
        sleutel: "OPDRACHT_GEANNULEERD",
        vars: { voornaam: a.teacher.voornaam, workshop: s.workshop.naam, datum: fmtDatum(s.datum) },
        idempotencyKey: `cancel:${sessionId}:${a.teacherId}`,
      });
    }
  }
  await logAudit({ userId: u.id, actie: "OPDRACHT_GEANNULEERD", entiteit: "WorkshopSession", entiteitId: sessionId, nieuw: { reden }, ip: ipAdres() });
  revalidatePath(`/beheer/opdrachten/moment/${sessionId}`);
  return { ok: true };
}

export async function docentUitgevallen(assignmentId: string, reden: string) {
  const u = await vereisRol(...PLANNEN);
  const a = await db.assignment.findUnique({ where: { id: assignmentId }, include: { position: true } });
  if (!a) return { fout: "Toewijzing niet gevonden." };
  await db.assignment.update({ where: { id: assignmentId }, data: { uitgevallen: true } });
  await db.staffingPosition.update({ where: { id: a.positionId }, data: { gesloten: false } });
  await herberekenStatus(a.position.sessionId);
  await logAudit({ userId: u.id, actie: "DOCENT_UITGEVALLEN", entiteit: "Assignment", entiteitId: assignmentId, nieuw: { reden }, ip: ipAdres() });
  revalidatePath(`/beheer/opdrachten/moment/${a.position.sessionId}`);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Financieel                                                          */
/* ------------------------------------------------------------------ */

export async function declaratieBeoordelen(
  id: string,
  status: "GOEDGEKEURD" | "AFGEKEURD" | "AANVULLING_NODIG" | "KLAAR_VOOR_BETALING" | "BETAALD",
  reden?: string,
  nieuwTotaal?: number
) {
  const u = await vereisRol(...FINANCIEEL);
  const w = await db.workRegistration.findUnique({
    where: { id },
    include: { teacher: { include: { user: true } }, assignment: { include: { position: { include: { session: { include: { workshop: true } } } } } } },
  });
  if (!w) return { fout: "Declaratie niet gevonden." };
  if (nieuwTotaal !== undefined && !reden) return { fout: "Geef een reden op bij een financiële aanpassing." };

  await db.workRegistration.update({
    where: { id },
    data: {
      status,
      totaal: nieuwTotaal !== undefined ? nieuwTotaal : w.totaal,
      correctieReden: reden ?? w.correctieReden,
      goedgekeurdDoor: u.email,
      goedgekeurdOp: status === "GOEDGEKEURD" || status === "KLAAR_VOOR_BETALING" ? new Date() : null,
      betaaldOp: status === "BETAALD" ? new Date() : null,
    },
  });

  if (status === "GOEDGEKEURD" || status === "KLAAR_VOOR_BETALING") {
    await meld({
      userId: w.teacher.userId,
      email: w.teacher.user.email,
      sleutel: "DECLARATIE_GOEDGEKEURD",
      vars: {
        voornaam: w.teacher.voornaam,
        workshop: w.assignment.position.session.workshop.naam,
        datum: fmtDatum(w.assignment.position.session.datum),
        bedrag: euro(nieuwTotaal ?? w.totaal),
      },
      idempotencyKey: `decl:${id}:goedgekeurd`,
    });
  }
  await logAudit({ userId: u.id, actie: `DECLARATIE_${status}`, entiteit: "WorkRegistration", entiteitId: id, oud: { totaal: w.totaal, status: w.status }, nieuw: { totaal: nieuwTotaal ?? w.totaal, status, reden }, ip: ipAdres() });
  revalidatePath("/beheer/financieel");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Gebruikersbeheer                                                    */
/* ------------------------------------------------------------------ */

export async function medewerkerAanmaken(formData: FormData) {
  const u = await vereisRol("SUPERBEHEERDER");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rol = String(formData.get("rol") ?? "PLANNER") as "PLANNER" | "FINANCIEEL" | "LEZER" | "SUPERBEHEERDER";
  const wachtwoord = String(formData.get("wachtwoord") ?? "");
  if (!email || wachtwoord.length < 10) return { fout: "Vul een e-mailadres en een wachtwoord van minimaal 10 tekens in." };
  const bestaat = await db.user.findUnique({ where: { email } });
  if (bestaat) return { fout: "Dit e-mailadres is al in gebruik." };

  const nieuw = await db.user.create({
    data: { email, role: rol, passwordHash: await hashWachtwoord(wachtwoord), emailVerified: new Date() },
  });
  await logAudit({ userId: u.id, actie: "MEDEWERKER_AANGEMAAKT", entiteit: "User", entiteitId: nieuw.id, nieuw: { email, rol }, ip: ipAdres() });
  revalidatePath("/beheer/instellingen");
  return { ok: true };
}
