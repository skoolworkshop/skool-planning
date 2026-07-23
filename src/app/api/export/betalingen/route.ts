import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { magGevoeligeGegevens } from "@/lib/rbac";
import { datum as fmtDatum } from "@/lib/format";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function csv(rijen: (string | number)[][]) {
  return rijen
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
}

export async function GET() {
  const u = await vereisGebruiker();
  if (!magGevoeligeGegevens(u.role)) return new NextResponse("Geen toegang", { status: 403 });

  const regs = await db.workRegistration.findMany({
    where: { status: "KLAAR_VOOR_BETALING" },
    include: {
      teacher: true,
      assignment: { include: { position: { include: { session: { include: { workshop: true } } } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rijen: (string | number)[][] = [
    ["Docent", "IBAN", "Rekeninghouder", "Datum opdracht", "Workshop", "Uren", "Kilometers", "Totaal", "Kenmerk"],
  ];

  for (const r of regs) {
    const s = r.assignment.position.session;
    rijen.push([
      `${r.teacher.voornaam} ${r.teacher.achternaam}`,
      r.teacher.iban ?? "",
      r.teacher.rekeninghouder ?? "",
      fmtDatum(s.datum),
      s.workshop.naam,
      String(r.uren).replace(".", ","),
      r.kilometers,
      Number(r.totaal).toFixed(2).replace(".", ","),
      `SW-${r.id.slice(0, 8).toUpperCase()}`,
    ]);
  }

  await logAudit({ userId: u.id, actie: "EXPORT_BETALINGEN", entiteit: "WorkRegistration", nieuw: { aantal: regs.length } });

  const body = "\uFEFF" + csv(rijen);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="skool-betalingen-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
