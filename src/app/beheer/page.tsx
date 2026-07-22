import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, PaginaKop, Stat, Badge, statusKleur } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await vereisGebruiker();

  const nu = new Date();
  const vandaagStart = new Date(nu); vandaagStart.setHours(0, 0, 0, 0);
  const vandaagEind = new Date(vandaagStart); vandaagEind.setDate(vandaagEind.getDate() + 1);
  const weekEind = new Date(vandaagStart); weekEind.setDate(weekEind.getDate() + 7);
  const binnenkort = new Date(nu); binnenkort.setDate(binnenkort.getDate() + 60);

  const [
    vandaag, dezeWeek, posities, openAanmeldingen, geenReactie,
    verlopenDocs, nieuweDocenten, teVerwerken, teBetalen, activiteit, komende,
  ] = await Promise.all([
    db.workshopSession.count({ where: { datum: { gte: vandaagStart, lt: vandaagEind }, status: { not: "GEANNULEERD" } } }),
    db.workshopSession.count({ where: { datum: { gte: vandaagStart, lt: weekEind }, status: { not: "GEANNULEERD" } } }),
    db.staffingPosition.findMany({
      where: { gesloten: false, session: { datum: { gte: vandaagStart }, status: { not: "GEANNULEERD" } } },
      include: { assignments: true },
    }),
    db.application.count({ where: { status: { in: ["AANGEMELD", "IN_BEHANDELING"] } } }),
    db.application.count({ where: { soort: "UITNODIGING", status: "UITGENODIGD" } }),
    db.teacherDocument.count({ where: { OR: [{ status: "VERLOPEN" }, { vervaldatum: { lt: binnenkort, gte: nu } }] } }),
    db.teacherProfile.count({ where: { status: { in: ["TER_BEOORDELING", "AANVULLING_NODIG"] } } }),
    db.workRegistration.count({ where: { status: { in: ["INGEDIEND", "CONTROLE_NODIG"] } } }),
    db.workRegistration.aggregate({ _sum: { totaal: true }, where: { status: "KLAAR_VOOR_BETALING" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { email: true } } } }),
    db.workshopSession.findMany({
      where: { datum: { gte: vandaagStart, lt: weekEind }, status: { not: "GEANNULEERD" } },
      orderBy: [{ datum: "asc" }, { startTijd: "asc" }],
      take: 8,
      include: {
        workshop: { select: { naam: true } },
        location: { select: { plaats: true } },
        project: { include: { client: { select: { naam: true } } } },
        positions: { include: { assignments: true } },
      },
    }),
  ]);

  const onbezet = posities.reduce((n, p) => n + Math.max(0, p.aantal - p.assignments.filter((a) => !a.reserve && !a.uitgevallen).length), 0);

  return (
    <>
      <PaginaKop titel="Dashboard" sub="Alles wat vandaag je aandacht vraagt" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat titel="Opdrachten vandaag" waarde={vandaag} href="/beheer/planning" />
        <Stat titel="Deze week" waarde={dezeWeek} href="/beheer/planning" />
        <Stat titel="Onbezette posities" waarde={onbezet} href="/beheer/opdrachten?filter=onbezet" accent={onbezet > 0} />
        <Stat titel="Open aanmeldingen" waarde={openAanmeldingen} href="/beheer/aanmeldingen" accent={openAanmeldingen > 0} />
        <Stat titel="Uitnodiging zonder reactie" waarde={geenReactie} href="/beheer/aanmeldingen?filter=uitnodiging" />
        <Stat titel="Nieuwe docenten" waarde={nieuweDocenten} href="/beheer/docenten?status=TER_BEOORDELING" accent={nieuweDocenten > 0} />
        <Stat titel="Documenten verlopen" waarde={verlopenDocs} href="/beheer/docenten?filter=documenten" />
        <Stat titel="Werkregistraties" waarde={teVerwerken} href="/beheer/financieel" accent={teVerwerken > 0} />
        <Stat titel="Klaar voor betaling" waarde={euro(teBetalen._sum.totaal ?? 0)} href="/beheer/financieel?status=KLAAR_VOOR_BETALING" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Kaart>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Komende zeven dagen</h2>
              <Link href="/beheer/planning" className="text-sm font-medium text-skool-600 hover:underline">Naar planning</Link>
            </div>
            {komende.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">Geen opdrachten gepland deze week.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {komende.map((s) => {
                  const nodig = s.positions.reduce((n, p) => n + p.aantal, 0);
                  const bezet = s.positions.reduce((n, p) => n + p.assignments.filter((a) => !a.reserve && !a.uitgevallen).length, 0);
                  return (
                    <li key={s.id}>
                      <Link href={`/beheer/opdrachten/${s.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 hover:bg-neutral-50">
                        <span className="w-20 shrink-0 text-sm font-semibold">{datum(s.datum)}</span>
                        <span className="w-24 shrink-0 text-sm text-neutral-500">{s.startTijd} tot {s.eindTijd}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.workshop.naam}</span>
                        <span className="truncate text-sm text-neutral-500">{s.project.client.naam}, {s.location?.plaats ?? ""}</span>
                        <Badge kleur={bezet >= nodig ? "groen" : bezet > 0 ? "geel" : "rood"}>{bezet} van {nodig} bezet</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Kaart>
        </div>

        <Kaart>
          <h2 className="mb-3 font-semibold">Activiteit</h2>
          <ul className="space-y-3 text-sm">
            {activiteit.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-skool-400" />
                <div className="min-w-0">
                  <div className="font-medium">{label(a.actie)}</div>
                  <div className="text-xs text-neutral-500">
                    {a.entiteit} · {a.user?.email ?? "systeem"} · {datum(a.createdAt)}
                  </div>
                </div>
              </li>
            ))}
            {activiteit.length === 0 && <li className="text-neutral-500">Nog geen activiteit.</li>}
          </ul>
        </Kaart>
      </div>
    </>
  );
}
