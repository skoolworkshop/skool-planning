"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { projectAanmaken } from "@/lib/project-acties";
import { DOELGROEPEN } from "@/lib/doelgroepen";

type Klant = { id: string; naam: string; locaties: { id: string; naam: string }[]; contacten: { id: string; naam: string }[] };
type Workshop = { id: string; naam: string; categorie: string; kleur: string; duur: number; vergoeding: number; afbeeldingUrl: string | null };

/**
 * Per workshop houden we een rij bij per workshopdocent.
 * plekken[docent][ronde] geeft aan of die workshopdocent in die ronde draait.
 * Zo kan de een alle rondes doen en de ander alleen ronde 2 en 3.
 */
type Keuze = { workshopId: string; plekken: boolean[][] };

function kort(naam: string) {
  return naam.replace(/^Workshop /, "");
}

function plusMin(tijd: string, minuten: number) {
  const [h, m] = tijd.split(":").map(Number);
  const t = (h * 60 + m + minuten + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export default function SnelPlannen({ klanten, workshops }: { klanten: Klant[]; workshops: Workshop[] }) {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState("");

  const [clientId, setClientId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [contactId, setContactId] = useState("");
  const [datum, setDatum] = useState("");
  const [naam, setNaam] = useState("");

  const [keuzes, setKeuzes] = useState<Keuze[]>([]);
  const [zoek, setZoek] = useState("");

  const [startTijd, setStartTijd] = useState("10:00");
  const [rondeDuur, setRondeDuur] = useState(60);
  const [wachttijd, setWachttijd] = useState(0);
  const [aantalRondes, setAantalRondes] = useState(3);
  const [pauzeNa, setPauzeNa] = useState(0);
  const [pauzeDuur, setPauzeDuur] = useState(30);
  const [voorbereiding, setVoorbereiding] = useState(30);
  const [afbouw, setAfbouw] = useState(15);
  const [deelnemers, setDeelnemers] = useState(25);
  const [afdelingen, setAfdelingen] = useState("");
  const [doelgroep, setDoelgroep] = useState("");
  const [doelgroepToelichting, setDoelgroepToelichting] = useState("");

  const klant = klanten.find((k) => k.id === clientId);

  // Verandert het aantal rondes, dan groeit of krimpt elke rij mee
  useEffect(() => {
    setKeuzes((k) =>
      k.map((x) => ({
        ...x,
        plekken: x.plekken.map((rij) =>
          rij.length === aantalRondes ? rij : Array.from({ length: aantalRondes }, (_, i) => rij[i] ?? true)
        ),
      }))
    );
  }, [aantalRondes]);

  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return workshops;
    return workshops.filter((w) => w.naam.toLowerCase().includes(q) || w.categorie.toLowerCase().includes(q));
  }, [workshops, zoek]);

  const perCategorie = useMemo(() => {
    const map = new Map<string, Workshop[]>();
    for (const w of zichtbaar) map.set(w.categorie, [...(map.get(w.categorie) ?? []), w]);
    return [...map.entries()];
  }, [zichtbaar]);

  const afdelingLijst = afdelingen.split(",").map((a) => a.trim()).filter(Boolean);

  // Het rooster dat straks wordt aangemaakt
  const rooster = useMemo(() => {
    const blokken: { index: number; nummer: number; start: string; eind: string; afdeling?: string }[] = [];
    const groepen = afdelingLijst.length > 0 ? afdelingLijst : [undefined];
    let klok = startTijd;
    for (const afdeling of groepen) {
      for (let n = 1; n <= aantalRondes; n++) {
        const eind = plusMin(klok, rondeDuur);
        blokken.push({ index: n - 1, nummer: n, start: klok, eind, afdeling });
        klok = plusMin(eind, n === pauzeNa ? pauzeDuur : wachttijd);
      }
    }
    return blokken;
  }, [startTijd, rondeDuur, wachttijd, aantalRondes, pauzeNa, pauzeDuur, afdelingen]);

  const gekozenWorkshops = keuzes
    .map((k) => ({ keuze: k, w: workshops.find((x) => x.id === k.workshopId)! }))
    .filter((x) => x.w);

  // Elke rij is één workshopdocent, dus het aantal rijen is het aantal mensen dat je nodig hebt
  const docentenPerWorkshop = gekozenWorkshops.map((x) => x.keuze.plekken.filter((rij) => rij.some(Boolean)).length);
  const totaalDocenten = docentenPerWorkshop.reduce((a, b) => a + b, 0);

  /** Hoeveel groepen van deze workshop draaien er in ronde i. */
  function groepenInRonde(keuze: Keuze, rondeIndex: number) {
    return keuze.plekken.filter((rij) => rij[rondeIndex]).length;
  }

  const laatsteEind = rooster.length > 0 ? rooster[rooster.length - 1].eind : startTijd;
  const aankomst = plusMin(startTijd, -voorbereiding);
  const vertrek = plusMin(laatsteEind, afbouw);
  const omzetSchatting = gekozenWorkshops.reduce((n, x) => {
    const blokjes = x.keuze.plekken.reduce((a, rij) => a + rij.filter(Boolean).length, 0);
    return n + x.w.vergoeding * 1.6 * blokjes * Math.max(1, afdelingLijst.length);
  }, 45);

  function nieuweRij() {
    return Array.from({ length: aantalRondes }, () => true);
  }

  function wissel(id: string) {
    setKeuzes((k) =>
      k.some((x) => x.workshopId === id)
        ? k.filter((x) => x.workshopId !== id)
        : [...k, { workshopId: id, plekken: [nieuweRij()] }]
    );
  }

  function wisselRonde(id: string, plekIndex: number, rondeIndex: number) {
    setKeuzes((k) =>
      k.map((x) =>
        x.workshopId === id
          ? {
              ...x,
              plekken: x.plekken.map((rij, p) =>
                p === plekIndex ? rij.map((r, i) => (i === rondeIndex ? !r : r)) : rij
              ),
            }
          : x
      )
    );
  }

  /** Voegt een workshopdocent toe aan deze workshop, of haalt er een weg. */
  function zetDocenten(id: string, n: number) {
    const aantal = Math.max(1, Math.min(12, n));
    setKeuzes((k) =>
      k.map((x) =>
        x.workshopId === id
          ? { ...x, plekken: Array.from({ length: aantal }, (_, i) => x.plekken[i] ?? nieuweRij()) }
          : x
      )
    );
  }

  function alleRondes(id: string, plekIndex: number, aan: boolean) {
    setKeuzes((k) =>
      k.map((x) =>
        x.workshopId === id
          ? { ...x, plekken: x.plekken.map((rij, p) => (p === plekIndex ? rij.map(() => aan) : rij)) }
          : x
      )
    );
  }

  function opslaan() {
    setFout("");
    if (!clientId) return setFout("Kies eerst een klant.");
    if (!datum) return setFout("Vul een datum in.");
    if (keuzes.length === 0) return setFout("Kies minimaal één workshop.");

    const leeg = gekozenWorkshops.filter((x) => !x.keuze.plekken.some((rij) => rij.some(Boolean)));
    if (leeg.length > 0) return setFout(`${kort(leeg[0].w.naam)} staat in geen enkele ronde. Vink minimaal één ronde aan of haal de workshop weg.`);

    const sessies = gekozenWorkshops.map((x) => {
      // Alleen de rondes waar minstens één workshopdocent van deze workshop draait
      const eigenBlokken = rooster.filter((b) => groepenInRonde(x.keuze, b.index) > 0);
      const starts = eigenBlokken.map((b) => b.start).sort();
      const einden = eigenBlokken.map((b) => b.eind).sort();
      const eigenStart = starts[0] ?? startTijd;
      const eigenEind = einden[einden.length - 1] ?? laatsteEind;
      const aantalDocenten = x.keuze.plekken.filter((rij) => rij.some(Boolean)).length;

      return {
        workshopId: x.w.id,
        datum,
        startTijd: eigenStart,
        eindTijd: eigenEind,
        aanwezigVanaf: plusMin(eigenStart, -voorbereiding),
        afbouwTot: plusMin(eigenEind, afbouw),
        deelnemers: deelnemers * aantalDocenten,
        doelgroep: doelgroep || undefined,
        doelgroepToelichting: doelgroepToelichting || undefined,
        ruimte: "",
        vergoeding: x.w.vergoeding,
        aantalDocenten,
        aantalAssistenten: 0,
        rondes: eigenBlokken.map((b, i) => {
          const groepen = groepenInRonde(x.keuze, b.index);
          return {
            nummer: afdelingLijst.length > 1 ? i + 1 : b.nummer,
            startTijd: b.start,
            eindTijd: b.eind,
            groep: b.afdeling ?? `Groep ${b.nummer}`,
            afdeling: b.afdeling,
            aantalGroepen: groepen,
            deelnemers: deelnemers * groepen,
          };
        }),
      };
    });

    start(async () => {
      const res = await projectAanmaken({
        clientId,
        locationId: locationId || undefined,
        contactId: contactId || undefined,
        naam: naam.trim() || `${gekozenWorkshops.length > 1 ? "Cultuurdag" : kort(gekozenWorkshops[0].w.naam)} bij ${klant?.naam ?? ""}`,
        omzet: Math.round(omzetSchatting),
        sessies,
      });
      if (res.fout) return setFout(res.fout);
      router.push(`/beheer/opdrachten/${res.id}`);
    });
  }

  return (
    <div className="space-y-5">
      {/* Stap 1: klant en datum */}
      <div className="kaart p-4">
        <h2 className="mb-3 font-semibold">1. Klant en datum</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="klant">Klant</label>
            <select id="klant" value={clientId} onChange={(e) => { setClientId(e.target.value); setLocationId(""); setContactId(""); }} className="veld">
              <option value="">Kies een klant</option>
              {klanten.map((k) => <option key={k.id} value={k.id}>{k.naam}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="loc">Locatie</label>
            <select id="loc" value={locationId} onChange={(e) => setLocationId(e.target.value)} className="veld" disabled={!klant}>
              <option value="">Kies een locatie</option>
              {klant?.locaties.map((l) => <option key={l.id} value={l.id}>{l.naam}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cont">Contactpersoon</label>
            <select id="cont" value={contactId} onChange={(e) => setContactId(e.target.value)} className="veld" disabled={!klant}>
              <option value="">Kies een contactpersoon</option>
              {klant?.contacten.map((c) => <option key={c.id} value={c.id}>{c.naam}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dat">Datum</label>
            <input id="dat" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className="veld" />
          </div>
        </div>
      </div>

      {/* Stap 2: workshops */}
      <div className="kaart p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">2. Workshops kiezen</h2>
          <span className="text-sm text-zand-500">
            {keuzes.length} gekozen, {totaalDocenten} {totaalDocenten === 1 ? "workshopdocent" : "workshopdocenten"} nodig
          </span>
        </div>
        <input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek op naam of discipline" className="veld mb-3" />

        <div className="space-y-4">
          {perCategorie.map(([cat, lijst]) => (
            <div key={cat}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: lijst[0].kleur }} aria-hidden />
                {cat}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {lijst.map((w) => {
                  const aan = keuzes.some((k) => k.workshopId === w.id);
                  return (
                    <button key={w.id} type="button" onClick={() => wissel(w.id)}
                      className={`flex items-center gap-3 rounded-lg border p-2 text-left transition ${aan ? "border-skool-500 bg-skool-50" : "border-zand-300 bg-white hover:bg-zand-100"}`}>
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-zand-200">
                        {w.afbeeldingUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.afbeeldingUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <span className="block h-full w-full" style={{ background: w.kleur + "33" }} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{kort(w.naam)}</span>
                        <span className="block text-xs text-zand-500">{w.duur} min</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zand-500">
          Het getal achter een gekozen workshop is het aantal groepen dat tegelijk draait. Dat bepaalt hoeveel docenten je nodig hebt.
        </p>
      </div>

      {/* Stap 3: tijden */}
      <div className="kaart p-4">
        <h2 className="mb-3 font-semibold">3. Tijden</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div><label className="label" htmlFor="st">Starttijd</label>
            <input id="st" type="time" value={startTijd} onChange={(e) => setStartTijd(e.target.value)} className="veld" /></div>
          <div><label className="label" htmlFor="ar">Aantal rondes</label>
            <input id="ar" type="number" min={1} max={8} value={aantalRondes} onChange={(e) => setAantalRondes(Math.max(1, Number(e.target.value)))} className="veld" /></div>
          <div><label className="label" htmlFor="rd">Rondeduur in minuten</label>
            <input id="rd" type="number" min={15} step={5} value={rondeDuur} onChange={(e) => setRondeDuur(Number(e.target.value))} className="veld" /></div>
          <div><label className="label" htmlFor="wt">Wisseltijd in minuten</label>
            <input id="wt" type="number" min={0} step={5} value={wachttijd} onChange={(e) => setWachttijd(Number(e.target.value))} className="veld" /></div>
          <div><label className="label" htmlFor="pn">Pauze na ronde</label>
            <input id="pn" type="number" min={0} max={8} value={pauzeNa} onChange={(e) => setPauzeNa(Number(e.target.value))} className="veld" /></div>
          <div><label className="label" htmlFor="pd">Pauzeduur in minuten</label>
            <input id="pd" type="number" min={0} step={5} value={pauzeDuur} onChange={(e) => setPauzeDuur(Number(e.target.value))} className="veld" /></div>
          <div><label className="label" htmlFor="vb">Voorbereiding in minuten</label>
            <input id="vb" type="number" min={0} step={5} value={voorbereiding} onChange={(e) => setVoorbereiding(Number(e.target.value))} className="veld" /></div>
          <div><label className="label" htmlFor="ab">Afbouw in minuten</label>
            <input id="ab" type="number" min={0} step={5} value={afbouw} onChange={(e) => setAfbouw(Number(e.target.value))} className="veld" /></div>
          <div><label className="label" htmlFor="dn">Deelnemers per groep</label>
            <input id="dn" type="number" min={1} value={deelnemers} onChange={(e) => setDeelnemers(Number(e.target.value))} className="veld" /></div>
          <div>
            <label className="label" htmlFor="dg">Doelgroep</label>
            <select id="dg" value={doelgroep} onChange={(e) => setDoelgroep(e.target.value)} className="veld">
              <option value="">Kies een doelgroep</option>
              {DOELGROEPEN.map((d) => <option key={d.waarde} value={d.waarde}>{d.label}</option>)}
            </select>
          </div>
          {doelgroep === "OVERIG" && (
            <div>
              <label className="label" htmlFor="dgt">Toelichting</label>
              <input id="dgt" value={doelgroepToelichting} onChange={(e) => setDoelgroepToelichting(e.target.value)} className="veld" />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="afd">Afdelingen, gescheiden door komma</label>
            <input id="afd" value={afdelingen} onChange={(e) => setAfdelingen(e.target.value)} placeholder="bijv. 4VWO, 4HAVO" className="veld" />
          </div>
          <div>
            <label className="label" htmlFor="pnaam">Naam opdracht</label>
            <input id="pnaam" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Wordt automatisch gevuld" className="veld" />
          </div>
        </div>
      </div>

      {/* 4. Verdeling over de rondes */}
      {keuzes.length > 0 && (
        <div className="kaart p-4">
          <h2 className="mb-1 font-semibold">4. Rondes en workshopdocenten per workshop</h2>
          <p className="mb-3 text-sm text-zand-500">
            Elke regel is één workshopdocent. Zet het aantal omhoog als een workshop met meer mensen tegelijk draait,
            en vink per persoon aan in welke rondes hij werkt.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zand-500">
                  <th className="pb-2 pr-3">Workshop</th>
                  <th className="pb-2 pr-3">Wie</th>
                  {Array.from({ length: aantalRondes }, (_, i) => (
                    <th key={i} className="pb-2 pr-2 text-center">Ronde {i + 1}</th>
                  ))}
                  <th className="pb-2 pl-3 text-center">Aantal</th>
                </tr>
              </thead>
              <tbody>
                {gekozenWorkshops.map((x) =>
                  x.keuze.plekken.map((rij, plek) => (
                    <tr
                      key={`${x.w.id}-${plek}`}
                      className={plek === 0 ? "border-t-2 border-zand-300" : "border-t border-zand-200"}
                    >
                      {plek === 0 ? (
                        <td className="py-2 pr-3 align-top" rowSpan={x.keuze.plekken.length}>
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: x.w.kleur }} aria-hidden />
                            <span className="font-medium">{kort(x.w.naam)}</span>
                          </div>
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap py-2 pr-3">
                        <span className="text-zand-500">Workshopdocent {plek + 1}</span>
                        <span className="ml-2 text-xs">
                          <button type="button" onClick={() => alleRondes(x.w.id, plek, true)} className="text-zand-400 underline hover:text-skool-600">alle</button>
                          <span className="text-zand-300"> / </span>
                          <button type="button" onClick={() => alleRondes(x.w.id, plek, false)} className="text-zand-400 underline hover:text-skool-600">geen</button>
                        </span>
                      </td>
                      {rij.map((aan, i) => (
                        <td key={i} className="py-2 pr-2 text-center">
                          <input
                            type="checkbox" checked={aan}
                            aria-label={`${kort(x.w.naam)}, workshopdocent ${plek + 1}, ronde ${i + 1}`}
                            onChange={() => wisselRonde(x.w.id, plek, i)}
                            className="h-5 w-5 accent-skool-500"
                          />
                        </td>
                      ))}
                      {plek === 0 ? (
                        <td className="py-2 pl-3 text-center align-top" rowSpan={x.keuze.plekken.length}>
                          <input
                            type="number" min={1} max={12} value={x.keuze.plekken.length}
                            aria-label={`Aantal workshopdocenten ${kort(x.w.naam)}`}
                            onChange={(e) => zetDocenten(x.w.id, Number(e.target.value))}
                            className="veld w-20 px-2 text-center"
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-zand-500">
            Totaal {totaalDocenten} {totaalDocenten === 1 ? "workshopdocent" : "workshopdocenten"} nodig deze dag.
          </p>
        </div>
      )}

      {/* Voorbeeld */}
      <div className="kaart p-4">
        <h2 className="mb-3 font-semibold">Zo wordt het</h2>
        {keuzes.length === 0 ? (
          <p className="text-sm text-zand-500">Kies eerst een paar workshops, dan zie je hier meteen het tijdschema.</p>
        ) : (
          <div className="space-y-1 text-sm">
            <div className="text-zand-500">{aankomst}u Aankomst workshopdocenten</div>
            <div className="text-zand-500">{aankomst}u tot {startTijd}u Voorbereiding</div>
            {rooster.map((b, i) => {
              const inDeze = gekozenWorkshops
                .map((x) => ({ naam: kort(x.w.naam), groepen: groepenInRonde(x.keuze, b.index) }))
                .filter((x) => x.groepen > 0);
              return (
                <div key={i} className={inDeze.length === 0 ? "text-zand-400" : ""}>
                  <span className="font-medium">{b.start}u tot {b.eind}u Workshopronde {b.nummer}</span>
                  {b.afdeling && <span className="ml-2 text-skool-600">{b.afdeling}</span>}
                  <span className="ml-2 text-zand-500">
                    {inDeze.length === 0
                      ? "geen workshops in deze ronde"
                      : inDeze.map((x) => `${x.groepen}x ${x.naam}`).join(", ")}
                  </span>
                </div>
              );
            })}
            <div className="text-zand-500">{laatsteEind}u tot {vertrek}u Afbouw en vertrek</div>
            <p className="pt-2 text-xs text-zand-500">
              {keuzes.length} workshops, {rooster.length} rondes, {totaalDocenten} workshopdocenten nodig. Geschatte omzet ongeveer € {Math.round(omzetSchatting)}.
            </p>
          </div>
        )}
      </div>

      {fout && <p className="text-sm text-red-700">{fout}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={opslaan} disabled={bezig} className="knop knop-primair px-6 py-2">
          {bezig ? "Bezig met aanmaken" : "Opdracht aanmaken"}
        </button>
        <span className="self-center text-sm text-zand-500">Alles is daarna nog per ronde aan te passen.</span>
      </div>
    </div>
  );
}
