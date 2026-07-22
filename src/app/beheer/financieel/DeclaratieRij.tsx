"use client";

import { useState, useTransition } from "react";
import { Badge, statusKleur } from "@/components/ui";
import { euro, label } from "@/lib/format";
import { declaratieBeoordelen } from "@/lib/planning-acties";

export default function DeclaratieRij(props: {
  id: string; docent: string; iban: string | null; workshop: string; klant: string; opdrachtDatum: string;
  uren: number; kilometers: number; regels: [string, string][]; totaal: number; status: string;
  opmerking: string | null; incident: string | null; magBeoordelen: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reden, setReden] = useState("");
  const [bedrag, setBedrag] = useState<string>("");
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  function doe(status: Parameters<typeof declaratieBeoordelen>[1]) {
    setFout(null);
    const nieuw = bedrag !== "" ? Number(bedrag) : undefined;
    if (nieuw !== undefined && reden.trim().length < 3) return setFout("Geef een reden op bij een aangepast bedrag.");
    start(async () => {
      const res = await declaratieBeoordelen(props.id, status, reden || undefined, nieuw);
      if (res?.fout) setFout(res.fout);
      else { setBedrag(""); setReden(""); }
    });
  }

  return (
    <div className="kaart p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left">
        <span className="font-semibold">{props.docent}</span>
        <span className="text-sm text-neutral-500">{props.workshop}, {props.klant}</span>
        <span className="text-sm text-neutral-500">{props.opdrachtDatum}</span>
        <span className="ml-auto font-semibold">{euro(props.totaal)}</span>
        <Badge kleur={statusKleur(props.status)}>{label(props.status)}</Badge>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-3 text-sm">
          <div className="grid gap-1 sm:grid-cols-2">
            {props.regels.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">{k}</span><span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between border-b border-neutral-100 py-1">
              <span className="text-neutral-500">Gewerkte uren</span><span>{props.uren}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 py-1">
              <span className="text-neutral-500">Kilometers</span><span>{props.kilometers}</span>
            </div>
            {props.iban && (
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">Bankrekening</span><span className="font-mono text-xs">{props.iban}</span>
              </div>
            )}
          </div>
          {props.opmerking && <p className="rounded bg-neutral-50 p-2">Opmerking docent: {props.opmerking}</p>}
          {props.incident && <p className="rounded bg-amber-50 p-2 text-amber-900">Incident: {props.incident}</p>}

          {props.magBeoordelen && (
            <>
              <div className="flex flex-wrap gap-2">
                <input value={bedrag} onChange={(e) => setBedrag(e.target.value)} type="number" step="0.01" placeholder="Bedrag aanpassen" className="veld w-44" aria-label="Bedrag aanpassen" />
                <input value={reden} onChange={(e) => setReden(e.target.value)} placeholder="Reden bij aanpassing" className="veld flex-1" aria-label="Reden" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="knop-primair" disabled={bezig} onClick={() => doe("GOEDGEKEURD")}>Goedkeuren</button>
                <button className="knop-secundair" disabled={bezig} onClick={() => doe("KLAAR_VOOR_BETALING")}>Klaar voor betaling</button>
                <button className="knop-secundair" disabled={bezig} onClick={() => doe("BETAALD")}>Betaald</button>
                <button className="knop-secundair" disabled={bezig} onClick={() => doe("AANVULLING_NODIG")}>Aanvulling nodig</button>
                <button className="knop-gevaar" disabled={bezig} onClick={() => doe("AFGEKEURD")}>Afkeuren</button>
              </div>
            </>
          )}
          {fout && <p className="rounded bg-red-50 px-3 py-2 text-red-700">{fout}</p>}
        </div>
      )}
    </div>
  );
}
