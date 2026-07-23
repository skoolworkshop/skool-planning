import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, PaginaKop, Badge, statusKleur, Stat, Leeg } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";
import { leesMaand } from "@/lib/maand";
import Maandkiezer from "@/components/Maandkiezer";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: { maand?: string } }) {
  await vereisGebruiker();
  const maand = leesMaand(searchParams.maand);

  const [projecten, sessies, aanmeldingen] = await Promise.all([
    db.project.findMany({
      where: { startDatum: { gte: maand.start, lte: maand.eind } },
      select: { id: true, status: true, omzet: true },
    }),
    db.workshopSession.findMany({
      where: { datum: { gte: maand.start, lte: maand.eind } },
      include: {
        workshop: { select: { naam: true, afbeeldingUrl: true, afbeeldingAlt: true } },
        location: { select: { plaats: true } },
        project: { select: { id: true, naam: true, client: { select: { naam: true } } } },
        positions: { include: { assignments: true } },
      },
      orderBy: [{ datum: "asc" }, { startTijd: "asc" }],
    }),
    db.application.count({
      where: {
        status: { in: ["AANGEMELD", "IN_BEHANDELING"] },
        position: { session: { datum: { gte: maand.start, lte: maand.eind } } },
      },
    }),
  ]);

  const posities = sessies.flatMap((s) => s.positions);
  const nodig = posities.reduce((n, p) => n + p.aantal, 0);
  const bezet = posities.reduce((n, p) => n + p.assignments.filter((a) => !a.uitgevallen).length, 0);
  const onbezet = Math.max(0, nodig - bezet);

  const volBezet = sessies.filter((s) => {
    const n = s.positions.reduce((x, p) => x + p.aantal, 0);
    const b = s.positions.reduce((x, p) => x + p.assignments.filter((a) => !a.uitgevallen).length, 0);
    return n > 0 && b >= n && s.status !== "GEANNULEERD";
  }).length;

  const zoekt = sessies.filter((s) => {
    const n = s.positions.reduce((x, p) => x + p.aantal, 0);
    const b = s.positions.reduce((x, p) => x + p.assignments.filter((a) => !a.uitgevallen).length, 0);
    return b < n && s.status !== "GEANNULEERD";
  });

  const uitgevoerd = sessies.filter((s) => s.status === "UITGEVOERD").length;
  const geannuleerd = sessies.filter((s) => s.status === "GEANNULEERD").length;
  const docentkosten = posities.reduce((n, p) => n + Number(p.vergoeding) * p.aantal, 0);

  return (
    <>
      <PaginaKop
        titel="Dashboard"
        sub={`Overzicht van ${maand.label}`}
        actie={<Link href="/beheer/opdrachten/nieuw" className="knop knop-primair px-4 py-2">Nieuwe opdracht</Link>}
      />

      <div className="mb-5">
        <Maandkiezer sleutel={maand.sleutel} label={maand.label} vorige={maand.vorige} volgende={maand.volgende} isHuidige={maand.isHuidige} />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat titel="Opdrachten deze maand" waarde={projecten.length} href={`/beheer/opdrachten?maand=${maand.sleutel}`} />
        <Stat titel="Volledig bezet" waarde={volBezet} />
        <Stat titel="Nog een workshopdocent nodig" waarde={onbezet} accent={onbezet > 0} href={`/beheer/opdrachten?maand=${maand.sleutel}&filter=onbezet`} />
        <Stat titel="Openstaande aanmeldingen" waarde={aanmeldingen} href="/beheer/aanmeldingen" />
        <Stat titel="Toegewezen workshopdocenten" waarde={bezet} />
        <Stat titel="Uitgevoerd" waarde={uitgevoerd} />
        <Stat titel="Verwachte kosten workshopdocenten" waarde={euro(docentkosten)} />
        <Stat titel="Geannuleerd" waarde={geannuleerd} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Kaart>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Zoekt nog een workshopdocent</h2>
            <Link href={`/beheer/opdrachten?maand=${maand.sleutel}&filter=onbezet`} className="text-sm font-medium text-skool-600 hover:underline">
              Alles bekijken
            </Link>
          </div>
          {zoekt.length === 0 ? (
            <p className="text-sm text-zand-500">Alles is bezet deze maand. Mooi werk.</p>
          ) : (
            <ul className="space-y-3">
              {zoekt.slice(0, 6).map((s) => {
                const n = s.positions.reduce((x, p) => x + p.aantal, 0);
                const b = s.positions.reduce((x, p) => x + p.assignments.filter((a) => !a.uitgevallen).length, 0);
                return (
                  <li key={s.id}>
                    <Link href={`/beheer/opdrachten/moment/${s.id}`} className="flex items-center gap-3 hover:text-skool-600">
                      <span className="h-10 w-14 shrink-0 overflow-hidden rounded bg-zand-200">
                        {s.workshop.afbeeldingUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.workshop.afbeeldingUrl} alt={s.workshop.afbeeldingAlt ?? ""} className="h-full w-full object-cover" loading="lazy" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{s.workshop.naam}</span>
                        <span className="block text-xs text-zand-500">
                          {datum(s.datum)} · {s.startTijd} · {s.project.client.naam}
                          {s.location?.plaats ? `, ${s.location.plaats}` : ""}
                        </span>
                      </span>
                      <Badge kleur={b > 0 ? "geel" : "rood"}>{b} van {n}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Kaart>

        <Kaart>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Opdrachten in {maand.label}</h2>
            <Link href={`/beheer/opdrachten?maand=${maand.sleutel}`} className="text-sm font-medium text-skool-600 hover:underline">
              Alles bekijken
            </Link>
          </div>
          {sessies.length === 0 ? (
            <Leeg
              titel="Nog niets gepland"
              tekst="Er staat deze maand nog geen workshop in de agenda."
              actie={<Link href="/beheer/opdrachten/nieuw" className="knop knop-primair px-4 py-2">Nieuwe opdracht</Link>}
            />
          ) : (
            <ul className="space-y-2">
              {sessies.slice(0, 8).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 border-b border-zand-200 pb-2 text-sm last:border-0">
                  <Link href={`/beheer/opdrachten/${s.project.id}`} className="min-w-0 flex-1 hover:text-skool-600">
                    <span className="block truncate font-medium">{s.workshop.naam}</span>
                    <span className="block text-xs text-zand-500">{datum(s.datum)} · {s.project.client.naam}</span>
                  </Link>
                  <Badge kleur={statusKleur(s.status)}>{label(s.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Kaart>
      </div>
    </>
  );
}
