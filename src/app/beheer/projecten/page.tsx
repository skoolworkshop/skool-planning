import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge, statusKleur, Leeg } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectenPagina({ searchParams }: { searchParams: { q?: string } }) {
  await vereisGebruiker();
  const q = searchParams.q?.trim();

  const projecten = await db.project.findMany({
    where: q
      ? { OR: [{ naam: { contains: q, mode: "insensitive" } }, { ordernummer: { contains: q, mode: "insensitive" } }, { client: { naam: { contains: q, mode: "insensitive" } } }] }
      : {},
    include: {
      client: { select: { naam: true } },
      sessions: { include: { positions: { include: { assignments: true } } } },
    },
    orderBy: { startDatum: "desc" },
    take: 100,
  });

  return (
    <>
      <PaginaKop
        titel="Projecten"
        sub={`${projecten.length} projecten`}
        actie={<Link href="/beheer/projecten/nieuw" className="knop-primair">Nieuw project</Link>}
      />

      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Zoek op naam, ordernummer of klant" className="veld max-w-sm" aria-label="Zoeken" />
        <button className="knop-secundair">Zoeken</button>
      </form>

      {projecten.length === 0 ? (
        <Leeg titel="Nog geen projecten" tekst="Een project bundelt alle workshopmomenten voor één opdracht van een klant." actie={<Link href="/beheer/projecten/nieuw" className="knop-primair">Nieuw project</Link>} />
      ) : (
        <Kaart className="overflow-x-auto p-0 sm:p-0">
          <table className="tabel">
            <thead>
              <tr>
                <th>Ordernummer</th>
                <th>Project</th>
                <th className="hidden sm:table-cell">Klant</th>
                <th className="hidden md:table-cell">Periode</th>
                <th>Sessies</th>
                <th className="hidden lg:table-cell">Omzet</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projecten.map((p) => {
                const nodig = p.sessions.flatMap((s) => s.positions).reduce((n, x) => n + x.aantal, 0);
                const bezet = p.sessions.flatMap((s) => s.positions).reduce((n, x) => n + x.assignments.filter((a) => !a.reserve && !a.uitgevallen).length, 0);
                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="font-mono text-xs">{p.ordernummer}</td>
                    <td><Link href={`/beheer/projecten/${p.id}`} className="font-medium hover:text-skool-600">{p.naam}</Link></td>
                    <td className="hidden sm:table-cell">{p.client.naam}</td>
                    <td className="hidden md:table-cell whitespace-nowrap">{datum(p.startDatum)}{p.eindDatum && p.eindDatum.getTime() !== p.startDatum?.getTime() ? ` tot ${datum(p.eindDatum)}` : ""}</td>
                    <td>{p.sessions.length} <span className="text-neutral-400">({bezet} van {nodig} bezet)</span></td>
                    <td className="hidden lg:table-cell">{euro(p.omzet)}</td>
                    <td><Badge kleur={statusKleur(p.status)}>{label(p.status)}</Badge></td>
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
