import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, Badge, statusKleur, Melding, Leeg } from "@/components/ui";
import { datum, datumLang, euro, label } from "@/lib/format";
import { isVerlopen } from "@/lib/documenten";

export const dynamic = "force-dynamic";

export default async function DocentHome() {
  const u = await vereisGebruiker();
  const t = await db.teacherProfile.findUnique({
    where: { userId: u.id },
    include: { skills: true, documents: true },
  });
  if (!t) return <Melding soort="fout">Er is nog geen workshopdocentprofiel gekoppeld aan dit account.</Melding>;

  const nu = new Date();
  const [uitnodigingen, komende, openPosities, teDeclareren] = await Promise.all([
    db.application.count({ where: { teacherId: t.id, soort: "UITNODIGING", status: "UITGENODIGD" } }),
    db.assignment.findMany({
      where: { teacherId: t.id, uitgevallen: false, position: { session: { datum: { gte: nu }, status: { not: "GEANNULEERD" } } } },
      include: { position: { include: { session: { include: { workshop: true, location: true, project: { include: { client: true } } } } } } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    t.status === "GOEDGEKEURD"
      ? db.staffingPosition.count({
          where: {
            gepubliceerd: true, gesloten: false,
            session: { datum: { gte: nu }, status: { not: "GEANNULEERD" }, workshopId: { in: t.skills.map((s) => s.workshopId) } },
            applications: { none: { teacherId: t.id } },
          },
        })
      : Promise.resolve(0),
    db.assignment.count({
      where: { teacherId: t.id, uitgevallen: false, workReg: null, position: { session: { datum: { lt: nu } } } },
    }),
  ]);

  const verlopen = t.documents.filter((d) => isVerlopen(d, nu));

  return (
    <>
      <div className="mb-5">
        <p className="text-sm text-zand-500">{datumLang(nu)}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-zand-700">Hoi {t.voornaam}</h1>
      </div>

      {t.status !== "GOEDGEKEURD" && (
        <div className="mb-4">
          <Melding soort={t.status === "TER_BEOORDELING" ? "info" : "waarschuwing"}>
            Je profiel heeft de status {label(t.status).toLowerCase()}.{" "}
            {t.status === "TER_BEOORDELING"
              ? "We beoordelen je profiel zo snel mogelijk."
              : "Vul je profiel aan en dien het in ter beoordeling."}{" "}
            <Link href="/docent/profiel" className="font-semibold underline">Naar mijn profiel</Link>
          </Melding>
        </div>
      )}

      {verlopen.length > 0 && (
        <div className="mb-4">
          <Melding soort="waarschuwing">
            Je hebt {verlopen.length} verlopen {verlopen.length === 1 ? "document" : "documenten"}. Werk dit bij in je profiel.
          </Melding>
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Link href="/docent/mijn?tab=uitnodigingen" className="kaart p-3.5 text-center transition hover:shadow-zacht">
          <div className="text-2xl font-semibold text-skool-600">{uitnodigingen}</div>
          <div className="mt-0.5 text-xs text-zand-500">Uitnodigingen</div>
        </Link>
        <Link href="/docent/opdrachten" className="kaart p-3.5 text-center transition hover:shadow-zacht">
          <div className="text-2xl font-semibold text-zand-700">{openPosities}</div>
          <div className="mt-0.5 text-xs text-zand-500">Open opdrachten</div>
        </Link>
        <Link href="/docent/mijn?tab=afronden" className="kaart p-3.5 text-center transition hover:shadow-zacht">
          <div className="text-2xl font-semibold text-zand-700">{teDeclareren}</div>
          <div className="mt-0.5 text-xs text-zand-500">Af te ronden</div>
        </Link>
      </div>

      <h2 className="mb-3 font-semibold text-zand-700">Mijn komende opdrachten</h2>
      {komende.length === 0 ? (
        <Leeg
          titel="Nog niets ingepland"
          tekst="Bekijk de open opdrachten en meld je aan voor een workshop die bij je past."
          actie={<Link href="/docent/opdrachten" className="knop-primair">Open opdrachten bekijken</Link>}
        />
      ) : (
        <ul className="space-y-3">
          {komende.map((a) => {
            const s = a.position.session;
            return (
              <li key={a.id}>
                <Link href={`/docent/mijn`} className="kaart block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{s.workshop.naam}</div>
                      <div className="text-sm text-zand-500">{datum(s.datum)} · {s.startTijd} tot {s.eindTijd}</div>
                      <div className="text-sm text-zand-500">{s.project.client.naam}, {s.location?.plaats}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{euro(a.position.vergoeding)}</div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
