"use client";

import { useState, useTransition } from "react";
import { inschrijvingStatus } from "@/lib/inschrijving-acties";
import { restVerdelen } from "@/lib/inschrijving-acties";
import { Kaart, Melding } from "@/components/ui";

export default function StatusKnoppen({ id, status }: { id: string; status: string }) {
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function zet(nieuw: "CONCEPT" | "OPEN" | "GESLOTEN" | "DEFINITIEF") {
    setFout(null); setOk(null);
    start(async () => {
      const r = await inschrijvingStatus(id, nieuw);
      if (r?.fout) setFout(r.fout);
    });
  }

  function verdeel() {
    setFout(null); setOk(null);
    start(async () => {
      const r = await restVerdelen(id);
      if (r?.fout) setFout(r.fout);
      else setOk(`${r.geplaatst ?? 0} leerlingen ingedeeld.${r.problemen?.length ? " " + r.problemen.join(" ") : ""}`);
    });
  }

  return (
    <Kaart>
      <h2 className="font-semibold">Status</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {status === "CONCEPT" && (
          <button className="knop-primair" disabled={bezig} onClick={() => zet("OPEN")}>
            Inschrijving openzetten
          </button>
        )}
        {status === "OPEN" && (
          <>
            <button className="knop-secundair" disabled={bezig} onClick={() => zet("GESLOTEN")}>
              Inschrijving sluiten
            </button>
            <button className="knop-secundair" disabled={bezig} onClick={verdeel}>
              Rest automatisch indelen
            </button>
          </>
        )}
        {status === "GESLOTEN" && (
          <>
            <button className="knop-secundair" disabled={bezig} onClick={() => zet("OPEN")}>
              Weer openzetten
            </button>
            <button className="knop-secundair" disabled={bezig} onClick={verdeel}>
              Rest automatisch indelen
            </button>
            <button className="knop-primair" disabled={bezig} onClick={() => zet("DEFINITIEF")}>
              Indeling vastzetten
            </button>
          </>
        )}
        {status === "DEFINITIEF" && (
          <button className="knop-secundair" disabled={bezig} onClick={() => zet("GESLOTEN")}>
            Weer openbreken
          </button>
        )}
      </div>
      {fout && <div className="mt-3"><Melding soort="fout">{fout}</Melding></div>}
      {ok && <div className="mt-3"><Melding soort="ok">{ok}</Melding></div>}
    </Kaart>
  );
}
