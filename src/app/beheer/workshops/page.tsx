import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge } from "@/components/ui";
import { euro, label } from "@/lib/format";
import Benodigdheden from "./Benodigdheden";
import Koppeling from "./Koppeling";
import Afbeeldingen from "./Afbeeldingen";

export const dynamic = "force-dynamic";

export default async function WorkshopsPagina() {
  await vereisGebruiker();
  const categorieen = await db.workshopCategory.findMany({
    orderBy: { volgorde: "asc" },
    include: { workshops: { orderBy: { naam: "asc" }, include: { _count: { select: { skills: true, sessions: true } } } } },
  });

  return (
    <>
      <PaginaKop
        titel="Workshops"
        sub="De centrale catalogus. De benodigdheden per workshop komen automatisch in de bevestigingsmail."
        actie={<Afbeeldingen />}
      />
      <div className="space-y-6">
        {categorieen.map((c) => (
          <section key={c.id}>
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              <span className="h-3 w-3 rounded-full" style={{ background: c.kleur }} aria-hidden />
              {c.naam}
              <span className="text-sm font-normal text-zand-500">{c.workshops.length} workshops</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {c.workshops.map((w) => (
                <Kaart key={w.id}>
                  <div className="relative -mx-4 -mt-4 mb-3 aspect-[16/9] overflow-hidden rounded-t-xl bg-zand-200">
                    {w.afbeeldingControle && (
                      <span className="absolute right-2 top-2 z-10 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        Controleren
                      </span>
                    )}
                    {w.afbeeldingUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.afbeeldingUrl} alt={w.afbeeldingAlt ?? w.naam} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center" style={{ background: c.kleur + "22" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/beeldmerk.png" alt="" className="h-12 w-auto opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{w.naam}</h3>
                    {!w.actief && <Badge kleur="grijs">Inactief</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-zand-600">{w.korteOmschrijving}</p>
                  <dl className="mt-3 space-y-1 text-xs text-zand-500">
                    <div className="flex justify-between"><dt>Duur</dt><dd>{w.standaardDuur} minuten</dd></div>
                    <div className="flex justify-between"><dt>Maximale groep</dt><dd>{w.maxGroep}</dd></div>
                    <div className="flex justify-between"><dt>Standaardvergoeding</dt><dd>{euro(w.standaardVergoeding)}</dd></div>
                    <div className="flex justify-between"><dt>Workshopdocenten met deze workshop</dt><dd>{w._count.skills}</dd></div>
                    <div className="flex justify-between"><dt>Ingepland</dt><dd>{w._count.sessions}x</dd></div>
                  </dl>
                  {w.vereisteDocumenten.length > 0 && (
                    <p className="mt-2 text-xs text-amber-700">Vereist: {w.vereisteDocumenten.map(label).join(", ")}</p>
                  )}
                  <div className="mt-2 border-t border-zand-200 pt-2">
                    <Koppeling workshopId={w.id} slug={w.siteSlug ?? ""} controle={w.afbeeldingControle || !w.afbeeldingUrl} />
                  </div>
                  <Benodigdheden
                    workshopId={w.id}
                    naam={w.naam}
                    tekst={w.klantBenodigdheden ?? ""}
                    link={w.voorbeeldLink ?? ""}
                  />
                </Kaart>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
