import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Melding, Leeg } from "@/components/ui";
import { datum, euro } from "@/lib/format";
import MijnLijst from "./MijnLijst";

export const dynamic = "force-dynamic";

const TABS = [
  { k: "uitnodigingen", l: "Uitnodigingen" },
  { k: "aanmeldingen", l: "Aanmeldingen" },
  { k: "komend", l: "Komend" },
  { k: "afronden", l: "Afronden" },
  { k: "afgerond", l: "Afgerond" },
];

export default async function MijnOpdrachten({ searchParams }: { searchParams: { tab?: string } }) {
  const u = await vereisGebruiker();
  const t = await db.teacherProfile.findUnique({ where: { userId: u.id } });
  if (!t) return <Melding soort="fout">Geen workshopdocentprofiel gevonden.</Melding>;

  const tab = searchParams.tab ?? "komend";
  const nu = new Date();

  const [uitnodigingen, aanmeldingen, toewijzingen] = await Promise.all([
    db.application.findMany({
      where: { teacherId: t.id, soort: "UITNODIGING", status: { in: ["UITGENODIGD", "BEKEKEN"] } },
      include: { position: { include: { session: { include: { workshop: true, location: true, project: { include: { client: true } } } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.application.findMany({
      where: { teacherId: t.id, soort: "AANMELDING", status: { in: ["AANGEMELD", "IN_BEHANDELING"] } },
      include: { position: { include: { session: { include: { workshop: true, location: true, project: { include: { client: true } } } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.assignment.findMany({
      where: { teacherId: t.id, uitgevallen: false },
      include: {
        workReg: true,
        position: { include: { session: { include: { workshop: true, location: true, contact: true, rounds: true, project: { include: { client: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const komend = toewijzingen.filter((a) => a.position.session.datum >= nu && a.position.session.status !== "GEANNULEERD");
  const afronden = toewijzingen.filter((a) => a.position.session.datum < nu && (!a.workReg || a.workReg.status === "CONCEPT" || a.workReg.status === "AANVULLING_NODIG"));
  const afgerond = toewijzingen.filter((a) => a.workReg && a.workReg.status !== "CONCEPT" && a.workReg.status !== "AANVULLING_NODIG");

  const data = { uitnodigingen, aanmeldingen, komend, afronden, afgerond };
  const aantal = {
    uitnodigingen: uitnodigingen.length,
    aanmeldingen: aanmeldingen.length,
    komend: komend.length,
    afronden: afronden.length,
    afgerond: afgerond.length,
  } as Record<string, number>;

  return (
    <>
      <h1 className="mb-3 text-xl font-bold">Mijn werk</h1>

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {TABS.map((x) => (
            <Link
              key={x.k}
              href={`/docent/mijn?tab=${x.k}`}
              className={`knop shrink-0 px-3 text-sm ${tab === x.k ? "bg-skool-500 text-white" : "border border-zand-300 bg-white text-zand-600"}`}
            >
              {x.l}
              {aantal[x.k] > 0 && <span className="ml-1 opacity-70">{aantal[x.k]}</span>}
            </Link>
          ))}
        </div>
      </div>

      <MijnLijst
        standaardVervoer={t.standaardVervoer ?? "AUTO"}
        tab={tab}
        uitnodigingen={uitnodigingen.map((a) => ({
          id: a.id,
          workshop: a.position.session.workshop.naam,
          klant: a.position.session.project.client.naam,
          plaats: a.position.session.location?.plaats ?? "",
          datum: datum(a.position.session.datum),
          tijd: `${a.position.session.startTijd} tot ${a.position.session.eindTijd}`,
          vergoeding: euro(a.position.vergoeding),
          deadline: a.reactieDeadline ? datum(a.reactieDeadline) : null,
          sessionId: a.position.sessionId,
        }))}
        aanmeldingen={aanmeldingen.map((a) => ({
          id: a.id,
          status: a.status,
          workshop: a.position.session.workshop.naam,
          klant: a.position.session.project.client.naam,
          plaats: a.position.session.location?.plaats ?? "",
          datum: datum(a.position.session.datum),
          tijd: `${a.position.session.startTijd} tot ${a.position.session.eindTijd}`,
          vergoeding: euro(a.position.vergoeding),
          sessionId: a.position.sessionId,
        }))}
        opdrachten={[...komend, ...afronden, ...afgerond].map((a) => {
          const s = a.position.session;
          return {
            id: a.id,
            groep: s.datum >= nu ? "komend" : a.workReg && a.workReg.status !== "CONCEPT" && a.workReg.status !== "AANVULLING_NODIG" ? "afgerond" : "afronden",
            workshop: s.workshop.naam,
            klant: s.project.client.naam,
            adres: s.location ? `${[s.location.straat, s.location.huisnummer].filter(Boolean).join(" ")}, ${s.location.postcode ?? ""} ${s.location.plaats}` : "",
            plaats: s.location?.plaats ?? "",
            datum: datum(s.datum),
            tijd: `${s.startTijd} tot ${s.eindTijd}`,
            aanwezigVanaf: s.aanwezigVanaf,
            startTijd: s.startTijd,
            eindTijd: s.eindTijd,
            rondes: s.rounds.map((r) => `Ronde ${r.nummer}: ${r.startTijd} tot ${r.eindTijd}`),
            contact: s.contact?.naam ?? null,
            telefoon: s.telefoonOpDeDag ?? s.contact?.mobiel ?? s.contact?.telefoon ?? null,
            deelnemers: s.deelnemers,
            doelgroep: s.doelgroep,
            benodigdheden: s.benodigdheden,
            kleding: s.kleding,
            bijzonderheden: s.bijzonderheden,
            vergoeding: euro(a.position.vergoeding),
            declaratieStatus: a.workReg?.status ?? null,
            declaratieTotaal: a.workReg ? euro(a.workReg.totaal) : null,
            sessionId: s.id,
          };
        })}
      />
    </>
  );
}
