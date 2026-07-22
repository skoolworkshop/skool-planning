"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { keuzeVastleggen, leerlingAfmelden } from "@/lib/inschrijving-acties";

type Slot = {
  id: string; workshop: string; categorie: string; omschrijving: string;
  ruimte: string | null; capaciteit: number; vrij: number;
};
type Ronde = {
  id: string; nummer: number; naam: string | null; startTijd: string; eindTijd: string;
  gekozenSlotId: string | null; slots: Slot[];
};
export type Data = {
  titel: string; welkomtekst: string | null; toonVrijePlekken: boolean; wijzigenToegestaan: boolean;
  naam: string; klas: string; rondes: Ronde[];
};

export default function Kiezen({ data }: { data: Data }) {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);
  const [actief, setActief] = useState<string | null>(null);

  const openRonde = data.rondes.find((r) => !r.gekozenSlotId);
  const huidige = data.rondes.find((r) => r.id === actief) ?? openRonde ?? data.rondes[0];
  const gedaan = data.rondes.filter((r) => r.gekozenSlotId).length;

  function kies(slotId: string) {
    setFout(null);
    start(async () => {
      const r = await keuzeVastleggen(slotId);
      if (r?.fout) setFout(r.fout);
      else {
        setActief(null);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{data.titel}</h1>
          <p className="text-sm text-neutral-500">{data.naam} · {data.klas}</p>
        </div>
        <button
          className="knop-ghost text-sm"
          onClick={() => start(async () => { await leerlingAfmelden(); router.refresh(); })}
        >
          Ik ben het niet
        </button>
      </div>

      {data.welkomtekst && <p className="mt-3 text-neutral-600">{data.welkomtekst}</p>}

      <div className="mt-4">
        <div className="flex justify-between text-sm text-neutral-500">
          <span>Ronde {gedaan} van {data.rondes.length} gekozen</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-skool-500 transition-all"
            style={{ width: `${data.rondes.length ? (gedaan / data.rondes.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {data.rondes.map((r) => {
          const isActief = huidige?.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setActief(r.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                isActief
                  ? "border-skool-400 bg-skool-500 font-medium text-white"
                  : r.gekozenSlotId
                  ? "border-skool-200 bg-skool-50 text-skool-800"
                  : "border-neutral-300 bg-white text-neutral-700"
              }`}
            >
              {r.gekozenSlotId ? "✓ " : ""}Ronde {r.nummer}
            </button>
          );
        })}
      </div>

      {fout && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {fout}
        </div>
      )}

      {huidige && (
        <div className="mt-4">
          <div className="text-sm text-neutral-500">
            {huidige.naam ? `${huidige.naam} · ` : ""}{huidige.startTijd} tot {huidige.eindTijd}
          </div>

          <div className="mt-3 space-y-3">
            {huidige.slots.map((s) => {
              const gekozen = huidige.gekozenSlotId === s.id;
              const vol = s.vrij <= 0 && !gekozen;
              const bijnaVol = s.vrij > 0 && s.vrij <= 3;
              const vast = Boolean(huidige.gekozenSlotId) && !data.wijzigenToegestaan;

              return (
                <button
                  key={s.id}
                  disabled={vol || bezig || vast}
                  onClick={() => kies(s.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    gekozen
                      ? "border-skool-500 bg-skool-50 ring-2 ring-skool-200"
                      : vol
                      ? "border-neutral-200 bg-neutral-100 opacity-60"
                      : "border-neutral-200 bg-white hover:border-skool-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{s.workshop}</div>
                      <div className="text-xs uppercase tracking-wide text-neutral-400">{s.categorie}</div>
                      {s.omschrijving && (
                        <p className="mt-1 text-sm text-neutral-600">{s.omschrijving}</p>
                      )}
                      {s.ruimte && <p className="mt-1 text-sm text-neutral-500">{s.ruimte}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      {gekozen ? (
                        <span className="rounded-full bg-skool-500 px-3 py-1 text-xs font-semibold text-white">
                          Gekozen
                        </span>
                      ) : vol ? (
                        <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
                          Vol
                        </span>
                      ) : data.toonVrijePlekken ? (
                        <span className={`text-sm ${bijnaVol ? "font-semibold text-skool-700" : "text-neutral-500"}`}>
                          {s.vrij} vrij
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {huidige.gekozenSlotId && data.wijzigenToegestaan && (
            <p className="mt-3 text-sm text-neutral-500">
              Je kunt je keuze nog aanpassen. Tik op een andere workshop.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
