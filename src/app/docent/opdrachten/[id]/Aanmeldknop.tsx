"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { aanmelden } from "@/lib/docent-acties";
import { euro } from "@/lib/format";

export default function Aanmeldknop({ positionId, vergoeding }: { positionId: string; vergoeding: number }) {
  const [open, setOpen] = useState(false);
  const [motivatie, setMotivatie] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();
  const router = useRouter();

  return (
    <>
      {open && (
        <div className="kaart mt-4 space-y-3 p-4">
          <label className="label" htmlFor="mot">Korte toelichting, niet verplicht</label>
          <textarea id="mot" value={motivatie} onChange={(e) => setMotivatie(e.target.value)} rows={3} className="veld" placeholder="Bijvoorbeeld waarom deze workshop bij je past" />
          {fout && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}
        </div>
      )}

      {/* Ruimte reserveren, anders valt de balk over de laatste tekst heen */}
      <div aria-hidden className="h-20" />

      {/* Sticky primaire actie onderaan het scherm */}
      <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-zand-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2">
          {!open ? (
            <button className="knop-primair flex-1" onClick={() => setOpen(true)}>
              Aanmelden voor {euro(vergoeding)}
            </button>
          ) : (
            <>
              <button className="knop-secundair" onClick={() => setOpen(false)}>Terug</button>
              <button
                className="knop-primair flex-1"
                disabled={bezig}
                onClick={() => {
                  setFout(null);
                  start(async () => {
                    const res = await aanmelden(positionId, motivatie || undefined);
                    if (res?.fout) setFout(res.fout);
                    else router.push("/docent/mijn?tab=aanmeldingen");
                  });
                }}
              >
                {bezig ? "Bezig..." : "Definitief aanmelden"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
