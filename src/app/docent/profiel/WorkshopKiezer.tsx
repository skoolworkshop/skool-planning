"use client";

import { useState, useTransition } from "react";
import { workshopKoppelen } from "@/lib/docent-acties";

type W = { id: string; naam: string; categorie: string };

export default function WorkshopKiezer({ workshops, gekozen }: { workshops: W[]; gekozen: string[] }) {
  const [aan, setAan] = useState<string[]>(gekozen);
  const [bezig, start] = useTransition();
  const [zoek, setZoek] = useState("");

  function wissel(id: string) {
    const stondAan = aan.includes(id);
    setAan(stondAan ? aan.filter((x) => x !== id) : [...aan, id]);
    start(async () => {
      await workshopKoppelen(id, !stondAan);
    });
  }

  const zichtbaar = workshops.filter((w) =>
    (w.naam + " " + w.categorie).toLowerCase().includes(zoek.toLowerCase())
  );
  const categorieen = Array.from(new Set(zichtbaar.map((w) => w.categorie)));

  return (
    <div className="mt-3">
      <input
        className="veld"
        placeholder="Zoek een workshop"
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
      />
      <div className="mt-3 space-y-4">
        {categorieen.map((c) => (
          <div key={c}>
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{c}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {zichtbaar
                .filter((w) => w.categorie === c)
                .map((w) => {
                  const actief = aan.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      disabled={bezig}
                      onClick={() => wissel(w.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        actief
                          ? "border-skool-400 bg-skool-50 font-medium text-skool-800"
                          : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {actief ? "✓ " : "+ "}
                      {w.naam}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
        {zichtbaar.length === 0 && <p className="text-sm text-neutral-400">Geen workshops gevonden.</p>}
      </div>
      <p className="mt-3 text-xs text-neutral-500">{aan.length} workshops gekozen.</p>
    </div>
  );
}
