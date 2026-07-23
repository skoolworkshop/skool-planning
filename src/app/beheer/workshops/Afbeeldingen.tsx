"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { afbeeldingenSynchroniseren } from "@/lib/afbeeldingen";

export default function Afbeeldingen() {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [melding, setMelding] = useState("");
  const [controle, setControle] = useState<{ naam: string; reden: string }[]>([]);

  function synchroniseren() {
    setMelding("");
    setControle([]);
    start(async () => {
      const res = await afbeeldingenSynchroniseren();
      setMelding(
        `${res.gelukt} foto's opgehaald en opgeslagen` +
          (res.overgeslagen > 0 ? `, ${res.overgeslagen} waren al actueel` : "") +
          (res.controle.length > 0 ? `, ${res.controle.length} vragen om aandacht` : "")
      );
      setControle(res.controle);
      router.refresh();
    });
  }

  return (
    <div className="text-right">
      <button type="button" onClick={synchroniseren} disabled={bezig} className="knop knop-secundair px-4 py-2 text-sm">
        {bezig ? "Bezig met ophalen" : "Foto's ophalen van de site"}
      </button>
      {melding && <p className="mt-2 max-w-sm text-sm text-zand-500">{melding}</p>}
      {controle.length > 0 && (
        <div className="mt-2 max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900">
          <p className="font-medium">Deze workshops hebben nog geen foto</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
            {controle.map((c) => <li key={c.naam}>{c.naam}: {c.reden}</li>)}
          </ul>
          <p className="mt-2 text-xs">Koppel ze hieronder handmatig aan de juiste pagina.</p>
        </div>
      )}
    </div>
  );
}
