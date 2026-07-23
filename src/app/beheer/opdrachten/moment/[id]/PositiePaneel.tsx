"use client";

import { useState, useTransition } from "react";
import { Badge, statusKleur } from "@/components/ui";
import { euro, label } from "@/lib/format";
import { positiePubliceren, directUitnodigen, docentToewijzen, toewijzingIntrekken, aanmeldingStatus, docentUitgevallen } from "@/lib/planning-acties";
import type { MatchResultaat } from "@/lib/matching";

type Positie = { id: string; rol: string; aantal: number; vergoeding: number; gepubliceerd: boolean; gesloten: boolean };
type Toewijzing = { id: string; naam: string; email: string; telefoon: string | null; uitgevallen: boolean };
type Aanmelding = { id: string; teacherId: string; naam: string; soort: string; status: string; motivatie: string | null; deadline: string | null };

export default function PositiePaneel({
  positie, toewijzingen, aanmeldingen, matches, magPlannen,
}: {
  positie: Positie;
  toewijzingen: Toewijzing[];
  aanmeldingen: Aanmelding[];
  matches: MatchResultaat[];
  magPlannen: boolean;
}) {
  const [bezig, start] = useTransition();
  const [melding, setMelding] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [conflictVoor, setConflictVoor] = useState<string | null>(null);
  const [reden, setReden] = useState("");
  const [gekozen, setGekozen] = useState<string[]>([]);
  const [toonMatch, setToonMatch] = useState(false);

  const bezet = toewijzingen.filter((t) => !t.uitgevallen).length;

  function doe(fn: () => Promise<{ ok?: boolean; fout?: string; conflict?: boolean } | void>, ok?: string, teacherId?: string) {
    setFout(null); setMelding(null);
    start(async () => {
      const res = await fn();
      if (res && "fout" in res && res.fout) {
        setFout(res.fout);
        if (res.conflict && teacherId) setConflictVoor(teacherId);
      } else {
        setMelding(ok ?? "Gelukt");
        setConflictVoor(null);
        setReden("");
        setGekozen([]);
      }
    });
  }

  return (
    <div className="kaart p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">{label(positie.rol)}</h2>
          <p className="text-sm text-zand-500">{bezet} van {positie.aantal} bezet · {euro(positie.vergoeding)} per docent</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {positie.gepubliceerd ? <Badge kleur="blauw">Gepubliceerd</Badge> : <Badge kleur="grijs">Niet gepubliceerd</Badge>}
          {positie.gesloten && <Badge kleur="groen">Gesloten</Badge>}
        </div>
      </div>

      {magPlannen && (
        <div className="mb-4 flex flex-wrap gap-2">
          {!positie.gepubliceerd && (
            <button className="knop-primair" disabled={bezig}
              onClick={() => doe(() => positiePubliceren(positie.id), "Positie gepubliceerd en passende workshopdocenten zijn gemeld.")}>
              Publiceren voor docenten
            </button>
          )}
          <button className="knop-secundair" onClick={() => setToonMatch(!toonMatch)}>
            {toonMatch ? "Verberg voorgestelde workshopdocenten" : "Toon voorgestelde workshopdocenten"}
          </button>
        </div>
      )}

      {melding && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{melding}</p>}
      {fout && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}

      {/* Toegewezen docenten */}
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zand-500">Toegewezen</h3>
      {toewijzingen.length === 0 ? (
        <p className="mb-4 text-sm text-zand-500">Nog niemand toegewezen.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {toewijzingen.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-zand-200 px-3 py-2 text-sm">
              <span className="font-medium">{t.naam}</span>
              <span className="text-zand-500">{t.email}</span>
              {t.uitgevallen && <Badge kleur="rood">Uitgevallen</Badge>}
              <Badge kleur="groen">Definitief ingepland</Badge>
              {magPlannen && !t.uitgevallen && (
                <span className="ml-auto flex gap-2">
                  <button className="knop-ghost px-2 text-xs" disabled={bezig}
                    onClick={() => doe(() => docentUitgevallen(t.id, reden || "Uitgevallen"), "Gemeld als uitgevallen.")}>
                    Uitgevallen
                  </button>
                  <button className="knop-ghost px-2 text-xs text-red-700" disabled={bezig}
                    onClick={() => doe(() => toewijzingIntrekken(t.id, reden || "Ingetrokken door planner"), "Toewijzing ingetrokken.")}>
                    Intrekken
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Aanmeldingen en uitnodigingen */}
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zand-500">Aanmeldingen en uitnodigingen</h3>
      {aanmeldingen.length === 0 ? (
        <p className="mb-4 text-sm text-zand-500">Nog geen reacties.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {aanmeldingen.map((a) => (
            <li key={a.id} className="rounded-lg border border-zand-200 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{a.naam}</span>
                <Badge kleur={statusKleur(a.status)}>{label(a.status)}</Badge>
                <span className="text-xs text-zand-500">{a.soort === "UITNODIGING" ? "directe uitnodiging" : "eigen aanmelding"}</span>
                {a.deadline && <span className="text-xs text-zand-500">reageren voor {a.deadline}</span>}
              </div>
              {a.motivatie && <p className="mt-1 text-zand-600">{a.motivatie}</p>}
              {magPlannen && ["AANGEMELD", "IN_BEHANDELING", "BEKEKEN"].includes(a.status) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="knop-primair px-3 text-xs" disabled={bezig}
                    onClick={() => doe(() => docentToewijzen(positie.id, a.teacherId, conflictVoor === a.teacherId ? { conflictReden: reden } : undefined), "Docent toegewezen en bevestiging verstuurd.", a.teacherId)}>
                    Selecteren
                  </button>
                  <button className="knop-secundair px-3 text-xs" disabled={bezig}
                    onClick={() => doe(() => aanmeldingStatus(a.id, "IN_BEHANDELING"), "Op de reservelijst gezet.")}>
                    Reservelijst
                  </button>
                  <button className="knop-secundair px-3 text-xs" disabled={bezig}
                    onClick={() => doe(() => aanmeldingStatus(a.id, "AFGEWEZEN"), "Afgewezen en docent geïnformeerd.")}>
                    Afwijzen
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {conflictVoor && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="mb-2 font-medium text-amber-900">Er is een planningsconflict. Geef een reden op om dit toch door te zetten.</p>
          <input value={reden} onChange={(e) => setReden(e.target.value)} className="veld" placeholder="Reden voor het overrulen" />
        </div>
      )}

      {/* Matching */}
      {magPlannen && toonMatch && (
        <>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zand-500">Voorgestelde workshopdocenten</h3>
          <p className="mb-2 text-xs text-zand-500">
            Dit is een hulpmiddel. Jij maakt altijd zelf de keuze. Waarschuwingen sluiten niemand automatisch uit.
          </p>
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m.teacherId} className="rounded-lg border border-zand-200 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={gekozen.includes(m.teacherId)}
                    onChange={(e) => setGekozen(e.target.checked ? [...gekozen, m.teacherId] : gekozen.filter((x) => x !== m.teacherId))}
                    aria-label={`Selecteer ${m.naam}`}
                  />
                  <span className="font-medium">{m.naam}</span>
                  <Badge kleur={m.score >= 70 ? "groen" : m.score >= 45 ? "geel" : "grijs"}>{m.score}% match</Badge>
                  {m.afstand !== null && <span className="text-xs text-zand-500">{m.afstand} km · ongeveer {m.reistijd} min</span>}
                  {m.eerderVoorKlant > 0 && <span className="text-xs text-zand-500">{m.eerderVoorKlant}x eerder bij deze klant</span>}
                  <button className="knop-ghost ml-auto px-2 text-xs" disabled={bezig || m.blokkerend && !reden}
                    onClick={() => doe(() => docentToewijzen(positie.id, m.teacherId, reden ? { conflictReden: reden } : undefined), "Docent toegewezen.", m.teacherId)}>
                    Direct toewijzen
                  </button>
                </div>
                {m.redenen.length > 0 && <p className="mt-1 text-xs text-emerald-700">{m.redenen.join(" · ")}</p>}
                {m.waarschuwingen.length > 0 && <p className="mt-1 text-xs text-amber-700">Let op: {m.waarschuwingen.join(" · ")}</p>}
              </li>
            ))}
            {matches.length === 0 && <li className="text-sm text-zand-500">Geen geschikte docenten gevonden.</li>}
          </ul>
          {gekozen.length > 0 && (
            <button className="knop-primair mt-3" disabled={bezig}
              onClick={() => doe(() => directUitnodigen(positie.id, gekozen), `${gekozen.length} docenten persoonlijk uitgenodigd.`)}>
              {gekozen.length} docenten uitnodigen
            </button>
          )}
        </>
      )}
    </div>
  );
}
