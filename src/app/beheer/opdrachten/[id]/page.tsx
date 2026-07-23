import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, PaginaKop, Badge, statusKleur, Rij } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";
import { bouwAlleTijdschemas, bouwBevestiging, samenvatting, type BevSessie } from "@/lib/bevestiging";
import { opdrachtPrijs, vergoedingVoorOpdracht } from "@/lib/tarieven";
import { haalTarieven } from "@/lib/tarief-acties";
import Rondes from "./Rondes";
import Bevestiging from "./Bevestiging";

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
        include: {
          workshop: true,
          contact: true,
          rounds: { orderBy: [{ nummer: "asc" }, { startTijd: "asc" }] },
          positions: { include: { assignments: true } },
        },
      },
    },
  });
  if (!p) notFound();

  const alleWorkshops = await db.workshop.findMany({
    where: { actief: true },
    orderBy: { naam: "asc" },
    select: { id: true, naam: true },
  });

  // Kosten per workshopdocent volgens dezelfde regels als de workshopdocent zelf ziet
  const standaard = await haalTarieven();
  const docentkosten = p.sessions.reduce((n, s) => {
    const perPersoon = vergoedingVoorOpdracht(
      { aanwezigVanaf: s.aanwezigVanaf, startTijd: s.startTijd, eindTijd: s.eindTijd, afbouwTot: s.afbouwTot },
      standaard
    ).werk;
    const aantal = s.positions.reduce((x, pos) => x + pos.aantal, 0);
    return n + perPersoon * aantal;
  }, 0);
  const marge = Number(p.omzet) - docentkosten - Number(p.materiaalkosten);

  // Wat deze dag volgens de tarieven op de website zou kosten
  const richtprijs = opdrachtPrijs(
    p.sessions.map((s) => ({
      verkoopprijs60: Number(s.workshop.verkoopprijs ?? 195),
      duurMinuten: s.workshop.standaardDuur,
      rondes: s.rounds.reduce((n, r) => n + Math.max(1, r.aantalGroepen), 0),
      deelnemers: s.deelnemers,
    }))
  );

  // Gegevens voor het tijdschema en de bevestigingsmail
  const bevSessies: BevSessie[] = p.sessions.map((s) => ({
    workshopNaam: s.workshop.naam,
    aanwezigVanaf: s.aanwezigVanaf,
    afbouwTot: s.afbouwTot,
    klantBenodigdheden: s.benodigdheden || s.workshop.klantBenodigdheden,
    voorbeeldLink: s.workshop.voorbeeldLink,
    rondes: s.rounds.map((r) => ({
      nummer: r.nummer,
      startTijd: r.startTijd,
      eindTijd: r.eindTijd,
      afdeling: r.afdeling,
      aantalGroepen: r.aantalGroepen,
    })),
  }));

  const datums = [...new Set(p.sessions.map((s) => datum(s.datum)))];
  const datumTekst = datums.length === 0 ? datum(p.startDatum) : datums.length === 1 ? datums[0] : "meerdere data";
  const contact = p.sessions.find((s) => s.contact)?.contact ?? null;

  const schemas = bouwAlleTijdschemas(bevSessies);
  const tekst = bouwBevestiging({
    aanhef: contact?.naam?.split(" ")[0] ?? null,
    klantNaam: p.client.naam,
    datumTekst,
    locatieNaam: p.location?.naam ?? p.client.naam,
    adresregels: p.location
      ? [[p.location.straat, p.location.huisnummer].filter(Boolean).join(" "), `${p.location.postcode ?? ""} ${p.location.plaats}`.trim()]
      : [],
    contactNaam: contact?.naam ?? null,
    contactTelefoon: contact?.mobiel ?? contact?.telefoon ?? null,
    aantalPersonenTekst: p.aantalPersonenTekst,
    sessies: bevSessies,
  });

  return (
    <>
      <Link href="/beheer/opdrachten" className="mb-3 inline-block text-sm text-zand-500 hover:text-skool-600">← Terug naar projecten</Link>
      <PaginaKop
        titel={p.naam}
        sub={`${p.ordernummer} · ${p.client.naam} · ${samenvatting(bevSessies)}`}
        actie={<Badge kleur={statusKleur(p.status)}>{label(p.status)}</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Kaart>
            <h2 className="mb-3 font-semibold">Workshops in deze opdracht</h2>
            <ul className="space-y-4">
              {p.sessions.map((s) => {
                const nodig = s.positions.reduce((n, x) => n + x.aantal, 0);
                const bezet = s.positions.reduce((n, x) => n + x.assignments.filter((a) => !a.uitgevallen).length, 0);
                const groepen = s.rounds.reduce((n, r) => n + Math.max(1, r.aantalGroepen), 0);
                return (
                  <li key={s.id} className="border-b border-zand-200 pb-4 last:border-0 last:pb-0">
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link href={`/beheer/opdrachten/moment/${s.id}`} className="font-medium hover:text-skool-600">{s.workshop.naam}</Link>
                      <span className="text-sm text-zand-500">{datum(s.datum)} · {s.startTijd} tot {s.eindTijd}</span>
                      <span className="text-xs text-zand-500">{s.rounds.length} rondes, {groepen} groepen</span>
                      <Badge kleur={bezet >= nodig ? "groen" : bezet > 0 ? "geel" : "rood"}>{bezet} van {nodig} workshopdocenten</Badge>
                      <Badge kleur={statusKleur(s.status)}>{label(s.status)}</Badge>
                    </div>
                    <Rondes
                      sessionId={s.id}
                      workshopNaam={s.workshop.naam}
                      aanwezigVanaf={s.aanwezigVanaf ?? ""}
                      afbouwTot={s.afbouwTot ?? ""}
                      standaardDuur={s.workshop.standaardDuur}
                      rondes={s.rounds.map((r) => ({
                        nummer: r.nummer,
                        startTijd: r.startTijd,
                        eindTijd: r.eindTijd,
                        afdeling: r.afdeling ?? undefined,
                        aantalGroepen: r.aantalGroepen,
                        deelnemers: r.deelnemers,
                      }))}
                    />
                  </li>
                );
              })}
              {p.sessions.length === 0 && <li className="text-sm text-zand-500">Nog geen workshops in deze opdracht.</li>}
            </ul>
          </Kaart>

          {schemas.length > 0 && (
            <Kaart>
              <h2 className="mb-3 font-semibold">Tijdschema</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {schemas.map((s) => (
                  <div key={s.afdeling ?? "algemeen"}>
                    {s.afdeling && <h3 className="mb-1 text-sm font-semibold text-skool-600">{s.afdeling}</h3>}
                    <ul className="space-y-1 text-sm">
                      {s.regels.map((r, i) => (
                        <li key={i} className={r.includes("Workshopronde") ? "font-medium" : "text-zand-600"}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Kaart>
          )}

          <Kaart>
            <h2 className="mb-3 font-semibold">Bevestiging naar de klant</h2>
            <Bevestiging
              projectId={p.id}
              tekst={tekst}
              aantalPersonenTekst={p.aantalPersonenTekst ?? ""}
              workshops={alleWorkshops}
            />
          </Kaart>
        </div>

        <div className="space-y-5">
          <Kaart>
            <h2 className="mb-2 font-semibold">Klant en locatie</h2>
            <Rij label="Klant">
              <Link href={`/beheer/klanten/${p.client.id}`} className="hover:text-skool-600">{p.client.naam}</Link>
            </Rij>
            <Rij label="Klanttype">{label(p.client.type)}</Rij>
            {p.client.cjpNummer && <Rij label="CJP schoolnummer">{p.client.cjpNummer}</Rij>}
            <Rij label="Locatie">{p.location ? `${p.location.naam}, ${p.location.plaats}` : ""}</Rij>
            <Rij label="Contactpersoon">{contact ? `${contact.naam}${contact.mobiel ? `, ${contact.mobiel}` : ""}` : ""}</Rij>
            <Rij label="Periode">{datum(p.startDatum)}{p.eindDatum && datum(p.eindDatum) !== datum(p.startDatum) ? ` tot ${datum(p.eindDatum)}` : ""}</Rij>
          </Kaart>
          <Kaart>
            <h2 className="mb-2 font-semibold">Wat het oplevert</h2>
            <Rij label="Richtprijs volgens de site">
              {euro(richtprijs.totaal)}
              <span className="block text-xs font-normal text-zand-500">
                {euro(richtprijs.workshops)} workshops
                {richtprijs.extra > 0 ? ` · ${euro(richtprijs.extra)} extra deelnemers` : ""}
                {` · ${euro(richtprijs.start)} starttarief`}
              </span>
            </Rij>
            <Rij label="Afgesproken omzet">{euro(p.omzet)}</Rij>
            <Rij label="Kosten workshopdocenten">
              {euro(docentkosten)}
              <span className="block text-xs font-normal text-zand-500">
                Uren workshop maal het uurtarief, zonder reiskosten
              </span>
            </Rij>
            <Rij label="Materiaalkosten">{euro(p.materiaalkosten)}</Rij>
            <Rij label="Wat je overhoudt">
              <span className={marge < 0 ? "font-semibold text-red-700" : "font-semibold text-emerald-700"}>
                {euro(marge)}
              </span>
              {Number(p.omzet) > 0 && (
                <span className="block text-xs font-normal text-zand-500">
                  {Math.round((marge / Number(p.omzet)) * 100)}% van de omzet
                </span>
              )}
            </Rij>
          </Kaart>
          {(p.notitie || p.interneNotitie) && (
            <Kaart>
              <h2 className="mb-2 font-semibold">Notities</h2>
              {p.notitie && <p className="whitespace-pre-line text-sm">{p.notitie}</p>}
              {p.interneNotitie && <p className="mt-2 whitespace-pre-line rounded bg-zand-100 p-2 text-sm text-zand-600">Intern: {p.interneNotitie}</p>}
            </Kaart>
          )}
        </div>
      </div>
    </>
  );
}
