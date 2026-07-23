"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Rij } from "@/components/ui";
import { euro } from "@/lib/format";
import { docentTariefOpslaan } from "@/lib/tarief-acties";

type Props = {
  teacherId: string;
  uurtarief: number | null;
  minDagtarief: number | null;
  kmVergoeding: number | null;
  maxReisAfstand: number | null;
  tariefVanaf: string;
  tariefNotitie: string;
  laatstDoor: string;
  laatstOp: string;
  historie: { veld: string; oud: string; nieuw: string; reden: string; wanneer: string; door: string }[];
  standaard: { uurtarief: number; minimumPerDag: number; kmTarief: number };
};

const VELD_LABEL: Record<string, string> = {
  uurtarief: "Uurtarief",
  minDagtarief: "Minimum per opdracht",
  kmVergoeding: "Kilometervergoeding",
};

export default function Tarief(p: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState("");

  if (!open) {
    return (
      <>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Tarief en vervoer</h2>
          <button type="button" onClick={() => setOpen(true)} className="knop knop-ghost px-2 py-1 text-xs">Bewerken</button>
        </div>
        <Rij label="Uurtarief">{p.uurtarief ? euro(p.uurtarief) : <span className="text-zand-400">Standaard, {euro(p.standaard.uurtarief)}</span>}</Rij>
        <Rij label="Minimum per dag">{p.minDagtarief ? euro(p.minDagtarief) : <span className="text-zand-400">Standaard, {euro(p.standaard.minimumPerDag)}</span>}</Rij>
        <Rij label="Kilometervergoeding">{p.kmVergoeding ? euro(p.kmVergoeding) : <span className="text-zand-400">Standaard, {euro(p.standaard.kmTarief)}</span>}</Rij>
        <Rij label="Maximale reisafstand">{p.maxReisAfstand ? `${p.maxReisAfstand} km` : <span className="text-zand-400">Geen grens</span>}</Rij>
        <Rij label="Tarief geldt vanaf">{p.tariefVanaf}</Rij>
        <Rij label="Interne afspraak">{p.tariefNotitie}</Rij>
        <Rij label="Laatst aangepast">{p.laatstOp ? `${p.laatstOp}${p.laatstDoor ? ` door ${p.laatstDoor}` : ""}` : ""}</Rij>

        {p.historie.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-skool-600">Tariefhistorie ({p.historie.length})</summary>
            <ul className="mt-2 space-y-1 text-xs text-zand-500">
              {p.historie.map((h, i) => (
                <li key={i}>
                  {h.wanneer} · {VELD_LABEL[h.veld] ?? h.veld}: {h.oud || "leeg"} wordt {h.nieuw || "leeg"}
                  {h.door ? ` · ${h.door}` : ""}
                  {h.reden ? ` · ${h.reden}` : ""}
                </li>
              ))}
            </ul>
          </details>
        )}
      </>
    );
  }

  return (
    <>
      <h2 className="mb-3 font-semibold">Tarief en vervoer bewerken</h2>
      <form
        className="space-y-3"
        action={(fd) => {
          setFout("");
          start(async () => {
            const res = await docentTariefOpslaan(p.teacherId, fd);
            if (res?.fout) return setFout(res.fout);
            setOpen(false);
            router.refresh();
          });
        }}
      >
        <div>
          <label className="label" htmlFor="ut">Uurtarief</label>
          <input id="ut" name="uurtarief" type="number" step="0.01" min="0" defaultValue={p.uurtarief ?? ""} placeholder={`Standaard ${p.standaard.uurtarief}`} className="veld" />
          <p className="mt-1 text-xs text-zand-500">Leeg laten betekent het standaardtarief uit de instellingen.</p>
        </div>
        <div>
          <label className="label" htmlFor="md">Minimum per dag</label>
          <input id="md" name="minDagtarief" type="number" step="0.01" min="0" defaultValue={p.minDagtarief ?? ""} placeholder={`Standaard ${p.standaard.minimumPerDag}`} className="veld" />
        </div>
        <div>
          <label className="label" htmlFor="km">Kilometervergoeding</label>
          <input id="km" name="kmVergoeding" type="number" step="0.01" min="0" defaultValue={p.kmVergoeding ?? ""} placeholder={`Standaard ${p.standaard.kmTarief}`} className="veld" />
        </div>
        <div>
          <label className="label" htmlFor="tv">Tarief geldt vanaf</label>
          <input id="tv" name="tariefVanaf" type="date" defaultValue={p.tariefVanaf} className="veld" />
        </div>
        <div>
          <label className="label" htmlFor="tn">Interne notitie over de afspraak</label>
          <textarea id="tn" name="tariefNotitie" rows={2} defaultValue={p.tariefNotitie} className="veld" placeholder="Alleen zichtbaar voor beheerders" />
        </div>
        <div>
          <label className="label" htmlFor="rd">Reden van deze wijziging</label>
          <input id="rd" name="reden" placeholder="Komt in de auditlog" className="veld" />
        </div>
        <div>
          <label className="label" htmlFor="mr">Maximale reisafstand in km</label>
          <input id="mr" name="maxReisAfstand" type="number" min="0" defaultValue={p.maxReisAfstand ?? ""} placeholder="Geen grens" className="veld" />
          <p className="mt-1 text-xs text-zand-500">Opdrachten verder weg worden niet aan deze workshopdocent getoond.</p>
        </div>

        {fout && <p className="text-sm text-red-700">{fout}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={bezig} className="knop knop-primair px-4 py-2 text-sm">{bezig ? "Bezig" : "Opslaan"}</button>
          <button type="button" onClick={() => setOpen(false)} className="knop knop-ghost px-3 py-2 text-sm">Annuleren</button>
        </div>
      </form>
    </>
  );
}
