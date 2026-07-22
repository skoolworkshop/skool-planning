"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { codeControleren } from "@/lib/inschrijving-acties";

export default function CodeFormulier() {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);
  const [code, setCode] = useState("");

  function versturen() {
    setFout(null);
    start(async () => {
      const r = await codeControleren(code);
      if (r?.fout) setFout(r.fout);
      else router.refresh();
    });
  }

  return (
    <div className="pt-8">
      <h1 className="text-2xl font-bold">Kies je workshops</h1>
      <p className="mt-2 text-neutral-600">
        Vul de code in die je van school hebt gekregen.
      </p>

      <div className="kaart mt-6 p-5">
        <label className="label" htmlFor="code">Toegangscode</label>
        <input
          id="code"
          className="veld text-center font-mono text-2xl uppercase tracking-[0.3em]"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && versturen()}
          maxLength={10}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="ABC123"
        />
        {fout && <p className="mt-3 text-sm text-red-700">{fout}</p>}
        <button className="knop-primair mt-4 w-full" disabled={bezig || code.length < 4} onClick={versturen}>
          {bezig ? "Even kijken" : "Verder"}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Code kwijt? Vraag het aan je mentor.
      </p>
    </div>
  );
}
