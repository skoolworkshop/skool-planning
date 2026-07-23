"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { workshopPrijsOpslaan } from "@/lib/tarief-acties";

/** Verkoopprijs per 60 minuten, wat de klant voor deze workshop betaalt. */
export default function Prijs({ workshopId, prijs }: { workshopId: string; prijs: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [waarde, setWaarde] = useState(prijs);
  const [bezig, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="knop knop-ghost px-2 py-0.5 text-xs">
        Prijs aanpassen
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-end gap-2">
      <div className="flex-1">
        <label className="label" htmlFor={`prijs-${workshopId}`}>Verkoopprijs per 60 minuten</label>
        <input
          id={`prijs-${workshopId}`}
          type="number" step="0.01" min="0"
          value={waarde}
          onChange={(e) => setWaarde(e.target.value)}
          className="veld text-sm"
        />
      </div>
      <button
        type="button"
        disabled={bezig}
        onClick={() => start(async () => { await workshopPrijsOpslaan(workshopId, waarde); setOpen(false); router.refresh(); })}
        className="knop knop-primair px-3 py-1.5 text-sm"
      >
        {bezig ? "Bezig" : "Opslaan"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="knop knop-ghost px-2 py-1.5 text-sm">Terug</button>
    </div>
  );
}
