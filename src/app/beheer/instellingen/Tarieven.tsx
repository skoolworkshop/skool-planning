"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { tarievenOpslaan } from "@/lib/tarief-acties";
import type { Tarieven } from "@/lib/tarieven";

export default function TarievenFormulier({ tarieven }: { tarieven: Tarieven }) {
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
          const res = await tarievenOpslaan(fd);
          if (res?.fout) return setFout(res.fout);
          setMelding("Opgeslagen. Nieuwe berekeningen gebruiken deze tarieven.");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="uurtarief">Uurtarief workshopdocent</label>
          <input id="uurtarief" name="uurtarief" type="number" step="0.01" min="0" defaultValue={tarieven.uurtarief} className="veld" />
          <p className="mt-1 text-xs text-zand-500">In euro per gewerkt uur.</p>
        </div>
        <div>
          <label className="label" htmlFor="minimumPerDag">Minimum per dag</label>
          <input id="minimumPerDag" name="minimumPerDag" type="number" step="0.01" min="0" defaultValue={tarieven.minimumPerDag} className="veld" />
          <p className="mt-1 text-xs text-zand-500">Een kortere dag wordt hiermee aangevuld.</p>
        </div>
        <div>
          <label className="label" htmlFor="kmTarief">Kilometervergoeding</label>
          <input id="kmTarief" name="kmTarief" type="number" step="0.01" min="0" defaultValue={tarieven.kmTarief} className="veld" />
          <p className="mt-1 text-xs text-zand-500">Per kilometer. Wordt heen en terug gerekend.</p>
        </div>
        <div>
          <label className="label" htmlFor="reistijdDrempelMinuten">Reistijd vergoed vanaf</label>
          <input id="reistijdDrempelMinuten" name="reistijdDrempelMinuten" type="number" step="5" min="0" defaultValue={tarieven.reistijdDrempelMinuten} className="veld" />
          <p className="mt-1 text-xs text-zand-500">In minuten enkele reis. Standaard 90.</p>
        </div>
        <div>
          <label className="label" htmlFor="reistijdDeel">Deel van het uurtarief</label>
          <input id="reistijdDeel" name="reistijdDeel" type="number" step="0.05" min="0" max="1" defaultValue={tarieven.reistijdDeel} className="veld" />
          <p className="mt-1 text-xs text-zand-500">0,5 betekent het halve uurtarief.</p>
        </div>
      </div>

      <div className="rounded-lg border border-zand-200 bg-zand-100 p-3 text-sm">
        <p className="font-medium">Hoe het rekent</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-zand-600">
          <li>Gewerkte uren maal het uurtarief, met het dagminimum eroverheen.</li>
          <li>Reiskosten zijn de afstand van huis naar de locatie maal het kilometertarief, maal twee voor heen en terug.</li>
          <li>Duurt de enkele reis langer dan de drempel, dan komt daar reistijd bovenop tegen het halve uurtarief, ook heen en terug.</li>
        </ul>
      </div>

      {fout && <p className="text-sm text-red-700">{fout}</p>}
      {melding && <p className="text-sm text-emerald-700">{melding}</p>}

      <button type="submit" disabled={bezig} className="knop knop-primair px-5 py-2 text-sm">
        {bezig ? "Bezig" : "Tarieven opslaan"}
      </button>
    </form>
  );
}
