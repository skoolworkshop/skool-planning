"use client";

import { useState, useTransition } from "react";
import { codesGenereren } from "@/lib/inschrijving-acties";
import { Kaart, Melding } from "@/components/ui";

type C = { code: string; klas: string | null; gebruikt: number };

export default function Codes({
  enrollmentId, scope, codes, schoolcode,
}: { enrollmentId: string; scope: string; codes: C[]; schoolcode: string | null }) {
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);
  const [gekopieerd, setGekopieerd] = useState(false);

  function genereer() {
    setFout(null);
    start(async () => {
      const r = await codesGenereren(enrollmentId);
      if (r?.fout) setFout(r.fout);
    });
  }

  async function kopieer() {
    const regels = codes.map((c) => `${c.klas ?? "Hele school"}\t${c.code}`).join("\n");
    await navigator.clipboard.writeText(regels);
    setGekopieerd(true);
    setTimeout(() => setGekopieerd(false), 2000);
  }

  const uitleg =
    scope === "EVENEMENT" ? "Eén code voor de hele school." :
    scope === "KLAS" ? "Eén code per klas. De mentor deelt hem in de les." :
    "Elke leerling krijgt een eigen code.";

  return (
    <Kaart>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Toegangscodes</h2>
        <div className="flex gap-2">
          {codes.length > 0 && (
            <button className="knop-secundair" onClick={kopieer}>
              {gekopieerd ? "Gekopieerd" : "Kopieer lijst"}
            </button>
          )}
          <button className="knop-secundair" disabled={bezig} onClick={genereer}>
            {codes.length > 0 ? "Opnieuw genereren" : "Codes genereren"}
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-zand-500">{uitleg}</p>

      {fout && <div className="mt-3"><Melding soort="fout">{fout}</Melding></div>}

      {codes.length === 0 ? (
        <p className="mt-3 text-sm text-zand-500">Nog geen codes. Voeg eerst leerlingen toe.</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {codes.slice(0, 60).map((c) => (
            <div key={c.code} className="flex items-center justify-between rounded-lg border border-zand-200 px-3 py-2">
              <span className="text-sm text-zand-500">{c.klas ?? "Hele school"}</span>
              <span className="font-mono text-lg font-semibold tracking-wider">{c.code}</span>
            </div>
          ))}
          {codes.length > 60 && (
            <p className="text-sm text-zand-500">En nog {codes.length - 60} codes. Gebruik Kopieer lijst.</p>
          )}
        </div>
      )}

      {schoolcode && (
        <p className="mt-3 text-sm text-zand-500">
          Code voor het schoolportaal: <span className="font-mono font-semibold">{schoolcode}</span>
        </p>
      )}
    </Kaart>
  );
}
