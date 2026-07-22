"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registreren } from "./actions";
import { Kaart, Melding } from "@/components/ui";

export default function Formulier() {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);

  function versturen(fd: FormData) {
    setFout(null);
    start(async () => {
      const r = await registreren(fd);
      if (r?.fout) setFout(r.fout);
      else router.push("/docent/profiel");
    });
  }

  return (
    <Kaart>
      <form action={versturen} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="voornaam">Voornaam</label>
            <input id="voornaam" name="voornaam" className="veld" required autoComplete="given-name" />
          </div>
          <div>
            <label className="label" htmlFor="achternaam">Achternaam</label>
            <input id="achternaam" name="achternaam" className="veld" required autoComplete="family-name" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="email">E-mailadres</label>
          <input id="email" name="email" type="email" className="veld" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="telefoon">Mobiel nummer</label>
          <input id="telefoon" name="telefoon" type="tel" className="veld" autoComplete="tel" />
        </div>
        <div>
          <label className="label" htmlFor="wachtwoord">Wachtwoord</label>
          <input id="wachtwoord" name="wachtwoord" type="password" className="veld" required minLength={10} autoComplete="new-password" />
          <p className="mt-1 text-xs text-neutral-500">Minimaal 10 tekens.</p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="akkoord" className="mt-0.5 h-4 w-4 accent-skool-500" />
          <span>Ik ga akkoord met de privacyverklaring en het verwerken van mijn gegevens voor planning en uitbetaling.</span>
        </label>
        {fout && <Melding soort="fout">{fout}</Melding>}
        <button className="knop-primair w-full" disabled={bezig}>
          {bezig ? "Bezig" : "Account aanmaken"}
        </button>
      </form>
    </Kaart>
  );
}
