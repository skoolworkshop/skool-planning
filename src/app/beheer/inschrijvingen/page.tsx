import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge, statusKleur, Leeg } from "@/components/ui";
import { datum, label } from "@/lib/format";
import NieuweInschrijving from "./NieuweInschrijving";

export const dynamic = "force-dynamic";

export default async function InschrijvingenPagina() {
  await vereisGebruiker();

  const [inschrijvingen, projecten] = await Promise.all([
    db.enrollment.findMany({
      include: {
        project: { include: { client: true } },
        rondes: { include: { slots: true } },
        deelnemers: { select: { id: true, ingeschrevenOp: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.project.findMany({
      where: { enrollment: null, deletedAt: null },
      include: { client: true },
      orderBy: { startDatum: "desc" },
      take: 50,
    }),
  ]);

  return (
    <>
      <PaginaKop
        titel="Inschrijvingen"
        sub="Leerlingen kiezen zelf hun workshops, het systeem maakt de indeling"
      />

      <NieuweInschrijving
        projecten={projecten.map((p) => ({
          id: p.id,
          naam: `${p.ordernummer} ${p.naam}`,
          klant: p.client.naam,
        }))}
      />

      {inschrijvingen.length === 0 ? (
        <Leeg
          titel="Nog geen inschrijvingen"
          tekst="Kies hierboven een project van het type cultuurdag of projectdag en zet er een inschrijving op."
        />
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {inschrijvingen.map((e) => {
            const totaal = e.deelnemers.length;
            const klaar = e.deelnemers.filter((d) => d.ingeschrevenOp).length;
            const pct = totaal > 0 ? Math.round((klaar / totaal) * 100) : 0;
            const plekken = e.rondes.reduce((n, r) => n + r.slots.reduce((m, s) => m + s.capaciteit, 0), 0);

            return (
              <Link key={e.id} href={`/beheer/inschrijvingen/${e.id}`} className="kaart block p-4 hover:border-skool-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{e.titel}</div>
                    <div className="text-sm text-neutral-500">{e.project.client.naam}</div>
                    <div className="text-sm text-neutral-500">
                      {e.project.startDatum ? datum(e.project.startDatum) : "Geen datum"} · {e.rondes.length} rondes · {plekken} plekken
                    </div>
                  </div>
                  <Badge kleur={statusKleur(e.status)}>{label(e.status)}</Badge>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>{klaar} van {totaal} leerlingen ingeschreven</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full bg-skool-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
