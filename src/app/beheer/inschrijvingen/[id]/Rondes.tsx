"use client";

import { useState, useTransition } from "react";
import { rondeToevoegen, rondeVerwijderen, slotToevoegen, slotVerwijderen } from "@/lib/inschrijving-acties";
import { Kaart, Melding } from "@/components/ui";

type Slot = { id: string; workshop: string; ruimte: string | null; capaciteit: number; bezet: number; docent: string | null };
type Ronde = { id: string; nummer: number; naam: string | null; startTijd: string; eindTijd: string; slots: Slot[] };
type W = { id: string; naam: string; categorie: string; max: number };
type D = { id: string; naam: string };

export default function Rondes({
  enrollmentId, rondes, workshops, docenten,
}: { enrollmentId: string; rondes: Ronde[]; workshops: W[]; docenten: D[] }) {
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);
  const [nieuweRonde, setNieuweRonde] = useState(false);
  const [openSlot, setOpenSlot] = useState<string | null>(null);

  function ronde(fd: FormData) {
    setFout(null);
    start(async () => {
      await rondeToevoegen(
        enrollmentId,
        String(fd.get("startTijd")),
        String(fd.get("eindTijd")),
        String(fd.get("naam") ?? "")
      );
      setNieuweRonde(false);
    });
  }

  function slot(fd: FormData) {
    setFout(null);
    start(async () => {
      const r = await slotToevoegen(fd);
      if (r?.fout) setFout(r.fout);
      else setOpenSlot(null);
    });
  }

  return (
    <Kaart>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Rondes en workshops</h2>
        <button className="knop-secundair" onClick={() => setNieuweRonde(!nieuweRonde)}>
          {nieuweRonde ? "Annuleren" : "Ronde toevoegen"}
        </button>
      </div>

      {nieuweRonde && (
        <form action={ronde} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-neutral-50 p-3">
          <div>
            <label className="label" htmlFor="startTijd">Van</label>
            <input id="startTijd" name="startTijd" type="time" className="veld" defaultValue="09:00" required />
          </div>
          <div>
            <label className="label" htmlFor="eindTijd">Tot</label>
            <input id="eindTijd" name="eindTijd" type="time" className="veld" defaultValue="10:15" required />
          </div>
          <div>
            <label className="label" htmlFor="naam">Naam, mag leeg</label>
            <input id="naam" name="naam" className="veld" placeholder="Ochtendronde" />
          </div>
          <button className="knop-primair" disabled={bezig}>Toevoegen</button>
        </form>
      )}

      {fout && <div className="mt-3"><Melding soort="fout">{fout}</Melding></div>}

      <div className="mt-4 space-y-4">
        {rondes.length === 0 && (
          <p className="text-sm text-neutral-500">
            Nog geen rondes. Een cultuurdag heeft er meestal drie van 75 minuten.
          </p>
        )}

        {rondes.map((r) => (
          <div key={r.id} className="rounded-xl border border-neutral-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold">Ronde {r.nummer}</span>
                {r.naam && <span className="text-neutral-500"> · {r.naam}</span>}
                <span className="text-neutral-500"> · {r.startTijd} tot {r.eindTijd}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="knop-secundair"
                  onClick={() => setOpenSlot(openSlot === r.id ? null : r.id)}
                >
                  Workshop
                </button>
                {r.slots.length === 0 && (
                  <button
                    className="knop-gevaar"
                    disabled={bezig}
                    onClick={() => start(async () => { await rondeVerwijderen(r.id, enrollmentId); })}
                  >
                    Weg
                  </button>
                )}
              </div>
            </div>

            {openSlot === r.id && (
              <form action={slot} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-neutral-50 p-3">
                <input type="hidden" name="roundId" value={r.id} />
                <input type="hidden" name="enrollmentId" value={enrollmentId} />
                <div className="min-w-48">
                  <label className="label" htmlFor={`w${r.id}`}>Workshop</label>
                  <select id={`w${r.id}`} name="workshopId" className="veld" required>
                    <option value="">Kies</option>
                    {workshops.map((w) => (
                      <option key={w.id} value={w.id}>{w.naam} ({w.categorie})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="label" htmlFor={`r${r.id}`}>Ruimte</label>
                  <input id={`r${r.id}`} name="ruimte" className="veld" placeholder="Gymzaal" />
                </div>
                <div className="w-24">
                  <label className="label" htmlFor={`c${r.id}`}>Plekken</label>
                  <input id={`c${r.id}`} name="capaciteit" type="number" min={1} defaultValue={25} className="veld" />
                </div>
                <div className="min-w-40">
                  <label className="label" htmlFor={`d${r.id}`}>Docent</label>
                  <select id={`d${r.id}`} name="teacherId" className="veld">
                    <option value="">Later invullen</option>
                    {docenten.map((d) => <option key={d.id} value={d.id}>{d.naam}</option>)}
                  </select>
                </div>
                <button className="knop-primair" disabled={bezig}>Toevoegen</button>
              </form>
            )}

            <div className="mt-3 space-y-2">
              {r.slots.length === 0 && <p className="text-sm text-neutral-400">Nog geen workshops in deze ronde.</p>}
              {r.slots.map((s) => {
                const vol = s.bezet >= s.capaciteit;
                const pct = s.capaciteit > 0 ? Math.round((s.bezet / s.capaciteit) * 100) : 0;
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{s.workshop}</div>
                      <div className="text-neutral-500">
                        {s.ruimte ?? "ruimte nog niet bekend"}
                        {s.docent ? ` · ${s.docent}` : " · nog geen docent"}
                      </div>
                    </div>
                    <div className="w-32">
                      <div className={`text-right text-xs ${vol ? "font-semibold text-skool-700" : "text-neutral-500"}`}>
                        {s.bezet} van {s.capaciteit}
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div className={`h-full rounded-full ${vol ? "bg-skool-600" : "bg-skool-400"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                    <button
                      className="knop-ghost"
                      disabled={bezig}
                      onClick={() => start(async () => {
                        const res = await slotVerwijderen(s.id, enrollmentId);
                        if (res?.fout) setFout(res.fout);
                      })}
                    >
                      Weg
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Kaart>
  );
}
