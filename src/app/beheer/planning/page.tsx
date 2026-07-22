import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge, statusKleur } from "@/components/ui";
import { datum, datumLang, label } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];

export default async function PlanningPagina({ searchParams }: { searchParams: { week?: string; weergave?: string } }) {
  await vereisGebruiker();

  const offset = Number(searchParams.week ?? 0);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
  const eind = new Date(start);
  eind.setDate(eind.getDate() + 7);

  const sessies = await db.workshopSession.findMany({
    where: { datum: { gte: start, lt: eind } },
    include: {
      workshop: { select: { naam: true } },
      location: { select: { plaats: true } },
      project: { include: { client: { select: { naam: true } } } },
      positions: { include: { assignments: { include: { teacher: { select: { voornaam: true, achternaam: true } } } } } },
    },
    orderBy: [{ datum: "asc" }, { startTijd: "asc" }],
  });

  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <>
      <PaginaKop
        titel="Planning"
        sub={`Week van ${datumLang(start)}`}
        actie={
          <div className="flex gap-2">
            <Link href={`/beheer/planning?week=${offset - 1}`} className="knop-secundair">Vorige</Link>
            <Link href="/beheer/planning" className="knop-secundair">Deze week</Link>
            <Link href={`/beheer/planning?week=${offset + 1}`} className="knop-secundair">Volgende</Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {dagen.map((d) => {
          const vanDag = sessies.filter((s) => s.datum.toDateString() === d.toDateString());
          const vandaag = d.toDateString() === new Date().toDateString();
          return (
            <div key={d.toISOString()} className={`kaart p-3 ${vandaag ? "border-skool-300 bg-skool-50/40" : ""}`}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold">{DAGEN[(d.getDay() + 6) % 7]} {d.getDate()}</span>
                <span className="text-xs text-neutral-400">{vanDag.length > 0 ? `${vanDag.length}` : ""}</span>
              </div>
              <ul className="space-y-2">
                {vanDag.map((s) => {
                  const nodig = s.positions.reduce((n, p) => n + p.aantal, 0);
                  const toegewezen = s.positions.flatMap((p) => p.assignments).filter((a) => !a.reserve && !a.uitgevallen);
                  return (
                    <li key={s.id}>
                      <Link href={`/beheer/opdrachten/${s.id}`} className="block rounded-lg border border-neutral-200 p-2 text-xs hover:border-skool-300 hover:bg-white">
                        <div className="font-semibold">{s.startTijd} {s.workshop.naam}</div>
                        <div className="text-neutral-500">{s.project.client.naam}, {s.location?.plaats}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge kleur={toegewezen.length >= nodig ? "groen" : toegewezen.length > 0 ? "geel" : "rood"}>
                            {toegewezen.length} van {nodig}
                          </Badge>
                        </div>
                        {toegewezen.length > 0 && (
                          <div className="mt-1 text-neutral-600">
                            {toegewezen.map((a) => `${a.teacher.voornaam} ${a.teacher.achternaam[0]}.`).join(", ")}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
                {vanDag.length === 0 && <li className="py-3 text-center text-xs text-neutral-300">Vrij</li>}
              </ul>
            </div>
          );
        })}
      </div>

      <Kaart className="mt-5">
        <h2 className="mb-2 font-semibold">Legenda</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge kleur="rood">Nog niemand ingepland</Badge>
          <Badge kleur="geel">Gedeeltelijk bezet</Badge>
          <Badge kleur="groen">Volledig bezet</Badge>
        </div>
      </Kaart>
    </>
  );
}
