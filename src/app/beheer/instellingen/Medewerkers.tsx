"use client";

import { useState, useTransition } from "react";
import { Kaart, Badge } from "@/components/ui";
import { medewerkerAanmaken } from "@/lib/planning-acties";

export default function Medewerkers({ gebruikers }: { gebruikers: { id: string; email: string; rol: string; actief: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  return (
    <Kaart>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Medewerkers</h2>
        <button className="knop-secundair" onClick={() => setOpen(!open)}>{open ? "Sluiten" : "Medewerker toevoegen"}</button>
      </div>

      {open && (
        <form
          action={(fd) => {
            setFout(null);
            start(async () => {
              const res = await medewerkerAanmaken(fd);
              if (res?.fout) setFout(res.fout);
              else setOpen(false);
            });
          }}
          className="mb-4 grid gap-3 sm:grid-cols-4"
        >
          <div className="sm:col-span-2"><label className="label" htmlFor="m-email">E-mailadres</label><input id="m-email" name="email" type="email" required className="veld" /></div>
          <div>
            <label className="label" htmlFor="m-rol">Rol</label>
            <select id="m-rol" name="rol" className="veld">
              <option value="PLANNER">Planner</option>
              <option value="FINANCIEEL">Financiële administratie</option>
              <option value="LEZER">Alleen lezen</option>
              <option value="SUPERBEHEERDER">Superbeheerder</option>
            </select>
          </div>
          <div><label className="label" htmlFor="m-pw">Wachtwoord</label><input id="m-pw" name="wachtwoord" type="password" minLength={10} required className="veld" /></div>
          <div className="sm:col-span-4">
            <button className="knop-primair" disabled={bezig}>{bezig ? "Bezig..." : "Aanmaken"}</button>
          </div>
          {fout && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-4">{fout}</p>}
        </form>
      )}

      <ul className="space-y-1 text-sm">
        {gebruikers.map((g) => (
          <li key={g.id} className="flex items-center gap-2 border-b border-neutral-100 py-1.5">
            <span className="font-medium">{g.email}</span>
            <Badge kleur="grijs">{g.rol}</Badge>
            {!g.actief && <Badge kleur="rood">Inactief</Badge>}
          </li>
        ))}
      </ul>
    </Kaart>
  );
}
