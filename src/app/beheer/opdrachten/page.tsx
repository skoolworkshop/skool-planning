import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge, statusKleur, Leeg } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";
import { leesMaand } from "@/lib/maand";
import { doelgroepenLabel } from "@/lib/doelgroepen";
import Maandkiezer from "@/components/Maandkiezer";

export const dynamic = "force-dynamic";

type Zoek = { maand?: string; q?: string; status?: string; filter?: string };

export default async function OpdrachtenPagina({ searchParams }: { searchParams: Zoek }) {
  await vereisGebruiker();
  const maand = leesMaand(searchParams.maand);
  const q = searchParams.q?.trim();

  const projecten = await db.project.findMany({
    where: {
      startDatum: { gte: maand.start, lte: maand.eind },
      ...(searchParams.status ? { status: searchParams.status as never } : {}),
      ...(q
        ? {
            OR: [
              { naam: { contains: q, mode: "insensitive" as const } },
              { ordernummer: { contains: q, mode: "insensitive" as const } },
              { client: { naam: { contains: q, mode: "insensitive" as const } } },
              { location: { plaats: { contains: q, mode: "insensitive" as const } } },
              { sessions: { some: { workshop: { naam: { contains: q, mode: "insensitive" as const } } } } },
            ],
          }
        : {}),
    },
    include: {
      client: { select: { naam: true } },
      location: { select: { plaats: true } },
      sessions: {
        include: {
          workshop: { select: { naam: true, afbeeldingUrl: true, afbeeldingAlt: true } },
          positions: { include: { assignments: true, applications: true } },
        },
        orderBy: { startTijd: "asc" },
      },
    },
    orderBy: [{ startDatum: "asc" }],
    take: 200,
  });

  const verrijkt = projecten.map((p) => {
    const posities = p.sessions.flatMap((s) => s.positions);
    const nodig = posities.reduce((n, x) => n + x.aantal, 0);
    const bezet = posities.reduce((n, x) => n + x.assignments.filter((a) => !a.uitgevallen).length, 0);
    const open = posities.flatMap((x) => x.applications).filter((a) => a.status === "AANGEMELD" || a.status === "IN_BEHANDELING").length;
    const vergoeding = posities.reduce((n, x) => n + Number(x.vergoeding) * x.aantal, 0);
    const tijden = p.sessions.map((s) => s.startTijd).sort();
    return { p, nodig, bezet, open, vergoeding, starttijd: tijden[0] ?? "" };
  });

  const lijst = searchParams.filter === "onbezet" ? verrijkt.filter((x) => x.bezet < x.nodig && x.p.status !== "GEANNULEERD") : verrijkt;

  const totaalNodig = verrijkt.reduce((n, x) => n + x.nodig, 0);
  const totaalBezet = verrijkt.reduce((n, x) => n + x.bezet, 0);

  return (
    <>
      <PaginaKop
        titel="Opdrachten"
        sub={`${verrijkt.length} in ${maand.label}, ${totaalBezet} van ${totaalNodig} plekken bezet`}
        actie={<Link href="/beheer/opdrachten/nieuw" className="knop knop-primair px-4 py-2">Nieuwe opdracht</Link>}
      />

      <div className="mb-4 space-y-3">
        <Maandkiezer sleutel={maand.sleutel} label={maand.label} vorige={maand.vorige} volgende={maand.volgende} isHuidige={maand.isHuidige} />

        <form className="flex flex-wrap gap-2" action="/beheer/opdrachten">
          <input type="hidden" name="maand" value={maand.sleutel} />
          <label className="sr-only" htmlFor="zoek">Zoeken</label>
          <input id="zoek" name="q" defaultValue={q ?? ""} placeholder="Zoek op klant, workshop, plaats of ordernummer" className="veld w-full sm:w-80" />
          <label className="sr-only" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={searchParams.status ?? ""} className="veld w-auto">
            <option value="">Alle statussen</option>
            {["AANVRAAG", "OFFERTE", "BEVESTIGD", "PLANNING_GESTART", "UITGEVOERD", "GEFACTUREERD", "GEANNULEERD"].map((s) => (
              <option key={s} value={s}>{label(s)}</option>
            ))}
          </select>
          <button type="submit" className="knop knop-secundair px-4 py-2">Filteren</button>
          <Link
            href={`/beheer/opdrachten?maand=${maand.sleutel}${searchParams.filter === "onbezet" ? "" : "&filter=onbezet"}`}
            className={`knop px-4 py-2 ${searchParams.filter === "onbezet" ? "knop-primair" : "knop-secundair"}`}
          >
            Nog niet vol
          </Link>
        </form>
      </div>

      {lijst.length === 0 ? (
        <Leeg
          titel="Geen opdrachten in deze maand"
          tekst="Kies een andere maand of maak een nieuwe opdracht aan."
          actie={<Link href="/beheer/opdrachten/nieuw" className="knop knop-primair px-4 py-2">Nieuwe opdracht</Link>}
        />
      ) : (
        <div className="space-y-3">
          {lijst.map(({ p, nodig, bezet, open, vergoeding, starttijd }) => {
            const foto = p.sessions.find((s) => s.workshop.afbeeldingUrl)?.workshop;
            return (
              <Link key={p.id} href={`/beheer/opdrachten/${p.id}`} className="block">
                <Kaart className="transition hover:border-skool-300">
                  <div className="flex gap-4">
                    <div className="hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zand-200 sm:block">
                      {foto?.afbeeldingUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={foto.afbeeldingUrl} alt={foto.afbeeldingAlt ?? ""} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-full items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/beeldmerk.png" alt="" className="h-8 w-auto opacity-25" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-semibold">{p.naam}</span>
                        <Badge kleur={statusKleur(p.status)}>{label(p.status)}</Badge>
                        <Badge kleur={bezet >= nodig ? "groen" : bezet > 0 ? "geel" : "rood"}>{bezet} van {nodig} workshopdocenten</Badge>
                        {open > 0 && <Badge kleur="blauw">{open} aanmeldingen</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-zand-500">
                        {p.ordernummer} · {p.client.naam}
                        {p.location?.plaats ? ` · ${p.location.plaats}` : ""}
                        {" · "}{datum(p.startDatum)}{starttijd ? ` vanaf ${starttijd}` : ""}
                      </p>
                      <p className="mt-0.5 text-sm text-zand-500">
                        {p.sessions.length} {p.sessions.length === 1 ? "workshop" : "workshops"}
                        {": "}
                        {p.sessions.map((s) => s.workshop.naam.replace(/^Workshop /, "")).join(", ")}
                      </p>
                      {p.sessions[0]?.doelgroep && (
                        <p className="mt-0.5 text-xs text-zand-400">{doelgroepenLabel([p.sessions[0].doelgroep])}</p>
                      )}
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <div className="text-sm font-medium">{euro(p.omzet)}</div>
                      <div className="text-xs text-zand-500">kosten {euro(vergoeding)}</div>
                    </div>
                  </div>
                </Kaart>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
