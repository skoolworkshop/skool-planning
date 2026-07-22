"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { projectAanmaken } from "@/lib/project-acties";

type Klant = { id: string; naam: string; locaties: { id: string; naam: string }[]; contacten: { id: string; naam: string }[] };
type Workshop = { id: string; naam: string; categorie: string; duur: number; vergoeding: number; docenten: number };

type Ronde = { nummer: number; startTijd: string; eindTijd: string; groep: string; deelnemers: number };
type Sessie = {
  workshopId: string; datum: string; startTijd: string; eindTijd: string; aanwezigVanaf: string;
  deelnemers: number; leeftijd: string; doelgroep: string; ruimte: string; vergoeding: number;
  aantalDocenten: number; aantalAssistenten: number; benodigdheden: string; kleding: string;
  bijzonderheden: string; aanmeldDeadline: string; rondes: Ronde[];
};

function legeSessie(): Sessie {
  return {
    workshopId: "", datum: "", startTijd: "09:00", eindTijd: "12:30", aanwezigVanaf: "08:30",
    deelnemers: 0, leeftijd: "", doelgroep: "", ruimte: "", vergoeding: 0,
    aantalDocenten: 1, aantalAssistenten: 0, benodigdheden: "", kleding: "", bijzonderheden: "",
    aanmeldDeadline: "", rondes: [],
  };
}

export default function Wizard({ klanten, workshops }: { klanten: Klant[]; workshops: Workshop[] }) {
  const router = useRouter();
  const [stap, setStap] = useState(1);
  const [clientId, setClientId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [contactId, setContactId] = useState("");
  const [naam, setNaam] = useState("");
  const [omzet, setOmzet] = useState(0);
  const [notitie, setNotitie] = useState("");
  const [interneNotitie, setInterneNotitie] = useState("");
  const [sessies, setSessies] = useState<Sessie[]>([legeSessie()]);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  const klant = klanten.find((k) => k.id === clientId);

  function wijzig(i: number, patch: Partial<Sessie>) {
    setSessies((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function kiesWorkshop(i: number, id: string) {
    const w = workshops.find((x) => x.id === id);
    wijzig(i, { workshopId: id, vergoeding: w?.vergoeding ?? 0, aantalDocenten: w?.docenten ?? 1 });
  }

  function rondesGenereren(i: number, aantal: number) {
    const s = sessies[i];
    const w = workshops.find((x) => x.id === s.workshopId);
    const duur = w?.duur ?? 60;
    const pauze = 15;
    const [h, m] = s.startTijd.split(":").map(Number);
    let t = h * 60 + m;
    const rondes: Ronde[] = [];
    for (let n = 1; n <= aantal; n++) {
      const eind = t + duur;
      rondes.push({
        nummer: n,
        startTijd: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
        eindTijd: `${String(Math.floor(eind / 60)).padStart(2, "0")}:${String(eind % 60).padStart(2, "0")}`,
        groep: `Groep ${n}`,
        deelnemers: 0,
      });
      t = eind + pauze;
    }
    const laatste = rondes[rondes.length - 1];
    wijzig(i, { rondes, eindTijd: laatste ? laatste.eindTijd : s.eindTijd });
  }

  function opslaan() {
    setFout(null);
    if (!clientId || naam.trim().length < 2) return setFout("Kies een klant en geef het project een naam.");
    if (sessies.some((s) => !s.workshopId || !s.datum)) return setFout("Elk workshopmoment heeft een workshop en een datum nodig.");
    start(async () => {
      const res = await projectAanmaken({ clientId, locationId, contactId, naam, omzet, notitie, interneNotitie, sessies });
      if (res?.fout) setFout(res.fout);
      else if (res?.id) router.push(`/beheer/projecten/${res.id}`);
    });
  }

  return (
    <div className="max-w-4xl space-y-5">
      <ol className="flex gap-2 text-sm">
        {["Klant", "Workshopmomenten", "Controleren"].map((t, i) => (
          <li key={t} className={`flex-1 rounded-lg border px-3 py-2 ${stap === i + 1 ? "border-skool-400 bg-skool-50 font-semibold text-skool-800" : "border-neutral-200 bg-white text-neutral-500"}`}>
            {i + 1}. {t}
          </li>
        ))}
      </ol>

      {stap === 1 && (
        <div className="kaart space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="klant">Klant</label>
              <select id="klant" value={clientId} onChange={(e) => { setClientId(e.target.value); setLocationId(""); setContactId(""); }} className="veld">
                <option value="">Kies een klant</option>
                {klanten.map((k) => <option key={k.id} value={k.id}>{k.naam}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pnaam">Projectnaam</label>
              <input id="pnaam" value={naam} onChange={(e) => setNaam(e.target.value)} className="veld" placeholder="Bijvoorbeeld Projectweek groep 7 en 8" />
            </div>
            <div>
              <label className="label" htmlFor="loc">Locatie</label>
              <select id="loc" value={locationId} onChange={(e) => setLocationId(e.target.value)} className="veld" disabled={!klant}>
                <option value="">Kies een locatie</option>
                {klant?.locaties.map((l) => <option key={l.id} value={l.id}>{l.naam}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cont">Contactpersoon op de dag</label>
              <select id="cont" value={contactId} onChange={(e) => setContactId(e.target.value)} className="veld" disabled={!klant}>
                <option value="">Kies een contactpersoon</option>
                {klant?.contacten.map((c) => <option key={c.id} value={c.id}>{c.naam}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="omzet">Omzet in euro</label>
              <input id="omzet" type="number" step="0.01" value={omzet} onChange={(e) => setOmzet(Number(e.target.value))} className="veld" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="not">Notitie voor docenten</label>
            <textarea id="not" value={notitie} onChange={(e) => setNotitie(e.target.value)} rows={2} className="veld" />
          </div>
          <div>
            <label className="label" htmlFor="inot">Interne notitie</label>
            <textarea id="inot" value={interneNotitie} onChange={(e) => setInterneNotitie(e.target.value)} rows={2} className="veld" />
          </div>
          <button className="knop-primair" onClick={() => setStap(2)} disabled={!clientId || naam.trim().length < 2}>Volgende</button>
        </div>
      )}

      {stap === 2 && (
        <div className="space-y-4">
          {sessies.map((s, i) => (
            <div key={i} className="kaart space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Workshopmoment {i + 1}</h2>
                {sessies.length > 1 && (
                  <button className="knop-ghost text-sm text-red-700" onClick={() => setSessies(sessies.filter((_, j) => j !== i))}>Verwijderen</button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="label">Workshop</label>
                  <select value={s.workshopId} onChange={(e) => kiesWorkshop(i, e.target.value)} className="veld">
                    <option value="">Kies een workshop</option>
                    {workshops.map((w) => <option key={w.id} value={w.id}>{w.categorie} · {w.naam}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Datum</label>
                  <input type="date" value={s.datum} onChange={(e) => wijzig(i, { datum: e.target.value })} className="veld" />
                </div>
                <div>
                  <label className="label">Aanwezig vanaf</label>
                  <input type="time" value={s.aanwezigVanaf} onChange={(e) => wijzig(i, { aanwezigVanaf: e.target.value })} className="veld" />
                </div>
                <div>
                  <label className="label">Starttijd</label>
                  <input type="time" value={s.startTijd} onChange={(e) => wijzig(i, { startTijd: e.target.value })} className="veld" />
                </div>
                <div>
                  <label className="label">Eindtijd</label>
                  <input type="time" value={s.eindTijd} onChange={(e) => wijzig(i, { eindTijd: e.target.value })} className="veld" />
                </div>
                <div>
                  <label className="label">Deelnemers</label>
                  <input type="number" min={0} value={s.deelnemers} onChange={(e) => wijzig(i, { deelnemers: Number(e.target.value) })} className="veld" />
                </div>
                <div>
                  <label className="label">Leeftijd of leerjaar</label>
                  <input value={s.leeftijd} onChange={(e) => wijzig(i, { leeftijd: e.target.value })} className="veld" placeholder="groep 7 en 8" />
                </div>
                <div>
                  <label className="label">Doelgroep</label>
                  <input value={s.doelgroep} onChange={(e) => wijzig(i, { doelgroep: e.target.value })} className="veld" placeholder="Basisonderwijs" />
                </div>
                <div>
                  <label className="label">Vergoeding per docent</label>
                  <input type="number" step="0.01" value={s.vergoeding} onChange={(e) => wijzig(i, { vergoeding: Number(e.target.value) })} className="veld" />
                </div>
                <div>
                  <label className="label">Aantal docenten</label>
                  <input type="number" min={1} value={s.aantalDocenten} onChange={(e) => wijzig(i, { aantalDocenten: Number(e.target.value) })} className="veld" />
                </div>
                <div>
                  <label className="label">Aantal assistenten</label>
                  <input type="number" min={0} value={s.aantalAssistenten} onChange={(e) => wijzig(i, { aantalAssistenten: Number(e.target.value) })} className="veld" />
                </div>
                <div>
                  <label className="label">Aanmelddeadline</label>
                  <input type="date" value={s.aanmeldDeadline} onChange={(e) => wijzig(i, { aanmeldDeadline: e.target.value })} className="veld" />
                </div>
                <div>
                  <label className="label">Ruimte</label>
                  <input value={s.ruimte} onChange={(e) => wijzig(i, { ruimte: e.target.value })} className="veld" placeholder="Gymzaal" />
                </div>
                <div className="sm:col-span-3">
                  <label className="label">Rondes</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button key={n} type="button" onClick={() => rondesGenereren(i, n)}
                        className={`knop px-3 text-sm ${s.rondes.length === n ? "bg-skool-500 text-white" : "border border-neutral-300 bg-white"}`}>
                        {n} {n === 1 ? "ronde" : "rondes"}
                      </button>
                    ))}
                    {s.rondes.length > 0 && (
                      <span className="text-sm text-neutral-500">
                        {s.rondes.map((r) => `${r.startTijd} tot ${r.eindTijd}`).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="label">Benodigdheden en bijzonderheden</label>
                  <textarea value={s.bijzonderheden} onChange={(e) => wijzig(i, { bijzonderheden: e.target.value })} rows={2} className="veld" />
                </div>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button className="knop-secundair" onClick={() => setSessies([...sessies, { ...legeSessie(), datum: sessies[sessies.length - 1]?.datum ?? "" }])}>
              Nog een workshopmoment
            </button>
            <button className="knop-ghost" onClick={() => setStap(1)}>Terug</button>
            <button className="knop-primair ml-auto" onClick={() => setStap(3)}>Volgende</button>
          </div>
        </div>
      )}

      {stap === 3 && (
        <div className="kaart space-y-4 p-5">
          <h2 className="font-semibold">Controleren en opslaan</h2>
          <p className="text-sm text-neutral-600">
            {naam} voor {klant?.naam} met {sessies.length} {sessies.length === 1 ? "workshopmoment" : "workshopmomenten"}.
            Na opslaan kun je per positie publiceren of docenten persoonlijk uitnodigen.
          </p>
          <ul className="space-y-1 text-sm">
            {sessies.map((s, i) => (
              <li key={i} className="flex justify-between border-b border-neutral-100 py-2">
                <span>{workshops.find((w) => w.id === s.workshopId)?.naam ?? "Geen workshop"}</span>
                <span className="text-neutral-500">{s.datum} · {s.startTijd} tot {s.eindTijd} · {s.aantalDocenten} docent(en)</span>
              </li>
            ))}
          </ul>
          {fout && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}
          <div className="flex gap-2">
            <button className="knop-ghost" onClick={() => setStap(2)}>Terug</button>
            <button className="knop-primair ml-auto" onClick={opslaan} disabled={bezig}>{bezig ? "Bezig..." : "Project opslaan"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
