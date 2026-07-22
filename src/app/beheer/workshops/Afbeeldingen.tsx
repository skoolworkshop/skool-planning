"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { afbeeldingenOphalen } from "@/lib/opdracht-acties";

export default function Afbeeldingen() {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [melding, setMelding] = useState("");

  function ophalen() {
    setMelding("");
    start(async () => {
      const res = await afbeeldingenOphalen();
      const deel = res.mislukt.length > 0 ? `, niet gelukt bij ${res.mislukt.length}` : "";
      setMelding(`${res.gelukt} foto's opgehaald${deel}.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={ophalen} disabled={bezig} className="knop knop-secundair px-4 py-2 text-sm">
        {bezig ? "Bezig met ophalen" : "Foto's ophalen van de site"}
      </button>
      {melding && <span className="text-sm text-zand-500">{melding}</span>}
    </div>
  );
}
