"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leerlingAanmelden, leerlingKiezen } from "@/lib/inschrijving-acties";

type L = { id: string; naam: string; klaar: boolean };

export default function NaamFormulier({
  titel, klas, welkomtekst, leerlingen,
}: { titel: string; klas: string | null; welkomtekst: string | null; leerlingen: L[] }) {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);
  const [zoek, setZoek] = useState("");
  const [handmatig, setHandmatig] = useState(leerlingen.length === 0);

  function kiezen(id: string) {
    start(async () => {
      const r = await leerlingKiezen(id);
      if (r?.fout) setFout(r.fout);
      else router.refresh();
    });
  }

  function versturen(fd: FormData) {
    setFout(null);
    start(async () => {
      const r = await leerlingAanmelden(fd);
      if (r?.fout) setFout(r.fout);
      else router.refresh();
    });
  }

  const zichtbaar = leerlingen.filter((l) => l.naam.toLowerCase().includes(zoek.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-bold">{titel}</h1>
      {welkomtekst && <p className="mt-2 text-neutral-600">{welkomtekst}</p>}

      {!handmatig ? (
        <>
          <p className="mt-4 text-neutral-600">Wie ben jij?</p>
          <input
            className="veld mt-3"
            placeholder="Zoek je naam"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
          />
          <div className="mt-3 space-y-2">
            {zichtbaar.map((l) => (
              <button
                key={l.id}
                disabled={bezig}
                onClick={() => kiezen(l.id)}
                className="kaart flex w-full items-center justify-between p-4 text-left hover:border-skool-300"
              >
                <span className="font-medium">{l.naam}</span>
                {l.klaar && <span className="text-sm text-neutral-400">al ingeschreven</span>}
              </button>
            ))}
            {zichtbaar.length === 0 && (
              <p className="text-sm text-neutral-500">Geen naam gevonden.</p>
            )}
          </div>
          <button className="knop-ghost mt-4 w-full" onClick={() => setHandmatig(true)}>
            Mijn naam staat er niet bij
          </button>
        </>
      ) : (
        <form action={versturen} className="kaart mt-4 space-y-3 p-5">
          <div>
            <label className="label" htmlFor="voornaam">Voornaam</label>
            <input id="voornaam" name="voornaam" className="veld" required autoComplete="given-name" />
          </div>
          <div>
            <label className="label" htmlFor="achternaam">Achternaam</label>
            <input id="achternaam" name="achternaam" className="veld" autoComplete="family-name" />
          </div>
          <div>
            <label className="label" htmlFor="klas">Klas</label>
            <input id="klas" name="klas" className="veld" defaultValue={klas ?? ""} required />
          </div>
          {fout && <p className="text-sm text-red-700">{fout}</p>}
          <button className="knop-primair w-full" disabled={bezig}>
            {bezig ? "Bezig" : "Verder"}
          </button>
          {leerlingen.length > 0 && (
            <button type="button" className="knop-ghost w-full" onClick={() => setHandmatig(false)}>
              Terug naar de lijst
            </button>
          )}
        </form>
      )}
    </div>
  );
}
