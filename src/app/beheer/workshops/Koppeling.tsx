"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { afbeeldingHandmatig } from "@/lib/afbeeldingen";

/** Handmatig een workshop aan de juiste pagina op de website koppelen. */
export default function Koppeling({ workshopId, slug, controle }: { workshopId: string; slug: string; controle: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [waarde, setWaarde] = useState(slug);
  const [fout, setFout] = useState("");
  const [bezig, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="knop knop-ghost px-2 py-0.5 text-xs">
        {controle ? "Foto koppelen" : "Andere foto koppelen"}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <label className="label" htmlFor={`slug-${workshopId}`}>Pagina op skoolworkshop.nl</label>
      <input
        id={`slug-${workshopId}`}
        value={waarde}
        onChange={(e) => setWaarde(e.target.value)}
        placeholder="workshop-graffiti of het volledige adres"
        className="veld text-sm"
      />
      {fout && <p className="text-xs text-red-700">{fout}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={bezig}
          onClick={() => {
            setFout("");
            start(async () => {
              const res = await afbeeldingHandmatig(workshopId, waarde);
              if (res.fout) return setFout(res.fout);
              setOpen(false);
              router.refresh();
            });
          }}
          className="knop knop-primair px-3 py-1 text-sm"
        >
          {bezig ? "Bezig" : "Ophalen"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="knop knop-ghost px-3 py-1 text-sm">Annuleren</button>
      </div>
    </div>
  );
}
