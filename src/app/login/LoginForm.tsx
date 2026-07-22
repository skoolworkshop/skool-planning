"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { inloggen, wachtwoordVergeten, type LoginState } from "./actions";

function Verzenden({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="knop-primair w-full" disabled={pending}>
      {pending ? "Bezig..." : label}
    </button>
  );
}

export default function LoginForm() {
  const [vergeten, setVergeten] = useState(false);
  const [state, actie] = useFormState<LoginState, FormData>(inloggen, {});
  const [resetState, resetActie] = useFormState<LoginState, FormData>(wachtwoordVergeten, {});

  if (vergeten) {
    return (
      <form action={resetActie} className="kaart space-y-4 p-5">
        <h1 className="text-lg font-bold">Wachtwoord vergeten</h1>
        <p className="text-sm text-neutral-500">Vul je e-mailadres in. Je krijgt een link om een nieuw wachtwoord in te stellen.</p>
        <div>
          <label className="label" htmlFor="r-email">E-mailadres</label>
          <input id="r-email" name="email" type="email" required autoComplete="email" className="veld" />
        </div>
        {resetState.fout && <p className="text-sm text-neutral-700">{resetState.fout}</p>}
        <Verzenden label="Stuur mij een link" />
        <button type="button" onClick={() => setVergeten(false)} className="knop-ghost w-full">
          Terug naar inloggen
        </button>
      </form>
    );
  }

  return (
    <form action={actie} className="kaart space-y-4 p-5">
      <h1 className="text-lg font-bold">Inloggen</h1>
      <div>
        <label className="label" htmlFor="email">E-mailadres</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="veld" />
      </div>
      <div>
        <label className="label" htmlFor="wachtwoord">Wachtwoord</label>
        <input id="wachtwoord" name="wachtwoord" type="password" required autoComplete="current-password" className="veld" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="onthoud" className="h-4 w-4 rounded border-neutral-300" />
        Onthoud mij op dit apparaat
      </label>
      {state.fout && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.fout}</p>}
      <Verzenden label="Inloggen" />
      <button type="button" onClick={() => setVergeten(true)} className="knop-ghost w-full">
        Wachtwoord vergeten
      </button>
    </form>
  );
}
