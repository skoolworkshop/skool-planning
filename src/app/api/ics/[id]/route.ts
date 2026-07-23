import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { huidigeGebruiker } from "@/lib/auth";

export const dynamic = "force-dynamic";

function stamp(datum: Date, tijd: string) {
  const [u, m] = tijd.split(":").map(Number);
  const d = new Date(datum);
  d.setUTCHours(u - 2, m, 0, 0); // Europe/Amsterdam naar UTC, zomertijd
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function veilig(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const u = await huidigeGebruiker();
  if (!u) return new NextResponse("Niet ingelogd", { status: 401 });

  const sessie = await db.workshopSession.findUnique({
    where: { id: params.id },
    include: {
      workshop: true,
      location: true,
      project: { include: { client: true } },
      positions: { include: { assignments: true } },
    },
  });
  if (!sessie) return new NextResponse("Niet gevonden", { status: 404 });

  // Een docent mag alleen zijn eigen opdracht downloaden.
  if (u.role === "DOCENT") {
    const teacher = await db.teacherProfile.findUnique({ where: { userId: u.id } });
    const eigen = sessie.positions.some((p) =>
      p.assignments.some((a) => a.teacherId === teacher?.id && !a.uitgevallen)
    );
    if (!eigen) return new NextResponse("Geen toegang", { status: 403 });
  }

  const loc = sessie.location;
  const adres = loc
    ? [loc.naam, [loc.straat, loc.huisnummer].filter(Boolean).join(" "), loc.postcode, loc.plaats]
        .filter(Boolean)
        .join(", ")
    : "";

  const omschrijving = [
    `Klant: ${sessie.project.client.naam}`,
    sessie.aanwezigVanaf ? `Aanwezig vanaf ${sessie.aanwezigVanaf}` : "",
    sessie.deelnemers ? `Deelnemers: ${sessie.deelnemers}` : "",
    sessie.kleding ? `Kleding: ${sessie.kleding}` : "",
    sessie.benodigdheden ? `Meenemen: ${sessie.benodigdheden}` : "",
    sessie.bijzonderheden ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Skool Workshop//Planning//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${sessie.id}@skoolworkshop.nl`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${stamp(sessie.datum, sessie.startTijd)}`,
    `DTEND:${stamp(sessie.datum, sessie.eindTijd)}`,
    `SUMMARY:${veilig(sessie.workshop.naam + " bij " + sessie.project.client.naam)}`,
    adres ? `LOCATION:${veilig(adres)}` : "",
    `DESCRIPTION:${veilig(omschrijving)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Opdracht Skool Workshop",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="opdracht-${sessie.id.slice(0, 8)}.ics"`,
    },
  });
}
