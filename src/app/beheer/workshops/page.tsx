import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge } from "@/components/ui";
import { euro, label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WorkshopsPagina() {
  await vereisGebruiker();
  const categorieen = await db.workshopCategory.findMany({
    orderBy: { volgorde: "asc" },
    include: { workshops: { orderBy: { naam: "asc" }, include: { _count: { select: { skills: true, sessions: true } } } } },
  });

  return (
    <>
      <PaginaKop titel="Workshops" sub="De centrale catalogus die docenten aan hun profiel koppelen" />
      <div className="space-y-6">
        {categorieen.map((c) => (
          <section key={c.id}>
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              <span className="h-3 w-3 rounded-full" style={{ background: c.kleur }} aria-hidden />
              {c.naam}
              <span className="text-sm font-normal text-neutral-500">{c.workshops.length} workshops</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {c.workshops.map((w) => (
                <Kaart key={w.id}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{w.naam}</h3>
                    {!w.actief && <Badge kleur="grijs">Inactief</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{w.korteOmschrijving}</p>
                  <dl className="mt-3 space-y-1 text-xs text-neutral-500">
                    <div className="flex justify-between"><dt>Duur</dt><dd>{w.standaardDuur} minuten</dd></div>
                    <div className="flex justify-between"><dt>Maximale groep</dt><dd>{w.maxGroep}</dd></div>
                    <div className="flex justify-between"><dt>Standaardvergoeding</dt><dd>{euro(w.standaardVergoeding)}</dd></div>
                    <div className="flex justify-between"><dt>Docenten met deze workshop</dt><dd>{w._count.skills}</dd></div>
                    <div className="flex justify-between"><dt>Ingepland</dt><dd>{w._count.sessions}x</dd></div>
                  </dl>
                  {w.vereisteDocumenten.length > 0 && (
                    <p className="mt-2 text-xs text-amber-700">Vereist: {w.vereisteDocumenten.map(label).join(", ")}</p>
                  )}
                </Kaart>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
