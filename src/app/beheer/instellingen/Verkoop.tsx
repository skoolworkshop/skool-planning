"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verkooptarievenOpslaan } from "@/lib/tarief-acties";
import type { Verkooptarieven } from "@/lib/tarieven";

/** Wat de klant betaalt. Los van wat de workshopdocent krijgt. */
export default function Verkoop({ tarieven }: { tarieven: Verkooptarieven }) {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [melding, setMelding] = useState("");
  const [fout, setFout] = useState("");

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        setFout("");
        setMelding("");
        start(async () => {
          const res = await verkooptarievenOpslaan(fd);
          if (res?.fout) return setFout(res.fout);
          setMelding("Opgeslagen.");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="starttarief">Starttarief</label>
          <input id="starttarief" name="starttarief" type="number" step="0.01" min="0" defaultValue={tarieven.starttarief} className="veld" />
          <p className="mt-1 text-xs text-zand-500">Eenmalig per opdracht.</p>
        </div>
        <div>
          <label className="label" htmlFor="extraDeelnemer">Extra deelnemer</label>
          <input id="extraDeelnemer" name="extraDeelnemer" type="number" step="0.01" min="0" defaultValue={tarieven.extraDeelnemer} className="veld" />
          <p className="mt-1 text-xs text-zand-500">Per persoon boven het maximum.</p>
        </div>
        <div>
          <label className="label" htmlFor="maxDeelnemers">Inbegrepen deelnemers</label>
          <input id="maxDeelnemers" name="maxDeelnemers" type="number" min="1" defaultValue={tarieven.maxDeelnemers} className="veld" />
        </div>
        <div>
          <label className="label" htmlFor="kmTariefKlant">Reiskosten naar de klant</label>
          <input id="kmTariefKlant" name="kmTariefKlant" type="number" step="0.01" min="0" defaultValue={tarieven.kmTariefKlant} className="veld" />
          <p className="mt-1 text-xs text-zand-500">Per kilometer.</p>
        </div>
      </div>

      <p className="text-sm text-zand-500">
        De prijs per workshop zet je bij Workshops. Wat je overhoudt zie je bij elke opdracht.
      </p>

      {fout && <p className="text-sm text-red-700">{fout}</p>}
      {melding && <p className="text-sm text-emerald-700">{melding}</p>}

      <button type="submit" disabled={bezig} className="knop knop-primair px-5 py-2 text-sm">
        {bezig ? "Bezig" : "Verkooptarieven opslaan"}
      </button>
    </form>
  );
}
