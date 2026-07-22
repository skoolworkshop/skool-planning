"use client";

import { useState, useTransition } from "react";
import { leerlingenImporteren } from "@/lib/inschrijving-acties";
import { Kaart, Melding, Badge } from "@/components/ui";

type L = { id: string; naam: string; klas: string; klaar: boolean };

export default function Leerlingen({ enrollmentId, leerlingen }: { enrollmentId: string; leerlingen: L[] }) {
  const [bezig, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [filter, setFilter] = useState("alle");

  const klassen = [...new Set(leerlingen.map((l) => l.klas))].sort();
  const zichtbaar = leerlingen.filter((l) => {
    if (filter === "alle") return true;
    if (filter === "open") return !l.klaar;
    return l.klas === filter;
  });

  function importeer() {
    setFout(null); setOk(null);
    start(async () => {
      const r = await leerlingenImporteren(enrollmentId, csv);
      if (r?.fout) setFout(r.fout);
      else {
        setOk(`${r.toegevoegd} leerlingen toegevoegd${r.overgeslagen ? `, ${r.overgeslagen} stonden er al in` : ""}.`);
        setCsv("");
        setOpen(false);
      }
    });
  }

  async function bestand(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCsv(await f.text());
  }

  const klaar = leerlingen.filter((l) => l.klaar).length;

  return (
    <Kaart>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Leerlingen</h2>
        <button className="knop-secundair" onClick={() => setOpen(!open)}>
          {open ? "Annuleren" : "Leerlingen toevoegen"}
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-lg bg-neutral-50 p-3">
          <p className="text-sm text-neutral-600">
            Plak de lijst of kies een CSV bestand. Kolommen: voornaam, achternaam, klas, email.
            De eerste regel mag een koprij zijn.
          </p>
          <input type="file" accept=".csv,.txt" onChange={bestand} className="mt-2 text-sm" />
          <textarea
            className="veld mt-2 font-mono text-sm"
            rows={6}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={"voornaam;achternaam;klas;email\nSem;Jansen;2A;sem@example.com"}
          />
          <button className="knop-primair mt-2" disabled={bezig || !csv.trim()} onClick={importeer}>
            {bezig ? "Bezig" : "Importeren"}
          </button>
        </div>
      )}

      {fout && <div className="mt-3"><Melding soort="fout">{fout}</Melding></div>}
      {ok && <div className="mt-3"><Melding soort="ok">{ok}</Melding></div>}

      {leerlingen.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          Nog geen leerlingen. Zonder lijst kunnen leerlingen zichzelf toevoegen met hun naam en klas.
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-neutral-500">{klaar} van {leerlingen.length} ingeschreven</span>
            <select className="veld w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="alle">Alle klassen</option>
              <option value="open">Nog niet ingeschreven</option>
              {klassen.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto">
            <table className="tabel">
              <thead>
                <tr><th>Naam</th><th>Klas</th><th>Status</th></tr>
              </thead>
              <tbody>
                {zichtbaar.map((l) => (
                  <tr key={l.id}>
                    <td>{l.naam}</td>
                    <td>{l.klas}</td>
                    <td>
                      {l.klaar
                        ? <Badge kleur="groen">Ingeschreven</Badge>
                        : <Badge kleur="geel">Nog niet</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Kaart>
  );
}
