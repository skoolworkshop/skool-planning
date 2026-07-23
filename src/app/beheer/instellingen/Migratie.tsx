"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { doelgroepenMigreren, type MigratieRapport } from "@/lib/migratie-acties";

/** Eenmalige omzetting van oude vrije doelgroepteksten naar de vaste lijst. */
export default function Migratie() {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [rapport, setRapport] = useState<MigratieRapport | null>(null);

  return (
    <div>
      <p className="mb-3 text-sm text-zand-500">
        Zet oude doelgroepteksten om naar de vaste lijst. Je kunt dit gerust twee keer draaien,
        al omgezette gegevens blijven ongemoeid. Wat niet zeker is wordt niet gegokt maar hieronder getoond.
      </p>
      <button
        type="button"
        disabled={bezig}
        onClick={() => start(async () => { setRapport(await doelgroepenMigreren()); router.refresh(); })}
        className="knop knop-secundair px-4 py-2 text-sm"
      >
        {bezig ? "Bezig met omzetten" : "Doelgroepen omzetten"}
      </button>

      {rapport && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-zand-600">
            {rapport.klantenBijgewerkt} klanten, {rapport.sessiesBijgewerkt} workshopmomenten en{" "}
            {rapport.workshopdocentenBijgewerkt} workshopdocenten bijgewerkt.
          </p>
          {rapport.handmatig.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <p className="font-medium">Deze moet je zelf nalopen</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                {rapport.handmatig.map((h, i) => <li key={i}>{h.waar} {h.naam}: “{h.oudeWaarde}”</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
