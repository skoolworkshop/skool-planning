"use client";

import { useState, useTransition } from "react";
import { sessieAnnuleren } from "@/lib/planning-acties";

export default function SessieActies({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [reden, setReden] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  return (
    <div className="kaart p-4">
      <h2 className="mb-2 font-semibold">Opdracht annuleren</h2>
      {!open ? (
        <button className="knop-gevaar w-full" onClick={() => setOpen(true)}>Annuleren</button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-zand-600">
            Alle toegewezen docenten krijgen automatisch bericht. Dit kun je niet ongedaan maken.
          </p>
          <input value={reden} onChange={(e) => setReden(e.target.value)} className="veld" placeholder="Reden van annulering" />
          {fout && <p className="text-sm text-red-700">{fout}</p>}
          <div className="flex gap-2">
            <button className="knop-gevaar flex-1" disabled={bezig}
              onClick={() => {
                if (reden.trim().length < 3) return setFout("Geef een korte reden op.");
                start(async () => {
                  const res = await sessieAnnuleren(sessionId, reden);
                  if (res?.fout) setFout(res.fout);
                  else setOpen(false);
                });
              }}>
              Definitief annuleren
            </button>
            <button className="knop-secundair" onClick={() => setOpen(false)}>Terug</button>
          </div>
        </div>
      )}
    </div>
  );
}
