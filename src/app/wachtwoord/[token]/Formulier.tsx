"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { wachtwoordInstellen } from "@/app/login/actions";

export default function Formulier({ token }: { token: string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [klaar, setKlaar] = useState(false);
  const [bezig, start] = useTransition();
  const router = useRouter();

  function verzend(e: React.FormEvent) {
    e.preventDefault();
    setFout(null);
    if (pw !== pw2) return setFout("De twee wachtwoorden zijn niet gelijk.");
    start(async () => {
      const res = await wachtwoordInstellen(token, pw);
      if ("fout" in res && res.fout) setFout(res.fout);
      else {
        setKlaar(true);
        setTimeout(() => router.push("/login"), 1500);
      }
    });
  }

  if (klaar) {
    return (
      <div className="kaart p-5 text-center">
        <p className="font-semibold">Gelukt</p>
        <p className="mt-1 text-sm text-zand-500">Je wachtwoord staat klaar. We sturen je door naar het inlogscherm.</p>
      </div>
    );
  }

  return (
    <form onSubmit={verzend} className="kaart space-y-4 p-5">
      <h1 className="text-lg font-bold">Wachtwoord instellen</h1>
      <p className="text-sm text-zand-500">Kies een wachtwoord van minimaal 10 tekens.</p>
      <div>
        <label className="label" htmlFor="pw">Nieuw wachtwoord</label>
        <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={10} className="veld" autoComplete="new-password" />
      </div>
      <div>
        <label className="label" htmlFor="pw2">Herhaal wachtwoord</label>
        <input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={10} className="veld" autoComplete="new-password" />
      </div>
      {fout && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}
      <button className="knop-primair w-full" disabled={bezig}>{bezig ? "Bezig..." : "Opslaan"}</button>
    </form>
  );
}
