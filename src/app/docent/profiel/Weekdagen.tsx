"use client";

import { useState, useTransition } from "react";
import { weekdagBeschikbaarheid } from "@/lib/docent-acties";

const DAGEN = [
  { n: 1, k: "ma" }, { n: 2, k: "di" }, { n: 3, k: "wo" }, { n: 4, k: "do" },
  { n: 5, k: "vr" }, { n: 6, k: "za" }, { n: 7, k: "zo" },
];

export default function Weekdagen({ actief }: { actief: number[] }) {
  const [aan, setAan] = useState<number[]>(actief);
  const [bezig, start] = useTransition();

  function wissel(n: number) {
    const nu = aan.includes(n);
    setAan(nu ? aan.filter((x) => x !== n) : [...aan, n]);
    start(async () => {
      await weekdagBeschikbaarheid(n, !nu);
    });
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {DAGEN.map((d) => {
        const a = aan.includes(d.n);
        return (
          <button
            key={d.n}
            type="button"
            disabled={bezig}
            onClick={() => wissel(d.n)}
            className={`h-11 w-11 rounded-full border text-sm font-medium uppercase transition ${
              a ? "border-skool-400 bg-skool-500 text-white" : "border-zand-300 text-zand-600 hover:bg-zand-100"
            }`}
          >
            {d.k}
          </button>
        );
      })}
    </div>
  );
}
