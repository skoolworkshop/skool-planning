import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { matchDocenten } from "@/lib/matching";
import { Kaart, PaginaKop, Badge, statusKleur, Rij, Melding } from "@/components/ui";
import { datum, datumLang, euro, label } from "@/lib/format";
import PositiePaneel from "./PositiePaneel";
import SessieActies from "./SessieActies";

export const dynamic = "force-dynamic";

export default async function OpdrachtDetail({ params }: { params: { id: string } }) {
  const u = await vereisGebruiker();
  const s = await db.workshopSession.findUnique({
    where: { id: params.id },
    include: {
      workshop: true,
      location: true,
      contact: true,
      rounds: { orderBy: { nummer: "asc" } },
      project: { include: { client: true } },
      positions: {
        include: {
          assignments: { include: { teacher: { include: { user: { select: { email: true } } } } } },
          applications: { include: { teacher: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!s) notFound();

  const matches = await Promise.all(
    s.positions.map(async (p) => ({ positionId: p.id, lijst: (await matchDocenten(p.id)).slice(0, 8) }))
  );

  const nodig = s.positions.reduce((n, p) => n + p.aantal, 0);
  const bezet = s.positions.reduce((n, p) => n + p.assignments.filter((a) => !a.uitgevallen).length, 0);
  const magPlannen = u.role === "SUPERBEHEERDER" || u.role === "PLANNER";

  return (
    <>
      <Link href="/beheer/opdrachten" className="mb-3 inline-block text-sm text-zand-500 hover:text-skool-600">← Terug naar opdrachten</Link>
      <PaginaKop
        titel={s.workshop.naam}
        sub={`${datumLang(s.datum)}, ${s.startTijd} tot ${s.eindTijd} bij ${s.project.client.naam}`}
        actie={
          <div className="flex items-center gap-2">
            <Badge kleur={bezet >= nodig ? "groen" : bezet > 0 ? "geel" : "rood"}>{bezet} van {nodig} bezet</Badge>
            <Badge kleur={statusKleur(s.status)}>{label(s.status)}</Badge>
          </div>
        }
      />

      {s.status === "GEANNULEERD" && (
        <div className="mb-4"><Melding soort="fout">Deze opdracht is geannuleerd.</Melding></div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {s.positions.map((p) => (
            <PositiePaneel
              key={p.id}
              positie={{
                id: p.id,
                rol: p.rol,
                aantal: p.aantal,
                vergoeding: Number(p.vergoeding),
                gepubliceerd: p.gepubliceerd,
                gesloten: p.gesloten,
              }}
              magPlannen={magPlannen}
              toewijzingen={p.assignments.map((a) => ({
                id: a.id,
                naam: [a.teacher.voornaam, a.teacher.tussenvoegsel, a.teacher.achternaam].filter(Boolean).join(" "),
                email: a.teacher.user.email,
                telefoon: a.teacher.telefoon,
                uitgevallen: a.uitgevallen,
              }))}
              aanmeldingen={p.applications.map((a) => ({
                id: a.id,
                teacherId: a.teacherId,
                naam: [a.teacher.voornaam, a.teacher.tussenvoegsel, a.teacher.achternaam].filter(Boolean).join(" "),
                soort: a.soort,
                status: a.status,
                motivatie: a.motivatie,
                deadline: a.reactieDeadline ? datum(a.reactieDeadline) : null,
              }))}
              matches={matches.find((m) => m.positionId === p.id)?.lijst ?? []}
            />
          ))}
          {s.positions.length === 0 && (
            <Kaart><p className="text-sm text-zand-500">Er zijn nog geen workshopdocentposities aangemaakt voor deze opdracht.</p></Kaart>
          )}
        </div>

        <div className="space-y-5">
          <Kaart>
            <h2 className="mb-2 font-semibold">Opdrachtgegevens</h2>
            <Rij label="Project">
              <Link href={`/beheer/opdrachten/${s.projectId}`} className="text-skool-600 hover:underline">{s.project.naam}</Link>
            </Rij>
            <Rij label="Ordernummer">{s.project.ordernummer}</Rij>
            <Rij label="Klant">{s.project.client.naam}</Rij>
            <Rij label="Locatie">
              {s.location ? `${s.location.naam}, ${[s.location.straat, s.location.huisnummer].filter(Boolean).join(" ")}, ${s.location.plaats}` : ""}
            </Rij>
            <Rij label="Ruimte">{s.ruimte}</Rij>
            <Rij label="Aanwezig vanaf">{s.aanwezigVanaf}</Rij>
            <Rij label="Deelnemers">{s.deelnemers > 0 ? `${s.deelnemers}, ${s.leeftijd ?? ""}` : ""}</Rij>
            <Rij label="Doelgroep">{s.doelgroep}</Rij>
            <Rij label="Vergoeding">{euro(s.vergoeding)}</Rij>
            <Rij label="Reiskosten">{s.reiskosten}</Rij>
            <Rij label="Aanmelddeadline">{s.aanmeldDeadline ? datum(s.aanmeldDeadline) : ""}</Rij>
          </Kaart>

          {s.rounds.length > 0 && (
            <Kaart>
              <h2 className="mb-2 font-semibold">Rondes</h2>
              <ul className="space-y-1 text-sm">
                {s.rounds.map((r) => (
                  <li key={r.id} className="flex justify-between border-b border-zand-200 py-1.5 last:border-0">
                    <span className="font-medium">Ronde {r.nummer}</span>
                    <span>{r.startTijd} tot {r.eindTijd}</span>
                    <span className="text-zand-500">{r.groep ?? ""} {r.deelnemers > 0 ? `· ${r.deelnemers}` : ""}</span>
                  </li>
                ))}
              </ul>
            </Kaart>
          )}

          <Kaart>
            <h2 className="mb-2 font-semibold">Contact op de dag</h2>
            <Rij label="Naam">{s.contact?.naam}</Rij>
            <Rij label="Telefoon">{s.telefoonOpDeDag ?? s.contact?.mobiel ?? s.contact?.telefoon}</Rij>
            <Rij label="E-mail">{s.contact?.email}</Rij>
            <Rij label="Parkeren">{s.location?.parkeren}</Rij>
          </Kaart>

          <Kaart>
            <h2 className="mb-2 font-semibold">Praktisch</h2>
            <Rij label="Benodigdheden">{s.benodigdheden}</Rij>
            <Rij label="Kleding">{s.kleding}</Rij>
            <Rij label="Bijzonderheden">{s.bijzonderheden}</Rij>
            <Rij label="Veiligheid">{s.veiligheid}</Rij>
          </Kaart>

          {magPlannen && s.status !== "GEANNULEERD" && <SessieActies sessionId={s.id} />}
        </div>
      </div>
    </>
  );
}
