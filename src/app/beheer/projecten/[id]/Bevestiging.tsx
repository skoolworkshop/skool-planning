"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { projectTekstOpslaan, workshopToevoegen } from "@/lib/opdracht-acties";

type Props = {
  projectId: string;
  tekst: string;
  aantalPersonenTekst: string;
  workshops: { id: string; naam: string }[];
};

export default function Bevestiging({ projectId, tekst, aantalPersonenTekst, workshops }: Props) {
  const router = useRouter();
  const [personen, setPersonen] = useState(aantalPersonenTekst);
  const [gekozen, setGekozen] = useState("");
  const [gekopieerd, setGekopieerd] = useState(false);
  const [fout, setFout] = useState("");
  const [bezig, start] = useTransition();

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2500);
    } catch {
      setFout("Kopiëren lukte niet. Selecteer de tekst en gebruik ctrl+C.");
    }
  }

  function personenOpslaan() {
    start(async () => {
      await projectTekstOpslaan(projectId, personen);
      router.refresh();
    });
  }

  function toevoegen() {
    if (!gekozen) return;
    setFout("");
    start(async () => {
      const res = await workshopToevoegen(projectId, gekozen);
      if (res.fout) return setFout(res.fout);
      setGekozen("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="label" htmlFor="personen">Aantal personen, zoals het in de mail komt</label>
          <input id="personen" value={personen} onChange={(e) => setPersonen(e.target.value)}
            placeholder="bijv. Maximaal 25 per workshop" className="veld" />
        </div>
        <div className="flex items-end">
          <button type="button" onClick={personenOpslaan} disabled={bezig} className="knop knop-secundair px-4 py-2 text-sm">Opslaan</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="label" htmlFor="ws-erbij">Nog een workshop aan deze opdracht toevoegen</label>
          <select id="ws-erbij" value={gekozen} onChange={(e) => setGekozen(e.target.value)} className="veld">
            <option value="">Kies een workshop</option>
            {workshops.map((w) => <option key={w.id} value={w.id}>{w.naam}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" onClick={toevoegen} disabled={bezig || !gekozen} className="knop knop-primair px-4 py-2 text-sm">Toevoegen</button>
        </div>
      </div>

      {fout && <p className="text-sm text-red-700">{fout}</p>}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="label mb-0">Bevestigingsmail</span>
          <button type="button" onClick={kopieren} className="knop knop-primair px-4 py-1 text-sm">
            {gekopieerd ? "Gekopieerd" : "Kopieer de tekst"}
          </button>
        </div>
        <textarea readOnly value={tekst} rows={22}
          className="veld w-full whitespace-pre font-mono text-xs leading-relaxed" />
        <p className="mt-1 text-xs text-neutral-500">
          Plak dit in HubSpot of je mailprogramma. Alles wat je hierboven aan rondes en workshops wijzigt, past de tekst direct aan.
        </p>
      </div>
    </div>
  );
}
