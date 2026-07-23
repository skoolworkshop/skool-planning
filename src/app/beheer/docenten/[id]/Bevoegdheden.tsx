"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bevoegdheidZetten } from "@/lib/opdracht-acties";

type W = { id: string; naam: string; categorie: string; bevoegdheid: string };

const OPTIES = [
  { waarde: "ZELFSTANDIG", label: "Mag zelfstandig geven" },
  { waarde: "ASSISTEREN", label: "Mag assisteren" },
  { waarde: "NIET_INZETBAAR", label: "Niet inzetbaar" },
  { waarde: "GEEN", label: "Niet gekoppeld" },
] as const;

/** Alleen een beheerder bepaalt welke workshops een workshopdocent mag geven. */
export default function Bevoegdheden({ teacherId, workshops }: { teacherId: string; workshops: W[] }) {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [zoek, setZoek] = useState("");
  const [alleen, setAlleen] = useState(true);

  const zichtbaar = workshops
    .filter((w) => (alleen ? w.bevoegdheid !== "GEEN" : true))
    .filter((w) => (w.naam + " " + w.categorie).toLowerCase().includes(zoek.toLowerCase()));

  function zet(workshopId: string, waarde: string) {
    start(async () => {
      await bevoegdheidZetten(teacherId, workshopId, waarde as never);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek een workshop" className="veld w-full sm:w-64" />
        <button type="button" onClick={() => setAlleen(!alleen)} className="knop knop-secundair px-3 py-2 text-sm">
          {alleen ? "Toon alle workshops" : "Toon alleen gekoppelde"}
        </button>
      </div>

      {zichtbaar.length === 0 ? (
        <p className="text-sm text-zand-500">Geen workshops gevonden. Klik op de knop hierboven om alles te zien.</p>
      ) : (
        <ul className="space-y-2">
          {zichtbaar.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center gap-2 border-b border-zand-200 pb-2 last:border-0">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{w.naam}</span>
                <span className="block text-xs text-zand-500">{w.categorie}</span>
              </span>
              <label className="sr-only" htmlFor={`bev-${w.id}`}>Bevoegdheid voor {w.naam}</label>
              <select
                id={`bev-${w.id}`}
                value={w.bevoegdheid}
                disabled={bezig}
                onChange={(e) => zet(w.id, e.target.value)}
                className="veld w-auto min-w-[12rem] py-1.5 text-sm"
              >
                {OPTIES.map((o) => <option key={o.waarde} value={o.waarde}>{o.label}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
