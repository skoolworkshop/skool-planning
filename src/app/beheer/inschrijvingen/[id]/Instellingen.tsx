"use client";

import { useState, useTransition } from "react";
import { inschrijvingOpslaan } from "@/lib/inschrijving-acties";
import { Kaart, Melding } from "@/components/ui";

type W = {
  id: string; titel: string; modus: string; codeScope: string;
  keuzesPerRonde: number; voorkeurenAantal: number;
  herhalingToegestaan: boolean; wijzigenToegestaan: boolean; toonVrijePlekken: boolean;
  welkomtekst: string; sluitingsdatum: string;
};

export default function Instellingen({ waarden }: { waarden: W }) {
  const [open, setOpen] = useState(false);
  const [bezig, start] = useTransition();
  const [ok, setOk] = useState(false);

  function opslaan(fd: FormData) {
    setOk(false);
    start(async () => {
      await inschrijvingOpslaan(fd);
      setOk(true);
    });
  }

  return (
    <Kaart>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Regels en instellingen</h2>
        <button className="knop-secundair" onClick={() => setOpen(!open)}>{open ? "Inklappen" : "Aanpassen"}</button>
      </div>

      {open && (
        <form action={opslaan} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={waarden.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="titel">Titel</label>
              <input id="titel" name="titel" className="veld" defaultValue={waarden.titel} />
            </div>
            <div>
              <label className="label" htmlFor="modus">Manier van kiezen</label>
              <select id="modus" name="modus" className="veld" defaultValue={waarden.modus}>
                <option value="DIRECTE_KEUZE">Direct kiezen</option>
                <option value="VOORKEUREN">Voorkeuren opgeven</option>
                <option value="KLASSIKAAL">Klassikaal rouleren</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="codeScope">Toegangscodes</label>
              <select id="codeScope" name="codeScope" className="veld" defaultValue={waarden.codeScope}>
                <option value="EVENEMENT">Eén voor de school</option>
                <option value="KLAS">Per klas</option>
                <option value="LEERLING">Per leerling</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sluitingsdatum">Sluitingsdatum</label>
              <input id="sluitingsdatum" name="sluitingsdatum" type="date" className="veld" defaultValue={waarden.sluitingsdatum} />
            </div>
            <div>
              <label className="label" htmlFor="keuzesPerRonde">Keuzes per ronde</label>
              <input id="keuzesPerRonde" name="keuzesPerRonde" type="number" min={1} className="veld" defaultValue={waarden.keuzesPerRonde} />
            </div>
            <div>
              <label className="label" htmlFor="voorkeurenAantal">Aantal voorkeuren</label>
              <input id="voorkeurenAantal" name="voorkeurenAantal" type="number" min={1} className="veld" defaultValue={waarden.voorkeurenAantal} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="welkomtekst">Welkomtekst voor leerlingen</label>
            <textarea id="welkomtekst" name="welkomtekst" rows={2} className="veld" defaultValue={waarden.welkomtekst} placeholder="Kies per ronde één workshop. Vol is vol." />
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="herhalingToegestaan" defaultChecked={waarden.herhalingToegestaan} className="h-4 w-4 accent-skool-500" />
              Zelfde workshop mag twee keer
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="wijzigenToegestaan" defaultChecked={waarden.wijzigenToegestaan} className="h-4 w-4 accent-skool-500" />
              Leerling mag wijzigen tot sluiting
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="toonVrijePlekken" defaultChecked={waarden.toonVrijePlekken} className="h-4 w-4 accent-skool-500" />
              Toon vrije plekken
            </label>
          </div>

          {ok && <Melding soort="ok">Opgeslagen.</Melding>}
          <button className="knop-primair" disabled={bezig}>{bezig ? "Bezig" : "Opslaan"}</button>
        </form>
      )}
    </Kaart>
  );
}
