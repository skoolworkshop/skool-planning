"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rondesOpslaan, workshopVerwijderen, type RondeInvoer } from "@/lib/opdracht-acties";

type Props = {
  sessionId: string;
  workshopNaam: string;
  aanwezigVanaf: string;
  afbouwTot: string;
  rondes: RondeInvoer[];
  standaardDuur: number;
};

function plusMinuten(tijd: string, minuten: number) {
  const [h, m] = tijd.split(":").map(Number);
  const t = (h * 60 + m + minuten + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export default function Rondes({ sessionId, workshopNaam, aanwezigVanaf, afbouwTot, rondes, standaardDuur }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rijen, setRijen] = useState<RondeInvoer[]>(
    rondes.length > 0 ? rondes : [{ nummer: 1, startTijd: "10:00", eindTijd: "11:00", aantalGroepen: 1, deelnemers: 0 }]
  );
  const [aankomst, setAankomst] = useState(aanwezigVanaf);
  const [afbouw, setAfbouw] = useState(afbouwTot);
  const [fout, setFout] = useState("");
  const [bezig, start] = useTransition();

  function wijzig(i: number, patch: Partial<RondeInvoer>) {
    setRijen((r) => r.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  }

  function toevoegen() {
    const laatste = rijen[rijen.length - 1];
    const start = laatste ? laatste.eindTijd : "10:00";
    setRijen([
      ...rijen,
      {
        nummer: (laatste?.nummer ?? 0) + 1,
        startTijd: start,
        eindTijd: plusMinuten(start, standaardDuur || 60),
        afdeling: laatste?.afdeling,
        aantalGroepen: laatste?.aantalGroepen ?? 1,
        deelnemers: 0,
      },
    ]);
  }

  function opslaan() {
    setFout("");
    start(async () => {
      const res = await rondesOpslaan(sessionId, rijen, { aanwezigVanaf: aankomst, afbouwTot: afbouw });
      if (res.fout) return setFout(res.fout);
      setOpen(false);
      router.refresh();
    });
  }

  function verwijderen() {
    if (!confirm(`Weet je zeker dat je ${workshopNaam} uit deze opdracht haalt?`)) return;
    start(async () => {
      const res = await workshopVerwijderen(sessionId);
      if (res.fout) return setFout(res.fout);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className="knop knop-secundair px-3 py-1 text-sm">
          Rondes bewerken
        </button>
        <button type="button" onClick={verwijderen} disabled={bezig} className="knop knop-ghost px-3 py-1 text-sm text-red-700">
          Workshop eruit
        </button>
        {fout && <span className="text-sm text-red-700">{fout}</span>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zand-200 bg-zand-100 p-3">
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`aank-${sessionId}`}>Aankomst workshopdocent</label>
          <input id={`aank-${sessionId}`} type="time" value={aankomst} onChange={(e) => setAankomst(e.target.value)} className="veld" />
        </div>
        <div>
          <label className="label" htmlFor={`afb-${sessionId}`}>Vertrek na afbouw</label>
          <input id={`afb-${sessionId}`} type="time" value={afbouw} onChange={(e) => setAfbouw(e.target.value)} className="veld" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zand-500">
              <th className="pb-1 pr-2">Ronde</th>
              <th className="pb-1 pr-2">Van</th>
              <th className="pb-1 pr-2">Tot</th>
              <th className="pb-1 pr-2">Groepen</th>
              <th className="pb-1 pr-2">Afdeling</th>
              <th className="pb-1"></th>
            </tr>
          </thead>
          <tbody>
            {rijen.map((r, i) => (
              <tr key={i} className="border-t border-zand-200">
                <td className="py-1 pr-2">
                  <input type="number" min={1} value={r.nummer} onChange={(e) => wijzig(i, { nummer: Number(e.target.value) })} className="veld w-16" />
                </td>
                <td className="py-1 pr-2">
                  <input type="time" value={r.startTijd} onChange={(e) => wijzig(i, { startTijd: e.target.value })} className="veld w-28" />
                </td>
                <td className="py-1 pr-2">
                  <input type="time" value={r.eindTijd} onChange={(e) => wijzig(i, { eindTijd: e.target.value })} className="veld w-28" />
                </td>
                <td className="py-1 pr-2">
                  <input type="number" min={1} max={20} value={r.aantalGroepen}
                    onChange={(e) => wijzig(i, { aantalGroepen: Math.max(1, Number(e.target.value)) })} className="veld w-20" />
                </td>
                <td className="py-1 pr-2">
                  <input type="text" placeholder="bijv. 4VWO" value={r.afdeling ?? ""}
                    onChange={(e) => wijzig(i, { afdeling: e.target.value })} className="veld w-28" />
                </td>
                <td className="py-1 text-right">
                  <button type="button" onClick={() => setRijen(rijen.filter((_, n) => n !== i))}
                    className="text-zand-400 hover:text-red-700" aria-label="Ronde verwijderen">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-zand-500">
        Groepen is het aantal keer dat deze workshop tegelijk draait in die ronde. Twee groepen betekent twee docenten.
        Afdeling vul je alleen in als klassen een eigen tijdschema hebben, bijvoorbeeld 4VWO en 4HAVO.
      </p>

      {fout && <p className="mt-2 text-sm text-red-700">{fout}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={toevoegen} className="knop knop-secundair px-3 py-1 text-sm">Ronde erbij</button>
        <button type="button" onClick={opslaan} disabled={bezig} className="knop knop-primair px-4 py-1 text-sm">
          {bezig ? "Bezig" : "Opslaan"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="knop knop-ghost px-3 py-1 text-sm">Annuleren</button>
      </div>
    </div>
  );
}
