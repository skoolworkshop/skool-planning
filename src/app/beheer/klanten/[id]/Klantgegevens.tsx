"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Rij } from "@/components/ui";
import { klantGegevensOpslaan } from "@/lib/opdracht-acties";

type Props = {
  clientId: string;
  onderwijs: boolean;
  doelgroep: string;
  cjpNummer: string;
  factuurAdres: string;
  factuurEmail: string;
  betaaltermijn: number;
  tags: string[];
};

export default function Klantgegevens(p: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState("");

  if (!open) {
    return (
      <>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Klantgegevens</h2>
          <button type="button" onClick={() => setOpen(true)} className="knop knop-ghost px-2 py-1 text-xs">Bewerken</button>
        </div>
        <Rij label="Doelgroep">{p.doelgroep}</Rij>
        {p.onderwijs && <Rij label="CJP schoolnummer">{p.cjpNummer}</Rij>}
        <Rij label="Factuuradres">{p.factuurAdres}</Rij>
        <Rij label="Factuur e-mail">{p.factuurEmail}</Rij>
        <Rij label="Betaaltermijn">{p.betaaltermijn} dagen</Rij>
        <Rij label="Tags">{p.tags.join(", ")}</Rij>
      </>
    );
  }

  return (
    <>
      <h2 className="mb-3 font-semibold">Klantgegevens bewerken</h2>
      <form
        className="space-y-3"
        action={(fd) => {
          setFout("");
          start(async () => {
            const res = await klantGegevensOpslaan(p.clientId, fd);
            if (res?.fout) return setFout(res.fout);
            setOpen(false);
            router.refresh();
          });
        }}
      >
        <div>
          <label className="label" htmlFor="doelgroep">Doelgroep</label>
          <input id="doelgroep" name="doelgroep" defaultValue={p.doelgroep} className="veld" />
        </div>

        {p.onderwijs && (
          <div>
            <label className="label" htmlFor="cjp">CJP schoolnummer</label>
            <input id="cjp" name="cjpNummer" defaultValue={p.cjpNummer} placeholder="Alleen als de school met de Cultuurkaart betaalt" className="veld" />
          </div>
        )}

        <div>
          <label className="label" htmlFor="fadres">Factuuradres</label>
          <input id="fadres" name="factuurAdres" defaultValue={p.factuurAdres} className="veld" />
        </div>
        <div>
          <label className="label" htmlFor="femail">Factuur e-mail</label>
          <input id="femail" name="factuurEmail" type="email" defaultValue={p.factuurEmail} className="veld" />
        </div>
        <div>
          <label className="label" htmlFor="termijn">Betaaltermijn in dagen</label>
          <input id="termijn" name="betaaltermijn" type="number" min={0} defaultValue={p.betaaltermijn} className="veld" />
        </div>

        {fout && <p className="text-sm text-red-700">{fout}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={bezig} className="knop knop-primair px-4 py-2 text-sm">{bezig ? "Bezig" : "Opslaan"}</button>
          <button type="button" onClick={() => setOpen(false)} className="knop knop-ghost px-3 py-2 text-sm">Annuleren</button>
        </div>
      </form>
    </>
  );
}
