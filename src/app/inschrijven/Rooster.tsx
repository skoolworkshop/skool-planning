"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { leerlingAfmelden } from "@/lib/inschrijving-acties";
import type { Data } from "./Kiezen";

export default function Rooster({ data }: { data: Data }) {
  const router = useRouter();
  const [, start] = useTransition();

  return (
    <div>
      <div className="rounded-xl border border-skool-200 bg-skool-50 p-4">
        <div className="text-lg font-bold">Je bent ingeschreven</div>
        <p className="mt-1 text-sm text-neutral-600">
          Dit is jouw persoonlijke rooster. Maak een schermafbeelding of download hem.
        </p>
      </div>

      <div className="mt-4">
        <h1 className="text-xl font-bold">{data.titel}</h1>
        <p className="text-sm text-neutral-500">{data.naam} · {data.klas}</p>
      </div>

      <div className="mt-4 space-y-3">
        {data.rondes.map((r) => {
          const slot = r.slots.find((s) => s.id === r.gekozenSlotId);
          return (
            <div key={r.id} className="kaart p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm font-medium text-neutral-500">
                  {r.startTijd} tot {r.eindTijd}
                </div>
                <div className="text-xs text-neutral-400">Ronde {r.nummer}</div>
              </div>
              <div className="mt-1 text-lg font-semibold">{slot?.workshop ?? "Nog niet gekozen"}</div>
              {slot?.ruimte && <div className="text-sm text-neutral-500">{slot.ruimte}</div>}
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-2">
        <a className="knop-primair block w-full text-center" href="/inschrijven/rooster">
          Download mijn rooster
        </a>
        {data.wijzigenToegestaan && (
          <button
            className="knop-secundair w-full"
            onClick={() => { window.location.href = "/inschrijven?wijzig=1"; }}
          >
            Ik wil nog wisselen
          </button>
        )}
        <button
          className="knop-ghost w-full"
          onClick={() => start(async () => { await leerlingAfmelden(); router.refresh(); })}
        >
          Klaar, afsluiten
        </button>
      </div>
    </div>
  );
}
