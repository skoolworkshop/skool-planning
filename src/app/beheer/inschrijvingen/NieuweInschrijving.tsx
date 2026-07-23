"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inschrijvingAanmaken } from "@/lib/inschrijving-acties";
import { Kaart, Melding } from "@/components/ui";

type P = { id: string; naam: string; klant: string };

export default function NieuweInschrijving({ projecten }: { projecten: P[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);

  function versturen(fd: FormData) {
    setFout(null);
    start(async () => {
      const r = await inschrijvingAanmaken(fd);
      if (r?.fout) setFout(r.fout);
      else if (r?.id) router.push(`/beheer/inschrijvingen/${r.id}`);
    });
  }

  if (!open) {
    return (
      <button className="knop-primair" onClick={() => setOpen(true)}>
        Nieuwe inschrijving opzetten
      </button>
    );
  }

  return (
    <Kaart>
      <form action={versturen} className="space-y-3">
        <h2 className="font-semibold">Nieuwe inschrijving</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="projectId">Project</label>
            <select id="projectId" name="projectId" className="veld" required>
              <option value="">Kies een project</option>
              {projecten.map((p) => (
                <option key={p.id} value={p.id}>{p.naam} · {p.klant}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="titel">Titel voor de leerlingen</label>
            <input id="titel" name="titel" className="veld" placeholder="Cultuurdag 2026" />
          </div>
          <div>
            <label className="label" htmlFor="modus">Hoe kiezen leerlingen</label>
            <select id="modus" name="modus" className="veld" defaultValue="DIRECTE_KEUZE">
              <option value="DIRECTE_KEUZE">Direct kiezen, wie het eerst komt</option>
              <option value="VOORKEUREN">Voorkeuren opgeven, systeem verdeelt</option>
              <option value="KLASSIKAAL">Klassikaal, hele klassen rouleren</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="codeScope">Toegangscodes</label>
            <select id="codeScope" name="codeScope" className="veld" defaultValue="KLAS">
              <option value="EVENEMENT">Eén code voor de hele school</option>
              <option value="KLAS">Eén code per klas</option>
              <option value="LEERLING">Unieke code per leerling</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sluitingsdatum">Sluitingsdatum</label>
            <input id="sluitingsdatum" name="sluitingsdatum" type="date" className="veld" />
          </div>
        </div>
        {fout && <Melding soort="fout">{fout}</Melding>}
        <div className="flex gap-2">
          <button className="knop-primair" disabled={bezig}>{bezig ? "Bezig" : "Aanmaken"}</button>
          <button type="button" className="knop-secundair" onClick={() => setOpen(false)}>Annuleren</button>
        </div>
      </form>
    </Kaart>
  );
}
