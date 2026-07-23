"use client";

import { useState, useTransition } from "react";
import { docentUitnodigen } from "@/lib/planning-acties";

export default function UitnodigenForm() {
  const [open, setOpen] = useState(false);
  const [bericht, setBericht] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  function verzend(fd: FormData) {
    setFout(null); setBericht(null);
    start(async () => {
      const res = await docentUitnodigen(fd);
      if (res?.fout) setFout(res.fout);
      else { setBericht("Uitnodiging verstuurd. De workshopdocent ontvangt een activatielink."); setOpen(false); }
    });
  }

  return (
    <div className="mb-4">
      {!open && (
        <button onClick={() => setOpen(true)} className="knop-primair">
          Workshopdocent uitnodigen
        </button>
      )}
      {bericht && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{bericht}</p>}
      {open && (
        <form action={verzend} className="kaart mt-3 grid gap-3 p-4 sm:grid-cols-4">
          <div>
            <label className="label" htmlFor="voornaam">Voornaam</label>
            <input id="voornaam" name="voornaam" required className="veld" />
          </div>
          <div>
            <label className="label" htmlFor="achternaam">Achternaam</label>
            <input id="achternaam" name="achternaam" required className="veld" />
          </div>
          <div>
            <label className="label" htmlFor="d-email">E-mailadres</label>
            <input id="d-email" name="email" type="email" required className="veld" />
          </div>
          <div className="flex items-end gap-2">
            <button className="knop-primair flex-1" disabled={bezig}>{bezig ? "Bezig..." : "Versturen"}</button>
            <button type="button" onClick={() => setOpen(false)} className="knop-secundair">Annuleren</button>
          </div>
          {fout && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-4">{fout}</p>}
        </form>
      )}
    </div>
  );
}
