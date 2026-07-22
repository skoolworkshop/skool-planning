import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, Badge, Rij, Melding } from "@/components/ui";
import { datum, datumLang, euro, afstandKm, reistijdMin } from "@/lib/format";
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
  const openPositie = s.positions.find(
    (p) => p.gepubliceerd && !p.gesloten && p.aantal > p.assignments.filter((a) => !a.reserve && !a.uitgevallen).length
  );
  const eigenReactie = s.positions.flatMap((p) => p.applications)[0];

  return (
    <>
      <Link href="/docent/opdrachten" className="mb-3 inline-block text-sm text-neutral-500">← Terug</Link>

      <h1 className="text-xl font-bold">{s.workshop.naam}</h1>
      <p className="mb-4 text-sm text-neutral-500">{datumLang(s.datum)}, {s.startTijd} tot {s.eindTijd}</p>

      {s.status === "GEANNULEERD" && <div className="mb-4"><Melding soort="fout">Deze opdracht is geannuleerd.</Melding></div>}
      {eigenReactie && (
        <div className="mb-4">
          <Melding soort="ok">Je hebt al gereageerd op deze opdracht. Status: {eigenReactie.status.toLowerCase().replace(/_/g, " ")}.</Melding>
        </div>
      )}

      <div className="space-y-4">
        <Kaart>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Vergoeding</h2>
            <span className="text-2xl font-bold text-skool-600">{euro(openPositie?.vergoeding ?? s.vergoeding)}</span>
          </div>
          <Rij label="Reiskosten">{s.reiskosten}</Rij>
          <Rij label="Aanwezig vanaf">{s.aanwezigVanaf}</Rij>
          <Rij label="Aanmelddeadline">{s.aanmeldDeadline ? datum(s.aanmeldDeadline) : "Niet ingesteld"}</Rij>
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
            <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm">
              <div className="mb-1 font-medium">Instructie voor de docent</div>
              <p className="whitespace-pre-line text-neutral-700">{s.workshop.docentInstructie}</p>
            </div>
          )}
        </Kaart>

        {s.rounds.length > 0 && (
          <Kaart>
            <h2 className="mb-2 font-semibold">Rondes</h2>
            <ul className="text-sm">
              {s.rounds.map((r) => (
                <li key={r.id} className="flex justify-between border-b border-neutral-100 py-2 last:border-0">
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
              <p className="mt-2 text-xs text-neutral-500">
                Het volledige adres en de contactgegevens zie je zodra je bent ingepland.
              </p>
            </>
          )}
        </Kaart>
      </div>

      {openPositie && !eigenReactie && s.status !== "GEANNULEERD" && (
        <Aanmeldknop positionId={openPositie.id} vergoeding={Number(openPositie.vergoeding)} />
      )}
    </>
  );
}
