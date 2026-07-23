"use client";

import { useState, useTransition } from "react";
import { profielTerBeoordeling } from "@/lib/docent-acties";
import { Kaart, Melding } from "@/components/ui";

export default function Indienen({ compleet }: { compleet: boolean }) {
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);
  const [klaar, setKlaar] = useState(false);

  function indienen() {
    setFout(null);
    start(async () => {
      const r = await profielTerBeoordeling();
      if (r?.fout) setFout(r.fout);
      else setKlaar(true);
    });
  }

  if (klaar) {
    return <Melding soort="ok">Je profiel is ingediend. De planner kijkt er zo snel mogelijk naar.</Melding>;
  }

  return (
    <Kaart>
      <h2 className="font-semibold">Profiel indienen</h2>
      <p className="mt-1 text-sm text-zand-500">
        Klaar met invullen? Dien je profiel in. Na goedkeuring kun je je aanmelden voor opdrachten.
      </p>
      {!compleet && (
        <p className="mt-2 text-sm text-amber-700">
          Vul eerst je telefoonnummer, woonplaats, IBAN en minimaal één workshop in.
        </p>
      )}
      {fout && <p className="mt-2 text-sm text-red-700">{fout}</p>}
      <button onClick={indienen} disabled={bezig} className="knop-primair mt-3 w-full">
        {bezig ? "Bezig" : "Profiel indienen"}
      </button>
    </Kaart>
  );
}
