"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Rij } from "@/components/ui";
import { euro } from "@/lib/format";
import { docentTariefOpslaan } from "@/lib/opdracht-acties";

type Props = {
  teacherId: string;
  uurtarief: number | null;
  minDagtarief: number | null;
  kmVergoeding: number | null;
  maxReisAfstand: number | null;
  standaard: { uurtarief: number; minimumPerDag: number; kmTarief: number };
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
