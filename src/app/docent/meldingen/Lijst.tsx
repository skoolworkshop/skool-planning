"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { meldingGelezen } from "@/lib/docent-acties";
import { datumTijd } from "@/lib/format";

type Item = { id: string; titel: string; tekst: string; link: string | null; gelezen: boolean; wanneer: string };

export default function Lijst({ items }: { items: Item[] }) {
  const [gelezen, setGelezen] = useState<string[]>([]);
  const [, start] = useTransition();

  function markeer(id: string) {
    setGelezen((g) => [...g, id]);
    start(async () => {
      await meldingGelezen(id);
    });
  }

  return (
    <div className="space-y-2">
      {items.map((m) => {
        const isGelezen = m.gelezen || gelezen.includes(m.id);
        const inhoud = (
          <div
            className={`kaart p-4 transition ${isGelezen ? "" : "border-skool-200 bg-skool-50/40"}`}
            onClick={() => !isGelezen && markeer(m.id)}
          >
            <div className="flex items-start gap-2">
              {!isGelezen && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-skool-500" />}
              <div className="min-w-0">
                <div className="font-semibold">{m.titel}</div>
                <p className="mt-0.5 text-sm text-zand-600">{m.tekst}</p>
                <div className="mt-1 text-xs text-zand-400">{datumTijd(m.wanneer)}</div>
              </div>
            </div>
          </div>
        );
        return m.link ? (
          <Link key={m.id} href={m.link} className="block">{inhoud}</Link>
        ) : (
          <div key={m.id}>{inhoud}</div>
        );
      })}
    </div>
  );
}
