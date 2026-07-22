"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { workshopTekstOpslaan } from "@/lib/opdracht-acties";

type Props = { workshopId: string; naam: string; tekst: string; link: string };

export default function Benodigdheden({ workshopId, naam, tekst, link }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bezig, start] = useTransition();

  if (!open) {
    return (
      <div className="mt-3 border-t border-neutral-100 pt-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-neutral-500">Benodigdheden voor de klant</span>
          <button type="button" onClick={() => setOpen(true)} className="knop knop-ghost px-2 py-0.5 text-xs">
            {tekst ? "Bewerken" : "Invullen"}
          </button>
        </div>
        <p className="mt-1 line-clamp-3 text-xs text-neutral-600">
          {tekst || <span className="text-neutral-400">Nog niet ingevuld. Deze tekst komt in de bevestigingsmail.</span>}
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-3 space-y-2 border-t border-neutral-100 pt-3"
      action={(fd) => {
        start(async () => {
          await workshopTekstOpslaan(workshopId, fd);
          setOpen(false);
          router.refresh();
        });
      }}
    >
      <label className="label" htmlFor={`ben-${workshopId}`}>Wat regelt de opdrachtgever voor {naam}?</label>
      <textarea id={`ben-${workshopId}`} name="klantBenodigdheden" defaultValue={tekst} rows={5} className="veld text-sm" />
      <label className="label" htmlFor={`lnk-${workshopId}`}>Link naar een voorbeeld</label>
      <input id={`lnk-${workshopId}`} name="voorbeeldLink" defaultValue={link} placeholder="https://" className="veld text-sm" />
      <div className="flex gap-2">
        <button type="submit" disabled={bezig} className="knop knop-primair px-3 py-1 text-sm">{bezig ? "Bezig" : "Opslaan"}</button>
        <button type="button" onClick={() => setOpen(false)} className="knop knop-ghost px-3 py-1 text-sm">Annuleren</button>
      </div>
    </form>
  );
}
