"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { maandOpties } from "@/lib/maand";

/**
 * Maandnavigatie. Zet de gekozen maand in de URL, zodat de serverpagina
 * de juiste gegevens ophaalt en je een link kunt delen.
 */
export default function Maandkiezer({ sleutel, label, vorige, volgende, isHuidige }: {
  sleutel: string;
  label: string;
  vorige: string;
  volgende: string;
  isHuidige: boolean;
}) {
  const router = useRouter();
  const pad = usePathname();
  const params = useSearchParams();

  function ga(nieuw: string) {
    const p = new URLSearchParams(params.toString());
    p.set("maand", nieuw);
    router.push(`${pad}?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => ga(vorige)} className="knop knop-secundair px-3 py-1.5 text-sm" aria-label="Vorige maand">
        ← Vorige
      </button>

      <label className="sr-only" htmlFor="maandkeuze">Maand kiezen</label>
      <select
        id="maandkeuze"
        value={sleutel}
        onChange={(e) => ga(e.target.value)}
        className="veld w-auto min-w-[10rem] py-1.5 text-sm font-medium"
      >
        {maandOpties().map((m) => (
          <option key={m.waarde} value={m.waarde}>{m.label}</option>
        ))}
      </select>

      <button type="button" onClick={() => ga(volgende)} className="knop knop-secundair px-3 py-1.5 text-sm" aria-label="Volgende maand">
        Volgende →
      </button>

      {!isHuidige && (
        <button type="button" onClick={() => ga(maandOpties(new Date(), 0, 0)[0].waarde)} className="knop knop-ghost px-3 py-1.5 text-sm">
          Huidige maand
        </button>
      )}

      <span className="sr-only">Weergegeven maand: {label}</span>
    </div>
  );
}
