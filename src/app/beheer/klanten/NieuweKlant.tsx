"use client";

import { useState, useTransition } from "react";
import { klantAanmaken } from "@/lib/project-acties";

const TYPES = ["BASISSCHOOL", "VOORTGEZET_ONDERWIJS", "MBO", "HBO", "UNIVERSITEIT", "BSO", "BIBLIOTHEEK", "GEMEENTE", "BEDRIJF", "ZORGINSTELLING", "JEUGDINSTELLING", "PARTICULIER", "OVERIG"];

export default function NieuweKlant() {
  const [open, setOpen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  return (
    <div className="mb-4">
      {!open && <button className="knop-primair" onClick={() => setOpen(true)}>Klant toevoegen</button>}
      {open && (
        <form
          action={(fd) => {
            setFout(null);
            start(async () => {
              const res = await klantAanmaken(fd);
              if (res?.fout) setFout(res.fout);
              else setOpen(false);
            });
          }}
          className="kaart grid gap-3 p-4 sm:grid-cols-3"
        >
          <div className="sm:col-span-2">
            <label className="label" htmlFor="k-naam">Naam</label>
            <input id="k-naam" name="naam" required className="veld" />
          </div>
          <div>
            <label className="label" htmlFor="k-type">Type</label>
            <select id="k-type" name="type" className="veld">
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ").toLowerCase()}</option>)}
            </select>
          </div>
          <div><label className="label" htmlFor="k-str">Straat</label><input id="k-str" name="straat" className="veld" /></div>
          <div><label className="label" htmlFor="k-nr">Huisnummer</label><input id="k-nr" name="huisnummer" className="veld" /></div>
          <div><label className="label" htmlFor="k-pc">Postcode</label><input id="k-pc" name="postcode" className="veld" /></div>
          <div><label className="label" htmlFor="k-pl">Plaats</label><input id="k-pl" name="plaats" required className="veld" /></div>
          <div><label className="label" htmlFor="k-cn">Contactpersoon</label><input id="k-cn" name="contactNaam" className="veld" /></div>
          <div><label className="label" htmlFor="k-ce">E-mail contactpersoon</label><input id="k-ce" name="contactEmail" type="email" className="veld" /></div>
          <div className="flex items-end gap-2 sm:col-span-3">
            <button className="knop-primair" disabled={bezig}>{bezig ? "Bezig..." : "Opslaan"}</button>
            <button type="button" className="knop-secundair" onClick={() => setOpen(false)}>Annuleren</button>
          </div>
          {fout && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-3">{fout}</p>}
        </form>
      )}
    </div>
  );
}
