import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, Badge, Rij, Melding } from "@/components/ui";
import { datum, datumLang, euro, afstandKm, reistijdMin } from "@/lib/format";
import { vergoedingVoorOpdracht, reisOpties, ovLink } from "@/lib/tarieven";
import { tarievenVoor } from "@/lib/tarief-acties";
import Aanmeldknop from "./Aanmeldknop";

export const dynamic = "force-dynamic";

export default async function OpdrachtDetailDocent({ params }: { params: { id: string } }) {
  const u = await vereisGebruiker();
  const t = await db.teacherProfile.findUnique({ where: { userId: u.id } });
  if (!t) notFound();

  const s = await db.workshopSession.findUnique({
    where: { id: params.id },
    include: {
      workshop: true,
      location: true,
      contact: true,
      rounds: { orderBy: { nummer: "asc" } },
      project: { include: { client: true } },
      positions: { include: { assignments: true, applications: { where: { teacherId: t.id } } } },
    },
  });
  if (!s) notFound();

  // Is deze docent toegewezen? Dan pas volledige klant- en contactgegevens tonen.
  const toegewezen = s.positions.some((p) => p.assignments.some((a) => a.teacherId === t.id && !a.uitgevallen));
  const km = afstandKm(t, s.location ?? undefined);
  const tarieven = await tarievenVoor(t);
  const opties = reisOpties({ kilometers: km, reistijdMinuten: km === null ? null : reistijdMin(km) }, tarieven);
  const ovRoute = km !== null
    ? ovLink({
        vanPostcode: t.postcode,
        vanPlaats: t.plaats,
        naarPostcode: s.location?.postcode,
        naarPlaats: s.location?.plaats,
        datum: s.datum,
        aankomstTijd: s.aanwezigVanaf ?? s.startTijd,
      })
    : null;
  const v = vergoedingVoorOpdracht(
    {
      aanwezigVanaf: s.aanwezigVanaf,
      startTijd: s.startTijd,
      eindTijd: s.eindTijd,
      afbouwTot: s.afbouwTot,
      kilometers: km,
      reistijdMinuten: km === null ? null : reistijdMin(km),
    },
    tarieven
  );
  const openPositie = s.positions.find(
    (p) => p.gepubliceerd && !p.gesloten && p.aantal > p.assignments.filter((a) => !a.uitgevallen).length
  );
  const eigenReactie = s.positions.flatMap((p) => p.applications)[0];

  return (
    <>
      <Link href="/docent/opdrachten" className="mb-3 inline-block text-sm text-zand-500">← Terug</Link>

      <h1 className="text-xl font-bold">{s.workshop.naam}</h1>
      <p className="mb-4 text-sm text-zand-500">{datumLang(s.datum)}, {s.startTijd} tot {s.eindTijd}</p>

      {s.status === "GEANNULEERD" && <div className="mb-4"><Melding soort="fout">Deze opdracht is geannuleerd.</Melding></div>}
      {eigenReactie && (
        <div className="mb-4">
          <Melding soort="ok">Je hebt al gereageerd op deze opdracht. Status: {eigenReactie.status.toLowerCase().replace(/_/g, " ")}.</Melding>
        </div>
      )}

      <div className="space-y-4">
        <Kaart>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Wat je verdient</h2>
            <span className="text-2xl font-bold text-skool-600">{euro(v.werk)} plus reis</span>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-zand-200 p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Voor de workshop</span>
                <span className="font-semibold">{euro(v.werk)}</span>
              </div>
              <p className="mt-1 text-xs text-zand-500">{v.uitleg.werk}</p>
              {v.minimumToegepast && (
                <p className="mt-1 text-xs text-emerald-700">Je krijgt het dagminimum, ook al is de opdracht korter.</p>
              )}
            </div>

            {opties.length > 0 ? (
              <div className="rounded-xl border border-zand-200 p-3">
                <div className="mb-2 text-sm font-medium">Voor het reizen</div>
                <p className="mb-2 text-xs text-zand-500">
                  Je kiest zelf hoe je gaat. Hieronder wat je in beide gevallen krijgt.
                </p>
                <ul className="space-y-2">
                  {opties.map((o) => (
                    <li key={o.vervoer} className="rounded-lg bg-zand-100 p-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm">{o.label}</span>
                        <span className="font-semibold">
                          {o.vervoer === "OV" ? "ongeveer " : ""}{euro(o.bedrag)}
                        </span>
                      </div>
                      <ul className="mt-0.5 space-y-0.5 text-xs text-zand-500">
                        {o.regels.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                      {o.vervoer === "OV" && ovRoute && (
                        <a href={ovRoute} target="_blank" rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs font-semibold text-skool-600 underline">
                          Bekijk je route en de prijs op 9292
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-xl border border-zand-200 p-3 text-xs text-zand-500">
                De afstand is nog niet bekend, dus we kunnen de reiskosten niet berekenen.
                Vul je postcode in bij je profiel.
              </div>
            )}

            <div className="flex items-baseline justify-between border-t border-zand-200 pt-3">
              <span className="font-medium">Totaal met de auto</span>
              <span className="text-lg font-bold text-skool-600">{euro(v.totaal)}</span>
            </div>
          </div>

          <div className="mt-3 border-t border-zand-200 pt-2">
            <Rij label="Workshop">{v.vanTijd} tot {v.totTijd}</Rij>
            <Rij label="Aanwezig vanaf">{v.aanwezigVanaf ?? "In overleg"}</Rij>
            <Rij label="Klaar om te vertrekken">{v.afbouwTot ?? "Direct na afloop"}</Rij>
            <Rij label="Aanmelddeadline">{s.aanmeldDeadline ? datum(s.aanmeldDeadline) : "Niet ingesteld"}</Rij>
          </div>

          <p className="mt-2 text-xs text-zand-400">
            Je wordt betaald per uur workshop. Opbouwen en afbouwen horen erbij maar tellen niet als uren.
            Dit is een berekening vooraf, na afloop vul je je echte uren en kilometers in.
          </p>
        </Kaart>

        <Kaart>
          <h2 className="mb-2 font-semibold">Over de opdracht</h2>
          <Rij label="Workshop">{s.workshop.naam}</Rij>
          <Rij label="Doelgroep">{s.doelgroep}</Rij>
          <Rij label="Deelnemers">{s.deelnemers > 0 ? `${s.deelnemers}` : ""}</Rij>
          <Rij label="Leeftijd of leerjaar">{s.leeftijd}</Rij>
          <Rij label="Benodigdheden">{s.benodigdheden ?? s.workshop.materialen}</Rij>
          <Rij label="Kleding">{s.kleding}</Rij>
          <Rij label="Bijzonderheden">{s.bijzonderheden}</Rij>
          {s.workshop.docentInstructie && (
            <div className="mt-3 rounded-lg bg-zand-100 p-3 text-sm">
              <div className="mb-1 font-medium">Instructie voor de workshopdocent</div>
              <p className="whitespace-pre-line text-zand-600">{s.workshop.docentInstructie}</p>
            </div>
          )}
        </Kaart>

        {s.rounds.length > 0 && (
          <Kaart>
            <h2 className="mb-2 font-semibold">Rondes</h2>
            <ul className="text-sm">
              {s.rounds.map((r) => (
                <li key={r.id} className="flex justify-between border-b border-zand-200 py-2 last:border-0">
                  <span className="font-medium">Ronde {r.nummer} {r.groep ? `· ${r.groep}` : ""}</span>
                  <span>{r.startTijd} tot {r.eindTijd}</span>
                </li>
              ))}
            </ul>
          </Kaart>
        )}

        <Kaart>
          <h2 className="mb-2 font-semibold">Locatie</h2>
          {toegewezen ? (
            <>
              <Rij label="Klant">{s.project.client.naam}</Rij>
              <Rij label="Adres">
                {s.location ? `${[s.location.straat, s.location.huisnummer].filter(Boolean).join(" ")}, ${s.location.postcode} ${s.location.plaats}` : ""}
              </Rij>
              <Rij label="Ruimte">{s.ruimte}</Rij>
              <Rij label="Parkeren">{s.location?.parkeren}</Rij>
              <Rij label="Contactpersoon">{s.contact?.naam}</Rij>
              <Rij label="Telefoon">{s.telefoonOpDeDag ?? s.contact?.mobiel}</Rij>
              {s.location && (
                <a
                  className="knop-secundair mt-3 w-full"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.location.straat ?? ""} ${s.location.huisnummer ?? ""}, ${s.location.postcode ?? ""} ${s.location.plaats}`)}`}
                  target="_blank" rel="noreferrer"
                >
                  Route openen
                </a>
              )}
            </>
          ) : (
            <>
              <Rij label="Plaats">{s.location?.plaats}</Rij>
              <Rij label="Afstand">{km !== null ? `ongeveer ${km} km, ${reistijdMin(km)} minuten` : "Onbekend"}</Rij>
              <p className="mt-2 text-xs text-zand-500">
                Het volledige adres en de contactgegevens zie je zodra je bent ingepland.
              </p>
            </>
          )}
        </Kaart>
      </div>

      {openPositie && !eigenReactie && s.status !== "GEANNULEERD" && (
        <Aanmeldknop positionId={openPositie.id} vergoeding={v.totaal} />
      )}
    </>
  );
}
