"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { projectAanmaken } from "@/lib/project-acties";

type Klant = { id: string; naam: string; locaties: { id: string; naam: string }[]; contacten: { id: string; naam: string }[] };
type Workshop = { id: string; naam: string; categorie: string; kleur: string; duur: number; vergoeding: number; afbeeldingUrl: string | null };

type Keuze = { workshopId: string; groepen: number };

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

  const klant = klanten.find((k) => k.id === clientId);
  const gekozen = keuzes.map((k) => workshops.find((w) => w.id === k.workshopId)!).filter(Boolean);

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
    const blokken: { nummer: number; start: string; eind: string; afdeling?: string }[] = [];
    const groepen = afdelingLijst.length > 0 ? afdelingLijst : [undefined];
    let klok = startTijd;
    for (const afdeling of groepen) {
      for (let n = 1; n <= aantalRondes; n++) {
        const eind = plusMin(klok, rondeDuur);
        blokken.push({ nummer: n, start: klok, eind, afdeling });
        klok = plusMin(eind, n === pauzeNa ? pauzeDuur : wachttijd);
      }
    }
    return blokken;
  }, [startTijd, rondeDuur, wachttijd, aantalRondes, pauzeNa, pauzeDuur, afdelingen]);

  const laatsteEind = rooster.length > 0 ? rooster[rooster.length - 1].eind : startTijd;
  const aankomst = plusMin(startTijd, -voorbereiding);
  const vertrek = plusMin(laatsteEind, afbouw);
  const totaalGroepen = keuzes.reduce((n, k) => n + k.groepen, 0);
  const omzetSchatting = gekozen.reduce((n, w, i) => n + w.vergoeding * 1.6 * aantalRondes * keuzes[i].groepen, 45);

  function wissel(id: string) {
    setKeuzes((k) => (k.some((x) => x.workshopId === id) ? k.filter((x) => x.workshopId !== id) : [...k, { workshopId: id, groepen: 1 }]));
  }

  function groepen(id: string, n: number) {
    setKeuzes((k) => k.map((x) => (x.workshopId === id ? { ...x, groepen: Math.max(1, n) } : x)));
  }

  function opslaan() {
    setFout("");
    if (!clientId) return setFout("Kies eerst een klant.");
    if (!datum) return setFout("Vul een datum in.");
    if (keuzes.length === 0) return setFout("Kies minimaal één workshop.");

    const sessies = keuzes.map((k) => {
      const w = workshops.find((x) => x.id === k.workshopId)!;
      return {
        workshopId: k.workshopId,
        datum,
        startTijd,
        eindTijd: laatsteEind,
        aanwezigVanaf: aankomst,
        afbouwTot: vertrek,
        deelnemers: deelnemers * k.groepen,
        ruimte: "",
        vergoeding: w.vergoeding,
        aantalDocenten: k.groepen,
        aantalAssistenten: 0,
        rondes: rooster.map((r, i) => ({
          nummer: afdelingLijst.length > 1 ? i + 1 : r.nummer,
          startTijd: r.start,
          eindTijd: r.eind,
          groep: r.afdeling ?? `Groep ${r.nummer}`,
          afdeling: r.afdeling,
          aantalGroepen: k.groepen,
          deelnemers,
        })),
      };
    });

    start(async () => {
      const res = await projectAanmaken({
        clientId,
        locationId: locationId || undefined,
        contactId: contactId || undefined,
        naam: naam.trim() || `${gekozen.length > 1 ? "Cultuurdag" : gekozen[0].naam} bij ${klant?.naam ?? ""}`,
        omzet: Math.round(omzetSchatting),
        sessies,
      });
      if (res.fout) return setFout(res.fout);
      router.push(`/beheer/projecten/${res.id}`);
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
            {keuzes.length} gekozen, {totaalGroepen} {totaalGroepen === 1 ? "docent" : "docenten"} nodig
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
                  const keuze = keuzes.find((k) => k.workshopId === w.id);
                  return (
                    <div key={w.id}
                      className={`flex items-center gap-3 rounded-lg border p-2 transition ${keuze ? "border-skool-500 bg-skool-50" : "border-zand-300 bg-white hover:bg-zand-50"}`}>
                      <button type="button" onClick={() => wissel(w.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-zand-100">
                          {w.afbeeldingUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={w.afbeeldingUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <span className="block h-full w-full" style={{ background: w.kleur + "33" }} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{w.naam.replace(/^Workshop /, "")}</span>
                          <span className="block text-xs text-zand-500">{w.duur} min</span>
                        </span>
                      </button>
                      {keuze && (
                        <input type="number" min={1} max={12} value={keuze.groepen} aria-label={`Groepen ${w.naam}`}
                          onChange={(e) => groepen(w.id, Number(e.target.value))}
                          className="veld w-16 px-2 py-1 text-center text-sm" />
                      )}
                    </div>
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

      {/* Voorbeeld */}
      <div className="kaart p-4">
        <h2 className="mb-3 font-semibold">Zo wordt het</h2>
        {keuzes.length === 0 ? (
          <p className="text-sm text-zand-500">Kies eerst een paar workshops, dan zie je hier meteen het tijdschema.</p>
        ) : (
          <div className="space-y-1 text-sm">
            <div className="text-zand-500">{aankomst}u Aankomst workshopdocenten</div>
            <div className="text-zand-500">{aankomst}u tot {startTijd}u Voorbereiding</div>
            {rooster.map((r, i) => (
              <div key={i}>
                <span className="font-medium">{r.start}u tot {r.eind}u Workshopronde {r.nummer}</span>
                {r.afdeling && <span className="ml-2 text-skool-600">{r.afdeling}</span>}
                <span className="ml-2 text-zand-500">
                  {keuzes.map((k) => `${k.groepen}x ${workshops.find((w) => w.id === k.workshopId)!.naam.replace(/^Workshop /, "")}`).join(", ")}
                </span>
              </div>
            ))}
            <div className="text-zand-500">{laatsteEind}u tot {vertrek}u Afbouw en vertrek</div>
            <p className="pt-2 text-xs text-zand-500">
              {keuzes.length} workshops, {rooster.length} rondes, {totaalGroepen} workshopdocenten nodig. Geschatte omzet ongeveer € {Math.round(omzetSchatting)}.
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
