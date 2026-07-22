"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { beschikbaarheidZetten } from "@/lib/docent-acties";
import { Kaart } from "@/components/ui";

type Opdracht = { datum: string; titel: string; tijd: string; plaats: string; id: string; reserve: boolean };
type Mark = { datum: string; beschikbaar: boolean };

const MAANDEN = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];

export default function Maand({
  maand, opdrachten, markeringen,
}: { maand: string; opdrachten: Opdracht[]; markeringen: Mark[] }) {
  const [bezig, start] = useTransition();
  const [marks, setMarks] = useState<Mark[]>(markeringen);
  const [gekozen, setGekozen] = useState<string | null>(null);

  const [jaar, mnd] = maand.split("-").map(Number);
  const eerste = new Date(jaar, mnd - 1, 1);
  const dagenInMaand = new Date(jaar, mnd, 0).getDate();
  const startOffset = (eerste.getDay() + 6) % 7;
  const vandaag = new Date().toISOString().slice(0, 10);

  const vorige = new Date(jaar, mnd - 2, 1);
  const volgende = new Date(jaar, mnd, 1);
  const sleutel = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  function wissel(iso: string) {
    setGekozen(iso);
    const huidig = marks.find((m) => m.datum === iso);
    const heeftOpdracht = opdrachten.some((o) => o.datum === iso);
    if (heeftOpdracht) return;
    const nieuw = huidig ? !huidig.beschikbaar : false;
    setMarks([...marks.filter((m) => m.datum !== iso), { datum: iso, beschikbaar: nieuw }]);
    start(async () => {
      await beschikbaarheidZetten(iso, nieuw);
    });
  }

  const dagOpdrachten = gekozen ? opdrachten.filter((o) => o.datum === gekozen) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/docent/kalender?maand=${sleutel(vorige)}`} className="knop-secundair">Vorige</Link>
        <div className="font-semibold">{MAANDEN[mnd - 1]} {jaar}</div>
        <Link href={`/docent/kalender?maand=${sleutel(volgende)}`} className="knop-secundair">Volgende</Link>
      </div>

      <Kaart>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase text-neutral-500">
          {["ma","di","wo","do","vr","za","zo"].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`leeg${i}`} />)}
          {Array.from({ length: dagenInMaand }).map((_, i) => {
            const dag = i + 1;
            const iso = `${jaar}-${String(mnd).padStart(2, "0")}-${String(dag).padStart(2, "0")}`;
            const heeft = opdrachten.some((o) => o.datum === iso);
            const mark = marks.find((m) => m.datum === iso);
            const nietBeschikbaar = mark && !mark.beschikbaar;
            return (
              <button
                key={iso}
                type="button"
                disabled={bezig}
                onClick={() => wissel(iso)}
                className={`relative aspect-square rounded-lg border text-sm transition ${
                  heeft
                    ? "border-skool-400 bg-skool-500 font-semibold text-white"
                    : nietBeschikbaar
                    ? "border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                    : "border-neutral-200 hover:bg-neutral-50"
                } ${iso === vandaag ? "ring-2 ring-skool-300" : ""} ${gekozen === iso ? "ring-2 ring-neutral-800" : ""}`}
              >
                {dag}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500">
          <span><span className="mr-1 inline-block h-3 w-3 rounded bg-skool-500 align-middle" />Opdracht</span>
          <span><span className="mr-1 inline-block h-3 w-3 rounded bg-neutral-200 align-middle" />Niet beschikbaar</span>
        </div>
      </Kaart>

      {gekozen && (
        <Kaart>
          <div className="text-sm font-semibold">{gekozen.split("-").reverse().join("-")}</div>
          {dagOpdrachten.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-500">
              Geen opdracht op deze dag. Tik nog een keer op de dag om je beschikbaarheid te wisselen.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {dagOpdrachten.map((o) => (
                <Link key={o.id} href={`/docent/opdrachten/${o.id}`} className="block rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">
                  <div className="font-medium">{o.titel} {o.reserve && <span className="text-neutral-500">(reserve)</span>}</div>
                  <div className="text-neutral-500">{o.tijd} {o.plaats && `in ${o.plaats}`}</div>
                </Link>
              ))}
            </div>
          )}
        </Kaart>
      )}
    </div>
  );
}
