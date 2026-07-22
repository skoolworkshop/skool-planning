"use client";

import { useTransition } from "react";
import { alleMeldingenGelezen } from "@/lib/docent-acties";

export default function AllesGelezen() {
  const [bezig, start] = useTransition();
  return (
    <button
      className="knop-secundair"
      disabled={bezig}
      onClick={() => start(async () => { await alleMeldingenGelezen(); })}
    >
      Alles gelezen
    </button>
  );
}
