"use client";

import { useState, useTransition } from "react";
import { docentStatus } from "@/lib/planning-acties";

export default function Acties({ teacherId, status }: { teacherId: string; status: string }) {
  const [reden, setReden] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  function zet(nieuw: Parameters<typeof docentStatus>[1]) {
    if ((nieuw === "AANVULLING_NODIG" || nieuw === "AFGEWEZEN") && reden.trim().length < 3) {
      setFout("Geef kort aan wat er nog nodig is.");
      return;
    }
    setFout(null);
    start(async () => {
      const res = await docentStatus(teacherId, nieuw, reden || undefined);
      if (res?.fout) setFout(res.fout);
      else setReden("");
    });
  }

  return (
    <div className="kaart flex flex-wrap items-center gap-2 p-4">
      {status !== "GOEDGEKEURD" && (
        <button onClick={() => zet("GOEDGEKEURD")} className="knop-primair" disabled={bezig}>Profiel goedkeuren</button>
      )}
      <button onClick={() => zet("AANVULLING_NODIG")} className="knop-secundair" disabled={bezig}>Aanvulling nodig</button>
      <button onClick={() => zet("INACTIEF")} className="knop-secundair" disabled={bezig}>Op inactief zetten</button>
      <button onClick={() => zet("AFGEWEZEN")} className="knop-gevaar" disabled={bezig}>Afwijzen</button>
      <input
        value={reden}
        onChange={(e) => setReden(e.target.value)}
        placeholder="Reden of interne notitie"
        className="veld w-full sm:w-72"
        aria-label="Reden"
      />
      {fout && <p className="w-full text-sm text-red-700">{fout}</p>}
    </div>
  );
}
