import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { isBeheer } from "@/lib/rbac";
import { datum as fmtDatum } from "@/lib/format";

export const dynamic = "force-dynamic";

function csv(rijen: (string | number)[][]) {
  return rijen
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
}

export async function GET(req: Request) {
  const u = await vereisGebruiker();
  if (!isBeheer(u.role)) return new NextResponse("Geen toegang", { status: 403 });

  const url = new URL(req.url);
  const van = url.searchParams.get("van") ? new Date(url.searchParams.get("van")!) : new Date(new Date().getFullYear(), 0, 1);
  const tot = url.searchParams.get("tot") ? new Date(url.searchParams.get("tot")!) : new Date(new Date().getFullYear() + 1, 0, 1);

  const sessies = await db.workshopSession.findMany({
    where: { datum: { gte: van, lt: tot } },
    orderBy: { datum: "asc" },
    include: {
      workshop: true,
      location: true,
      project: { include: { client: true } },
      positions: {
        include: {
          assignments: { include: { teacher: true, workReg: true } },
        },
      },
    },
  });

  const rijen: (string | number)[][] = [
    [
      "Datum", "Start", "Eind", "Workshop", "Klant", "Locatie", "Plaats",
      "Status", "Ordernummer", "Docenten", "Posities", "Bezet",
      "Vergoeding", "Docentkosten", "Kilometers",
    ],
  ];

  for (const s of sessies) {
    const toewijzingen = s.positions.flatMap((p) => p.assignments.filter((a) => !a.uitgevallen));
    const kosten = toewijzingen.reduce((n, a) => n + Number(a.workReg?.totaal ?? 0), 0);
    const km = toewijzingen.reduce((n, a) => n + Number(a.workReg?.kilometers ?? 0), 0);
    rijen.push([
      fmtDatum(s.datum),
      s.startTijd,
      s.eindTijd,
      s.workshop.naam,
      s.project.client.naam,
      s.location?.naam ?? "",
      s.location?.plaats ?? "",
      s.status,
      s.project.ordernummer,
      toewijzingen.map((a) => `${a.teacher.voornaam} ${a.teacher.achternaam}`).join(", "),
      s.positions.reduce((n, p) => n + p.aantal, 0),
      toewijzingen.filter((a) => !a.uitgevallen).length,
      Number(s.vergoeding).toFixed(2).replace(".", ","),
      kosten.toFixed(2).replace(".", ","),
      km,
    ]);
  }

  const body = "\uFEFF" + csv(rijen);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="skool-rapportage-${van.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
