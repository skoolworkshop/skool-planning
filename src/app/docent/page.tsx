import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, Badge, statusKleur, Melding, Leeg } from "@/components/ui";
import { datum, datumLang, euro, label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocentHome() {
  const u = await vereisGebruiker();
  const t = await db.teacherProfile.findUnique({
    where: { userId: u.id },
    include: { skills: true, documents: true },
  });
  if (!t) return <Melding soort="fout">Er is nog geen docentprofiel gekoppeld aan dit account.</Melding>;

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

  const verlopen = t.documents.filter((d) => d.vervaldatum && d.vervaldatum < nu);

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Hoi {t.voornaam}</h1>
      <p className="mb-5 text-sm text-neutral-500">{datumLang(nu)}</p>

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

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Link href="/docent/mijn?tab=uitnodigingen" className="kaart p-3 text-center">
          <div className="text-2xl font-bold text-skool-600">{uitnodigingen}</div>
          <div className="text-xs text-neutral-500">Uitnodigingen</div>
        </Link>
        <Link href="/docent/opdrachten" className="kaart p-3 text-center">
          <div className="text-2xl font-bold">{openPosities}</div>
          <div className="text-xs text-neutral-500">Open opdrachten</div>
        </Link>
        <Link href="/docent/mijn?tab=afronden" className="kaart p-3 text-center">
          <div className="text-2xl font-bold">{teDeclareren}</div>
          <div className="text-xs text-neutral-500">Af te ronden</div>
        </Link>
      </div>

      <div className="mb-4">
        <Link href="/docent/kalender" className="kaart flex items-center justify-between p-3 text-sm">
          <span className="font-medium">Mijn kalender en beschikbaarheid</span>
          <span className="text-neutral-400">›</span>
        </Link>
      </div>

      <h2 className="mb-2 font-semibold">Mijn komende opdrachten</h2>
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
                      <div className="text-sm text-neutral-500">{datum(s.datum)} · {s.startTijd} tot {s.eindTijd}</div>
                      <div className="text-sm text-neutral-500">{s.project.client.naam}, {s.location?.plaats}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{euro(a.position.vergoeding)}</div>
                      {!a.bevestigd && <Badge kleur="geel">Bevestigen</Badge>}
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
