"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Kaart, Badge, statusKleur, Leeg } from "@/components/ui";
import { label } from "@/lib/format";
import { uitnodigingBeantwoorden, aanmeldingIntrekken, werkregistratieIndienen } from "@/lib/docent-acties";

type Uitnodiging = { id: string; workshop: string; klant: string; plaats: string; datum: string; tijd: string; vergoeding: string; deadline: string | null; sessionId: string };
type Aanmelding = Omit<Uitnodiging, "deadline"> & { status: string };
type Opdracht = {
  id: string; groep: string; workshop: string; klant: string; adres: string; plaats: string; datum: string; tijd: string;
  aanwezigVanaf: string | null; startTijd: string; eindTijd: string; rondes: string[]; contact: string | null; telefoon: string | null;
  deelnemers: number; doelgroep: string | null; benodigdheden: string | null; kleding: string | null; bijzonderheden: string | null;
  vergoeding: string; declaratieStatus: string | null; declaratieTotaal: string | null; sessionId: string;
};

export default function MijnLijst({
  tab, uitnodigingen, aanmeldingen, opdrachten, standaardVervoer = "AUTO",
}: { tab: string; uitnodigingen: Uitnodiging[]; aanmeldingen: Aanmelding[]; opdrachten: Opdracht[]; standaardVervoer?: string }) {
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [declaratieVoor, setDeclaratieVoor] = useState<string | null>(null);
  const [vervoer, setVervoer] = useState(standaardVervoer || "AUTO");

  function doe(fn: () => Promise<{ ok?: boolean; fout?: string } | void>) {
    setFout(null);
    start(async () => {
      const res = await fn();
      if (res && "fout" in res && res.fout) setFout(res.fout);
      else setDeclaratieVoor(null);
    });
  }

  if (tab === "uitnodigingen") {
    if (uitnodigingen.length === 0) return <Leeg titel="Geen uitnodigingen" tekst="Zodra een planner je persoonlijk uitnodigt zie je dat hier." />;
    return (
      <ul className="space-y-3">
        {fout && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}
        {uitnodigingen.map((x) => (
          <li key={x.id}>
            <Kaart>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{x.workshop}</div>
                  <div className="text-sm text-zand-600">{x.datum} · {x.tijd}</div>
                  <div className="text-sm text-zand-500">{x.klant}, {x.plaats}</div>
                </div>
                <div className="text-right font-bold text-skool-600">{x.vergoeding}</div>
              </div>
              {x.deadline && <p className="mt-2 text-xs text-amber-700">Reageer voor {x.deadline}</p>}
              <div className="mt-3 flex gap-2">
                <button className="knop-primair flex-1" disabled={bezig} onClick={() => doe(() => uitnodigingBeantwoorden(x.id, true))}>Accepteren</button>
                <button className="knop-secundair" disabled={bezig} onClick={() => doe(() => uitnodigingBeantwoorden(x.id, false))}>Kan niet</button>
                <Link href={`/docent/opdrachten/${x.sessionId}`} className="knop-ghost">Details</Link>
              </div>
            </Kaart>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "aanmeldingen") {
    if (aanmeldingen.length === 0) return <Leeg titel="Geen open aanmeldingen" tekst="Meld je aan voor een opdracht en volg hier de status." />;
    return (
      <ul className="space-y-3">
        {fout && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}
        {aanmeldingen.map((x) => (
          <li key={x.id}>
            <Kaart>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{x.workshop}</div>
                  <div className="text-sm text-zand-600">{x.datum} · {x.tijd}</div>
                  <div className="text-sm text-zand-500">{x.klant}, {x.plaats}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-skool-600">{x.vergoeding}</div>
                  <Badge kleur={statusKleur(x.status)}>{label(x.status)}</Badge>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/docent/opdrachten/${x.sessionId}`} className="knop-secundair flex-1">Bekijk opdracht</Link>
                <button className="knop-ghost text-red-700" disabled={bezig} onClick={() => doe(() => aanmeldingIntrekken(x.id))}>Intrekken</button>
              </div>
            </Kaart>
          </li>
        ))}
      </ul>
    );
  }

  const lijst = opdrachten.filter((o) => o.groep === (tab === "afgerond" ? "afgerond" : tab === "afronden" ? "afronden" : "komend"));
  if (lijst.length === 0) {
    const teksten: Record<string, [string, string]> = {
      komend: ["Nog niets ingepland", "Zodra je bent ingepland verschijnt de opdracht hier met alle details."],
      afronden: ["Niets af te ronden", "Na een opdracht geef je hier je uren en kilometers door."],
      afgerond: ["Nog niets afgerond", "Afgeronde opdrachten en declaraties vind je hier terug."],
    };
    const [t, s] = teksten[tab] ?? teksten.komend;
    return <Leeg titel={t} tekst={s} />;
  }

  return (
    <ul className="space-y-3">
      {fout && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}
      {lijst.map((o) => (
        <li key={o.id}>
          <Kaart>
            <button className="w-full text-left" onClick={() => setOpen(open === o.id ? null : o.id)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{o.workshop}</div>
                  <div className="text-sm text-zand-600">{o.datum} · {o.tijd}</div>
                  <div className="text-sm text-zand-500">{o.klant}, {o.plaats}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-skool-600">{o.vergoeding}</div>
                  {o.declaratieStatus && <Badge kleur={statusKleur(o.declaratieStatus)}>{label(o.declaratieStatus)}</Badge>}
                </div>
              </div>
            </button>

            {open === o.id && (
              <div className="mt-3 space-y-2 border-t border-zand-200 pt-3 text-sm">
                {o.aanwezigVanaf && <p><span className="text-zand-500">Aanwezig vanaf</span> {o.aanwezigVanaf}</p>}
                {o.rondes.length > 0 && <p className="text-zand-600">{o.rondes.join(" · ")}</p>}
                <p><span className="text-zand-500">Adres</span> {o.adres}</p>
                {o.contact && <p><span className="text-zand-500">Contact</span> {o.contact}</p>}
                {o.deelnemers > 0 && <p><span className="text-zand-500">Deelnemers</span> {o.deelnemers} {o.doelgroep ? `· ${o.doelgroep}` : ""}</p>}
                {o.benodigdheden && <p><span className="text-zand-500">Benodigdheden</span> {o.benodigdheden}</p>}
                {o.kleding && <p><span className="text-zand-500">Kleding</span> {o.kleding}</p>}
                {o.bijzonderheden && <p className="rounded bg-zand-100 p-2">{o.bijzonderheden}</p>}

                <div className="flex flex-wrap gap-2 pt-2">
                  {o.adres && (
                    <a className="knop-secundair" target="_blank" rel="noreferrer"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.adres)}`}>
                      Route
                    </a>
                  )}
                  {o.telefoon && <a className="knop-secundair" href={`tel:${o.telefoon.replace(/\s/g, "")}`}>Bellen</a>}
                  {o.telefoon && <a className="knop-secundair" target="_blank" rel="noreferrer" href={`https://wa.me/${o.telefoon.replace(/[^0-9]/g, "")}`}>WhatsApp</a>}
                  <a className="knop-secundair" href={`/api/ics/${o.sessionId}`}>Agenda</a>
                </div>
              </div>
            )}

            {o.groep === "afronden" && (
              <div className="mt-3 border-t border-zand-200 pt-3">
                {declaratieVoor === o.id ? (
                  <form
                    action={(fd) => doe(() => werkregistratieIndienen(o.id, fd))}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <div><label className="label">Werkelijke starttijd</label><input name="startTijd" type="time" defaultValue={o.startTijd} className="veld" /></div>
                    <div><label className="label">Werkelijke eindtijd</label><input name="eindTijd" type="time" defaultValue={o.eindTijd} className="veld" /></div>
                    <fieldset className="sm:col-span-2">
                      <legend className="label">Hoe ben je gereisd?</legend>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { waarde: "AUTO", label: "Met de auto" },
                          { waarde: "OV", label: "Openbaar vervoer" },
                          { waarde: "FIETS", label: "Op de fiets" },
                          { waarde: "ANDERS", label: "Anders" },
                        ].map((v) => (
                          <label key={v.waarde}
                            className="flex cursor-pointer items-center gap-2 rounded-full border border-zand-300 px-3 py-1.5 text-sm has-[:checked]:border-skool-400 has-[:checked]:bg-skool-50">
                            <input type="radio" name="vervoer" value={v.waarde}
                              checked={vervoer === v.waarde}
                              onChange={() => setVervoer(v.waarde)}
                              className="accent-skool-500" />
                            {v.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    {vervoer === "AUTO" && (
                      <>
                        <div><label className="label">Gereden kilometers, enkele reis</label><input name="kilometers" type="number" min={0} defaultValue={0} className="veld" /></div>
                        <div><label className="label">Parkeerkosten in euro</label><input name="parkeerkosten" type="number" step="0.01" min={0} defaultValue={0} className="veld" /></div>
                      </>
                    )}

                    {vervoer === "OV" && (
                      <div className="sm:col-span-2">
                        <label className="label">Wat heb je betaald aan het openbaar vervoer?</label>
                        <input name="ovKosten" type="number" step="0.01" min={0} defaultValue={0} className="veld" />
                        <p className="mt-1 text-xs text-zand-500">Het bedrag voor de hele reis, heen en terug.</p>
                      </div>
                    )}

                    {vervoer === "FIETS" && (
                      <div className="sm:col-span-2">
                        <label className="label">Gefietste kilometers, enkele reis</label>
                        <input name="kilometers" type="number" min={0} defaultValue={0} className="veld" />
                      </div>
                    )}
                    <div><label className="label">Overige kosten in euro</label><input name="overigeKosten" type="number" step="0.01" min={0} defaultValue={0} className="veld" /></div>
                    <div className="sm:col-span-2"><label className="label">Opmerking</label><textarea name="opmerking" rows={2} className="veld" /></div>
                    <div className="sm:col-span-2"><label className="label">Incident of bijzonderheid</label><textarea name="incident" rows={2} className="veld" /></div>
                    <div className="flex gap-2 sm:col-span-2">
                      <button className="knop-primair flex-1" disabled={bezig}>{bezig ? "Bezig..." : "Declaratie indienen"}</button>
                      <button type="button" className="knop-secundair" onClick={() => setDeclaratieVoor(null)}>Annuleren</button>
                    </div>
                  </form>
                ) : (
                  <button className="knop-primair w-full" onClick={() => setDeclaratieVoor(o.id)}>Opdracht afronden en declareren</button>
                )}
              </div>
            )}

            {o.groep === "afgerond" && o.declaratieTotaal && (
              <p className="mt-2 border-t border-zand-200 pt-2 text-sm text-zand-600">
                Ingediend totaal: <span className="font-semibold">{o.declaratieTotaal}</span>
              </p>
            )}
          </Kaart>
        </li>
      ))}
    </ul>
  );
}
