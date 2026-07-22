import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, Badge, Leeg, Melding } from "@/components/ui";
import { datum, euro, afstandKm, reistijdMin } from "@/lib/format";
import { binnenReisafstand } from "@/lib/tarieven";

export const dynamic = "force-dynamic";

export default async function OpenOpdrachten({ searchParams }: { searchParams: { q?: string; max?: string } }) {
  const u = await vereisGebruiker();
  const t = await db.teacherProfile.findUnique({ where: { userId: u.id }, include: { skills: true } });
  if (!t) return <Melding soort="fout">Geen workshopdocentprofiel gevonden.</Melding>;

  if (t.status !== "GOEDGEKEURD") {
    return (
      <>
        <h1 className="mb-4 text-xl font-bold">Open opdrachten</h1>
        <Melding soort="info">
          Zodra je profiel is goedgekeurd zie je hier alle opdrachten die bij jouw workshops passen.{" "}
          <Link href="/docent/profiel" className="font-semibold underline">Profiel afmaken</Link>
        </Melding>
      </>
    );
  }

  const nu = new Date();
  const q = searchParams.q?.trim();
  const maxAfstand = searchParams.max ? Number(searchParams.max) : null;

  const posities = await db.staffingPosition.findMany({
    where: {
      gepubliceerd: true,
      gesloten: false,
      session: {
        datum: { gte: nu },
        status: { notIn: ["GEANNULEERD", "UITGEVOERD"] },
        workshopId: { in: t.skills.map((s) => s.workshopId) },
        ...(q
          ? {
              OR: [
                { workshop: { naam: { contains: q, mode: "insensitive" as const } } },
                { location: { plaats: { contains: q, mode: "insensitive" as const } } },
                { project: { client: { naam: { contains: q, mode: "insensitive" as const } } } },
              ],
            }
          : {}),
      },
    },
    include: {
      assignments: true,
      applications: { where: { teacherId: t.id } },
      session: { include: { workshop: true, location: true, project: { include: { client: true } } } },
    },
    orderBy: { session: { datum: "asc" } },
    take: 100,
  });

  const kaarten = posities
    .map((p) => {
      const km = afstandKm(t, p.session.location ?? undefined);
      return { p, km, vrij: p.aantal - p.assignments.filter((a) => !a.reserve && !a.uitgevallen).length };
    })
    .filter((x) => x.vrij > 0)
    // Buiten de eigen maximale reisafstand tonen we een opdracht niet
    .filter((x) => binnenReisafstand(x.km, t.maxReisAfstand))
    .filter((x) => (maxAfstand && x.km !== null ? x.km <= maxAfstand : true));

  const verborgen = posities
    .map((p) => ({ km: afstandKm(t, p.session.location ?? undefined), vrij: p.aantal - p.assignments.filter((a) => !a.reserve && !a.uitgevallen).length }))
    .filter((x) => x.vrij > 0 && !binnenReisafstand(x.km, t.maxReisAfstand)).length;

  return (
    <>
      <h1 className="mb-1 text-xl font-bold">Open opdrachten</h1>
      <p className="mb-4 text-sm text-neutral-500">
        {kaarten.length} opdrachten die bij jouw workshops passen
        {verborgen > 0 && (
          <>
            {" "}· <span className="text-neutral-400">{verborgen} verborgen omdat ze verder liggen dan je maximale reisafstand van {t.maxReisAfstand} km</span>
          </>
        )}
      </p>

      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Zoek op workshop, plaats of klant" className="veld" aria-label="Zoeken" />
        <select name="max" defaultValue={searchParams.max ?? ""} className="veld w-32" aria-label="Maximale afstand">
          <option value="">Afstand</option>
          <option value="15">tot 15 km</option>
          <option value="30">tot 30 km</option>
          <option value="60">tot 60 km</option>
        </select>
        <button className="knop-secundair px-3">Zoek</button>
      </form>

      {kaarten.length === 0 ? (
        <Leeg
          titel="Geen open opdrachten"
          tekst="Er staan nu geen opdrachten open die bij jouw workshops passen. Je krijgt automatisch bericht zodra er iets bijkomt."
        />
      ) : (
        <ul className="space-y-3">
          {kaarten.map(({ p, km, vrij }) => {
            const s = p.session;
            const alGereageerd = p.applications.length > 0;
            return (
              <li key={p.id}>
                <Link href={`/docent/opdrachten/${s.id}`} className="kaart block p-4 transition hover:border-skool-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{s.workshop.naam}</div>
                      <div className="text-sm text-neutral-600">{datum(s.datum)} · {s.startTijd} tot {s.eindTijd}</div>
                      <div className="text-sm text-neutral-500">{s.location?.plaats ?? ""}{km !== null ? ` · ${km} km, ongeveer ${reistijdMin(km)} min` : ""}</div>
                      <div className="mt-1 text-xs text-neutral-500">{s.doelgroep ?? ""}{s.deelnemers > 0 ? ` · ${s.deelnemers} deelnemers` : ""}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-bold text-skool-600">{euro(p.vergoeding)}</div>
                      <Badge kleur={vrij > 1 ? "blauw" : "oranje"}>{vrij} {vrij === 1 ? "plek" : "plekken"}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {s.aanmeldDeadline && <span className="text-xs text-neutral-500">Reageren voor {datum(s.aanmeldDeadline)}</span>}
                    {alGereageerd && <Badge kleur="groen">Je hebt al gereageerd</Badge>}
                    <span className="ml-auto text-sm font-semibold text-skool-600">Bekijk opdracht →</span>
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
