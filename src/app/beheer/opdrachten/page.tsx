import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge, statusKleur, Leeg } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OpdrachtenPagina({ searchParams }: { searchParams: { filter?: string; q?: string; status?: string } }) {
  await vereisGebruiker();
  const q = searchParams.q?.trim();

  const sessies = await db.workshopSession.findMany({
    where: {
      ...(searchParams.status ? { status: searchParams.status as never } : {}),
      ...(q
        ? {
            OR: [
              { workshop: { naam: { contains: q, mode: "insensitive" as const } } },
              { project: { naam: { contains: q, mode: "insensitive" as const } } },
              { project: { client: { naam: { contains: q, mode: "insensitive" as const } } } },
              { location: { plaats: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: {
      workshop: { select: { naam: true } },
      location: { select: { plaats: true } },
      project: { include: { client: { select: { naam: true } } } },
      positions: { include: { assignments: true, applications: true } },
    },
    orderBy: [{ datum: "asc" }, { startTijd: "asc" }],
    take: 200,
  });

  const gefilterd =
    searchParams.filter === "onbezet"
      ? sessies.filter((s) => {
          const nodig = s.positions.reduce((n, p) => n + p.aantal, 0);
          const bezet = s.positions.reduce((n, p) => n + p.assignments.filter((a) => !a.reserve && !a.uitgevallen).length, 0);
          return bezet < nodig && s.status !== "GEANNULEERD";
        })
      : sessies;

  return (
    <>
      <PaginaKop
        titel="Opdrachten"
        sub={`${gefilterd.length} workshopmomenten`}
        actie={<Link href="/beheer/projecten/nieuw" className="knop-primair">Nieuw project</Link>}
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Zoek op workshop, klant, project of plaats" className="veld max-w-sm" aria-label="Zoeken" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="veld max-w-[220px]" aria-label="Status">
          <option value="">Alle statussen</option>
          {["NIET_GEPUBLICEERD", "DOCENTEN_GEZOCHT", "AANMELDINGEN_ONTVANGEN", "GEDEELTELIJK_BEZET", "VOLLEDIG_BEZET", "UITGEVOERD", "GEANNULEERD"].map((s) => (
            <option key={s} value={s}>{label(s)}</option>
          ))}
        </select>
        <button className="knop-secundair">Filteren</button>
        <Link href="/beheer/opdrachten?filter=onbezet" className="knop-ghost">Alleen onbezet</Link>
      </form>

      {gefilterd.length === 0 ? (
        <Leeg titel="Geen opdrachten gevonden" tekst="Maak een nieuw project aan of pas je filters aan." actie={<Link href="/beheer/projecten/nieuw" className="knop-primair">Nieuw project</Link>} />
      ) : (
        <Kaart className="overflow-x-auto p-0 sm:p-0">
          <table className="tabel">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Workshop</th>
                <th className="hidden sm:table-cell">Klant en plaats</th>
                <th>Bezetting</th>
                <th className="hidden lg:table-cell">Aanmeldingen</th>
                <th className="hidden md:table-cell">Vergoeding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {gefilterd.map((s) => {
                const nodig = s.positions.reduce((n, p) => n + p.aantal, 0);
                const bezet = s.positions.reduce((n, p) => n + p.assignments.filter((a) => !a.reserve && !a.uitgevallen).length, 0);
                const open = s.positions.reduce((n, p) => n + p.applications.filter((a) => a.status === "AANGEMELD").length, 0);
                return (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="whitespace-nowrap">
                      <div className="font-semibold">{datum(s.datum)}</div>
                      <div className="text-xs text-neutral-500">{s.startTijd} tot {s.eindTijd}</div>
                    </td>
                    <td>
                      <Link href={`/beheer/opdrachten/${s.id}`} className="font-medium hover:text-skool-600">{s.workshop.naam}</Link>
                      <div className="text-xs text-neutral-500 sm:hidden">{s.project.client.naam}</div>
                    </td>
                    <td className="hidden sm:table-cell">
                      {s.project.client.naam}
                      <div className="text-xs text-neutral-500">{s.location?.plaats}</div>
                    </td>
                    <td><Badge kleur={bezet >= nodig ? "groen" : bezet > 0 ? "geel" : "rood"}>{bezet} van {nodig}</Badge></td>
                    <td className="hidden lg:table-cell">{open > 0 ? <Badge kleur="blauw">{open} open</Badge> : "-"}</td>
                    <td className="hidden md:table-cell">{euro(s.vergoeding)}</td>
                    <td><Badge kleur={statusKleur(s.status)}>{label(s.status)}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Kaart>
      )}
    </>
  );
}
