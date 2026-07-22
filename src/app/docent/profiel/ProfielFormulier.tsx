"use client";

import { useState, useTransition } from "react";
import { profielOpslaan } from "@/lib/docent-acties";
import { Kaart, Melding } from "@/components/ui";

type Profiel = {
  voornaam: string; tussenvoegsel: string; achternaam: string; telefoon: string;
  geboortedatum: string; bio: string; noodcontact: string; noodcontactTel: string;
  straat: string; huisnummer: string; postcode: string; plaats: string;
  samenwerking: string; kvk: string; btwNummer: string; iban: string; rekeninghouder: string;
  uurtarief: string; minDagtarief: string; kmVergoeding: string; maxReisAfstand: string;
  eigenVervoer: boolean; rijbewijs: boolean; ovMogelijk: boolean;
  talen: string; doelgroepen: string[];
};

const DOELGROEPEN = ["Onderbouw PO", "Bovenbouw PO", "VO", "MBO", "HBO", "BSO", "Volwassenen", "Speciaal onderwijs"];

export default function ProfielFormulier({ profiel }: { profiel: Profiel }) {
  const [bezig, start] = useTransition();
  const [melding, setMelding] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  function opslaan(fd: FormData) {
    setMelding(null);
    setFout(null);
    start(async () => {
      const r = await profielOpslaan(fd);
      if (r?.fout) setFout(r.fout);
      else setMelding("Je gegevens zijn opgeslagen.");
    });
  }

  return (
    <form action={opslaan} className="space-y-5">
      <Kaart>
        <h2 className="font-semibold">Persoonlijke gegevens</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Veld naam="voornaam" titel="Voornaam" waarde={profiel.voornaam} verplicht />
          <Veld naam="tussenvoegsel" titel="Tussenvoegsel" waarde={profiel.tussenvoegsel} />
          <Veld naam="achternaam" titel="Achternaam" waarde={profiel.achternaam} verplicht />
          <Veld naam="telefoon" titel="Mobiel nummer" waarde={profiel.telefoon} type="tel" verplicht />
          <Veld naam="geboortedatum" titel="Geboortedatum" waarde={profiel.geboortedatum} type="date" />
        </div>
        <div className="mt-3">
          <label className="label" htmlFor="bio">Korte introductie</label>
          <textarea id="bio" name="bio" rows={3} defaultValue={profiel.bio} className="veld" placeholder="Wat maakt jouw workshop leuk?" />
        </div>
      </Kaart>

      <Kaart>
        <h2 className="font-semibold">Adres en reizen</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Veld naam="straat" titel="Straat" waarde={profiel.straat} />
          <Veld naam="huisnummer" titel="Huisnummer" waarde={profiel.huisnummer} />
          <Veld naam="postcode" titel="Postcode" waarde={profiel.postcode} />
          <Veld naam="plaats" titel="Woonplaats" waarde={profiel.plaats} verplicht />
          <Veld naam="maxReisAfstand" titel="Maximale reisafstand in km" waarde={profiel.maxReisAfstand} type="number" />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Vink naam="eigenVervoer" titel="Eigen vervoer" aan={profiel.eigenVervoer} />
          <Vink naam="rijbewijs" titel="Rijbewijs" aan={profiel.rijbewijs} />
          <Vink naam="ovMogelijk" titel="Reis ook met OV" aan={profiel.ovMogelijk} />
        </div>
      </Kaart>

      <Kaart>
        <h2 className="font-semibold">Werken en uitbetaling</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="samenwerking">Samenwerkingsvorm</label>
            <select id="samenwerking" name="samenwerking" defaultValue={profiel.samenwerking} className="veld">
              <option value="">Kies</option>
              <option value="ZZP">ZZP met eigen KvK</option>
              <option value="FREELANCE">Freelance zonder KvK</option>
            </select>
          </div>
          <Veld naam="kvk" titel="KVK nummer" waarde={profiel.kvk} />
          <Veld naam="btwNummer" titel="Btw nummer" waarde={profiel.btwNummer} />
          <Veld naam="iban" titel="IBAN" waarde={profiel.iban} verplicht />
          <Veld naam="rekeninghouder" titel="Naam rekeninghouder" waarde={profiel.rekeninghouder} />
          <Veld naam="uurtarief" titel="Uurtarief" waarde={profiel.uurtarief} type="number" stap="0.01" />
          <Veld naam="minDagtarief" titel="Minimum per opdracht" waarde={profiel.minDagtarief} type="number" stap="0.01" />
          <Veld naam="kmVergoeding" titel="Kilometervergoeding" waarde={profiel.kmVergoeding} type="number" stap="0.01" />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Je bankgegevens zijn alleen zichtbaar voor jou en de financiële administratie.
        </p>
      </Kaart>

      <Kaart>
        <h2 className="font-semibold">Doelgroepen en talen</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DOELGROEPEN.map((d) => (
            <label key={d} className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-sm has-[:checked]:border-skool-400 has-[:checked]:bg-skool-50">
              <input type="checkbox" name="doelgroepen" value={d} defaultChecked={profiel.doelgroepen.includes(d)} className="accent-skool-500" />
              {d}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <Veld naam="talen" titel="Talen, gescheiden door komma" waarde={profiel.talen} />
        </div>
      </Kaart>

      <Kaart>
        <h2 className="font-semibold">Noodcontact</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Veld naam="noodcontact" titel="Naam" waarde={profiel.noodcontact} />
          <Veld naam="noodcontactTel" titel="Telefoon" waarde={profiel.noodcontactTel} type="tel" />
        </div>
      </Kaart>

      {fout && <Melding soort="fout">{fout}</Melding>}
      {melding && <Melding soort="ok">{melding}</Melding>}

      <button className="knop-primair w-full" disabled={bezig}>
        {bezig ? "Bezig met opslaan" : "Gegevens opslaan"}
      </button>
    </form>
  );
}

function Veld({
  naam, titel, waarde, type = "text", stap, verplicht,
}: { naam: string; titel: string; waarde: string; type?: string; stap?: string; verplicht?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={naam}>
        {titel} {verplicht && <span className="text-skool-600">*</span>}
      </label>
      <input id={naam} name={naam} type={type} step={stap} defaultValue={waarde} className="veld" />
    </div>
  );
}

function Vink({ naam, titel, aan }: { naam: string; titel: string; aan: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" name={naam} defaultChecked={aan} className="h-4 w-4 accent-skool-500" />
      {titel}
    </label>
  );
}
