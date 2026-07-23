"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { afbeeldingHandmatig } from "@/lib/afbeeldingen";

/** Handmatig een foto aan een workshop koppelen. */
export default function Koppeling({ workshopId, slug, controle }: { workshopId: string; slug: string; controle: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [waarde, setWaarde] = useState(slug);
  const [fout, setFout] = useState("");
  const [bezig, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`knop w-full py-2 text-sm ${controle ? "knop-primair" : "knop-secundair"}`}
      >
        {controle ? "Foto koppelen" : "Andere foto kiezen"}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-zand-300 bg-zand-100 p-3">
      <label className="label" htmlFor={`slug-${workshopId}`}>Fotolink of pagina</label>
      <input
        id={`slug-${workshopId}`}
        value={waarde}
        onChange={(e) => setWaarde(e.target.value)}
        placeholder="https://... .jpg of workshop-graffiti"
        className="veld text-sm"
      />
      <p className="text-xs text-zand-500">
        Werkt de pagina niet? Open hem op de site, klik met rechts op de foto, kies
        Afbeeldingslocatie kopiëren en plak die link hier.
      </p>
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
          className="knop knop-primair px-4 py-1.5 text-sm"
        >
          {bezig ? "Bezig" : "Ophalen"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="knop knop-ghost px-3 py-1.5 text-sm">Annuleren</button>
      </div>
    </div>
  );
}
