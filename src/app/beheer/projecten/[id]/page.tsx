import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, PaginaKop, Badge, statusKleur, Rij } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: { id: string } }) {
  await vereisGebruiker();
  const p = await db.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      location: true,
      sessions: {
        orderBy: [{ datum: "asc" }, { startTijd: "asc" }],
        include: { workshop: true, rounds: true, positions: { include: { assignments: true } } },
      },
    },
  });
  if (!p) notFound();

  const docentkosten = p.sessions.flatMap((s) => s.positions).reduce((n, x) => n + Number(x.vergoeding) * x.aantal, 0);
  const marge = Number(p.omzet) - docentkosten - Number(p.materiaalkosten);

  return (
    <>
      <Link href="/beheer/projecten" className="mb-3 inline-block text-sm text-neutral-500 hover:text-skool-600">← Terug naar projecten</Link>
      <PaginaKop titel={p.naam} sub={`${p.ordernummer} · ${p.client.naam}`} actie={<Badge kleur={statusKleur(p.status)}>{label(p.status)}</Badge>} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Kaart>
            <h2 className="mb-3 font-semibold">Workshopmomenten</h2>
            <ul className="divide-y divide-neutral-100">
              {p.sessions.map((s) => {
                const nodig = s.positions.reduce((n, x) => n + x.aantal, 0);
                const bezet = s.positions.reduce((n, x) => n + x.assignments.filter((a) => !a.reserve && !a.uitgevallen).length, 0);
                return (
                  <li key={s.id}>
                    <Link href={`/beheer/opdrachten/${s.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 hover:bg-neutral-50">
                      <span className="w-24 text-sm font-semibold">{datum(s.datum)}</span>
                      <span className="w-24 text-sm text-neutral-500">{s.startTijd} tot {s.eindTijd}</span>
                      <span className="flex-1 text-sm font-medium">{s.workshop.naam}</span>
                      {s.rounds.length > 1 && <span className="text-xs text-neutral-500">{s.rounds.length} rondes</span>}
                      <Badge kleur={bezet >= nodig ? "groen" : bezet > 0 ? "geel" : "rood"}>{bezet} van {nodig}</Badge>
                      <Badge kleur={statusKleur(s.status)}>{label(s.status)}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Kaart>
        </div>

        <div className="space-y-5">
          <Kaart>
            <h2 className="mb-2 font-semibold">Klant en locatie</h2>
            <Rij label="Klant">{p.client.naam}</Rij>
            <Rij label="Klanttype">{label(p.client.type)}</Rij>
            <Rij label="Locatie">{p.location ? `${p.location.naam}, ${p.location.plaats}` : ""}</Rij>
            <Rij label="Periode">{datum(p.startDatum)}{p.eindDatum ? ` tot ${datum(p.eindDatum)}` : ""}</Rij>
          </Kaart>
          <Kaart>
            <h2 className="mb-2 font-semibold">Financieel</h2>
            <Rij label="Omzet">{euro(p.omzet)}</Rij>
            <Rij label="Verwachte docentkosten">{euro(docentkosten)}</Rij>
            <Rij label="Materiaalkosten">{euro(p.materiaalkosten)}</Rij>
            <Rij label="Verwachte marge">
              <span className={marge < 0 ? "text-red-700" : "text-emerald-700"}>{euro(marge)}</span>
            </Rij>
          </Kaart>
          {(p.notitie || p.interneNotitie) && (
            <Kaart>
              <h2 className="mb-2 font-semibold">Notities</h2>
              {p.notitie && <p className="whitespace-pre-line text-sm">{p.notitie}</p>}
              {p.interneNotitie && <p className="mt-2 whitespace-pre-line rounded bg-neutral-50 p-2 text-sm text-neutral-600">Intern: {p.interneNotitie}</p>}
            </Kaart>
          )}
        </div>
      </div>
    </>
  );
}
