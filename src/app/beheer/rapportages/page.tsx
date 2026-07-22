import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Stat } from "@/components/ui";
import { euro, label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RapportagesPagina({ searchParams }: { searchParams: { van?: string; tot?: string } }) {
  await vereisGebruiker();

  const van = searchParams.van ? new Date(searchParams.van) : new Date(new Date().getFullYear(), 0, 1);
  const tot = searchParams.tot ? new Date(searchParams.tot) : new Date(new Date().getFullYear() + 1, 0, 1);

  const [sessies, projecten, declaraties, docenten] = await Promise.all([
    db.workshopSession.findMany({
      where: { datum: { gte: van, lt: tot } },
      include: { workshop: { select: { naam: true } }, positions: { include: { assignments: true } }, project: { include: { client: { select: { naam: true } } } } },
    }),
    db.project.findMany({ where: { startDatum: { gte: van, lt: tot } }, include: { client: { select: { naam: true } } } }),
    db.workRegistration.findMany({
      where: { createdAt: { gte: van, lt: tot } },
      include: { teacher: { select: { voornaam: true, achternaam: true } } },
    }),
    db.teacherProfile.count({ where: { status: "GOEDGEKEURD" } }),
  ]);

  const omzetPerKlant = new Map<string, number>();
  for (const p of projecten) omzetPerKlant.set(p.client.naam, (omzetPerKlant.get(p.client.naam) ?? 0) + Number(p.omzet));

  const perWorkshop = new Map<string, number>();
  for (const s of sessies) perWorkshop.set(s.workshop.naam, (perWorkshop.get(s.workshop.naam) ?? 0) + 1);

  const kostenPerDocent = new Map<string, number>();
  for (const d of declaraties) {
    const naam = `${d.teacher.voornaam} ${d.teacher.achternaam}`;
    kostenPerDocent.set(naam, (kostenPerDocent.get(naam) ?? 0) + Number(d.totaal));
  }

  const totaleOmzet = projecten.reduce((n, p) => n + Number(p.omzet), 0);
  const totaleKosten = declaraties.reduce((n, d) => n + Number(d.totaal), 0);
  const geannuleerd = sessies.filter((s) => s.status === "GEANNULEERD").length;
  const openPosities = sessies.reduce((n, s) => n + s.positions.reduce((m, p) => m + Math.max(0, p.aantal - p.assignments.filter((a) => !a.reserve).length), 0), 0);
  const kilometers = declaraties.reduce((n, d) => n + d.kilometers, 0);

  const top = (m: Map<string, number>, n = 8) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  return (
    <>
      <PaginaKop titel="Rapportages" sub={`Periode ${van.toLocaleDateString("nl-NL")} tot ${tot.toLocaleDateString("nl-NL")}`} />

      <form className="mb-5 flex flex-wrap items-end gap-2">
        <div><label className="label" htmlFor="van">Van</label><input id="van" type="date" name="van" defaultValue={van.toISOString().slice(0, 10)} className="veld" /></div>
        <div><label className="label" htmlFor="tot">Tot</label><input id="tot" type="date" name="tot" defaultValue={tot.toISOString().slice(0, 10)} className="veld" /></div>
        <button className="knop-secundair">Toepassen</button>
        <a href={`/api/export/rapportage?van=${van.toISOString()}&tot=${tot.toISOString()}`} className="knop-primair">Exporteren als CSV</a>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat titel="Opdrachten" waarde={sessies.length} />
        <Stat titel="Omzet" waarde={euro(totaleOmzet)} accent />
        <Stat titel="Docentkosten" waarde={euro(totaleKosten)} />
        <Stat titel="Marge" waarde={euro(totaleOmzet - totaleKosten)} />
        <Stat titel="Geannuleerd" waarde={geannuleerd} />
        <Stat titel="Open posities" waarde={openPosities} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Kaart>
          <h2 className="mb-3 font-semibold">Omzet per klant</h2>
          <ul className="space-y-1 text-sm">
            {top(omzetPerKlant).map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-neutral-100 py-1.5"><span>{k}</span><span className="font-medium">{euro(v)}</span></li>
            ))}
            {omzetPerKlant.size === 0 && <li className="text-neutral-500">Geen gegevens in deze periode.</li>}
          </ul>
        </Kaart>
        <Kaart>
          <h2 className="mb-3 font-semibold">Meest geboekte workshops</h2>
          <ul className="space-y-1 text-sm">
            {top(perWorkshop).map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-neutral-100 py-1.5"><span>{k}</span><span className="font-medium">{v}x</span></li>
            ))}
            {perWorkshop.size === 0 && <li className="text-neutral-500">Geen gegevens in deze periode.</li>}
          </ul>
        </Kaart>
        <Kaart>
          <h2 className="mb-3 font-semibold">Kosten per docent</h2>
          <ul className="space-y-1 text-sm">
            {top(kostenPerDocent).map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-neutral-100 py-1.5"><span>{k}</span><span className="font-medium">{euro(v)}</span></li>
            ))}
            {kostenPerDocent.size === 0 && <li className="text-neutral-500">Nog geen declaraties.</li>}
          </ul>
        </Kaart>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <Stat titel="Goedgekeurde docenten" waarde={docenten} />
        <Stat titel="Gereden kilometers" waarde={`${kilometers} km`} />
        <Stat titel="Declaraties" waarde={declaraties.length} />
      </div>
    </>
  );
}
