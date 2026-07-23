import { NextResponse } from "next/server";
import { vereisGebruiker } from "@/lib/auth";
import { isBeheer } from "@/lib/rbac";
import { haalInschrijving, bouwLijst, LIJST_TITEL, type LijstSoort } from "@/lib/inschrijving-lijsten";

export const dynamic = "force-dynamic";

function csv(rijen: string[][]) {
  return rijen.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
}

export async function GET(_req: Request, { params }: { params: { id: string; soort: string } }) {
  const u = await vereisGebruiker();
  if (!isBeheer(u.role)) return new NextResponse("Geen toegang", { status: 403 });

  const soort = params.soort as LijstSoort;
  if (!(soort in LIJST_TITEL)) return new NextResponse("Onbekende lijst", { status: 404 });

  const e = await haalInschrijving(params.id);
  if (!e) return new NextResponse("Niet gevonden", { status: 404 });

  const { kop, rijen } = bouwLijst(e, soort);
  const body = "\uFEFF" + csv([kop, ...rijen]);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${soort}-${e.titel.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.csv"`,
    },
  });
}
