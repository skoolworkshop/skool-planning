import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { leerlingSessie } from "@/lib/inschrijving-acties";
import { Kaart, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SchoolPortaal() {
  const sessie = await leerlingSessie();
  if (!sessie || !sessie.schoolPortaal) redirect("/inschrijven");

  const e = await db.enrollment.findUnique({
    where: { id: sessie.enrollmentId },
    include: {
      project: { include: { client: true } },
      deelnemers: { orderBy: [{ klas: "asc" }, { voornaam: "asc" }] },
      rondes: {
        orderBy: { nummer: "asc" },
        include: { slots: { include: { workshop: true, _count: { select: { keuzes: true } } } } },
      },
    },
  });
  if (!e) redirect("/inschrijven");

  const totaal = e.deelnemers.length;
  const klaar = e.deelnemers.filter((d) => d.ingeschrevenOp).length;
  const pct = totaal > 0 ? Math.round((klaar / totaal) * 100) : 0;
  const open = e.deelnemers.filter((d) => !d.ingeschrevenOp);
  const perKlas = new Map<string, number>();
  for (const d of open) perKlas.set(d.klas, (perKlas.get(d.klas) ?? 0) + 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">{e.titel}</h1>
        <p className="text-sm text-zand-500">{e.project.client.naam}</p>
      </div>

      <Kaart>
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Voortgang</h2>
          <span className="text-2xl font-bold text-skool-600">{pct}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-zand-100">
          <div className="h-full rounded-full bg-skool-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm text-zand-500">{klaar} van {totaal} leerlingen zijn klaar.</p>
      </Kaart>

      <Kaart>
        <h2 className="font-semibold">Nog niet ingeschreven</h2>
        {open.length === 0 ? (
          <p className="mt-2 text-sm text-zand-500">Iedereen is klaar. Mooi.</p>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...perKlas.entries()].sort().map(([klas, n]) => (
                <Badge key={klas} kleur="geel">{klas}: {n}</Badge>
              ))}
            </div>
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
              {open.map((d) => (
                <li key={d.id} className="flex justify-between border-b border-zand-200 py-1">
                  <span>{[d.voornaam, d.achternaam].filter(Boolean).join(" ")}</span>
                  <span className="text-zand-400">{d.klas}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Kaart>

      <Kaart>
        <h2 className="font-semibold">Vulling per workshop</h2>
        <div className="mt-3 space-y-4">
          {e.rondes.map((r) => (
            <div key={r.id}>
              <div className="text-xs font-semibold uppercase tracking-wide text-zand-500">
                Ronde {r.nummer} · {r.startTijd} tot {r.eindTijd}
              </div>
              <div className="mt-2 space-y-2">
                {r.slots.map((s) => {
                  const pctS = s.capaciteit > 0 ? Math.round((s._count.keuzes / s.capaciteit) * 100) : 0;
                  return (
                    <div key={s.id} className="text-sm">
                      <div className="flex justify-between">
                        <span>{s.workshop.naam}</span>
                        <span className="text-zand-500">{s._count.keuzes} van {s.capaciteit}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zand-100">
                        <div className="h-full rounded-full bg-skool-400" style={{ width: `${Math.min(100, pctS)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Kaart>

      <p className="text-center text-sm text-zand-500">
        Vragen over de dag? Bel of mail Skool Workshop.
      </p>
    </div>
  );
}
