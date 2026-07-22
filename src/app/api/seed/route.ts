import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vulDemodata } from "@/lib/seed-data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Eenmalige route om de database te vullen met demodata.
 * Werkt alleen met het juiste token uit SEED_TOKEN.
 * Let op: dit gooit eerst alle bestaande gegevens weg.
 * Zet SEED_TOKEN leeg zodra je systeem in gebruik is.
 */
export async function GET(req: Request) {
  const token = process.env.SEED_TOKEN;
  if (!token) {
    return NextResponse.json({ fout: "Seeden staat uit. Zet SEED_TOKEN om het aan te zetten." }, { status: 403 });
  }
  const gegeven = new URL(req.url).searchParams.get("token");
  if (gegeven !== token) {
    return NextResponse.json({ fout: "Ongeldig token." }, { status: 403 });
  }

  try {
    const r = await vulDemodata(db);
    return NextResponse.json({
      ok: true,
      melding: "De database is gevuld met demodata.",
      ...r,
      volgendeStap: "Log in op /login en zet daarna SEED_TOKEN leeg in je omgevingsvariabelen.",
    });
  } catch (e) {
    return NextResponse.json({ fout: e instanceof Error ? e.message : "Onbekende fout" }, { status: 500 });
  }
}
