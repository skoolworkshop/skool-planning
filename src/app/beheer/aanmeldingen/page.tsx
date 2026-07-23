import Link from "next/link";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge, statusKleur, Leeg } from "@/components/ui";
import { datum, datumTijd, euro, label } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AanmeldingenPagina({ searchParams }: { searchParams: { filter?: string } }) {
  await vereisGebruiker();

  const where: Prisma.ApplicationWhereInput =
    searchParams.filter === "uitnodiging"
      ? { soort: "UITNODIGING", status: "UITGENODIGD" }
      : { status: { in: ["AANGEMELD", "IN_BEHANDELING", "UITGENODIGD", "BEKEKEN"] } };

  const items = await db.application.findMany({
    where,
    include: {
      teacher: { select: { id: true, voornaam: true, achternaam: true, plaats: true } },
      position: { include: { session: { include: { workshop: true, location: true, project: { include: { client: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PaginaKop titel="Aanmeldingen" sub={`${items.length} openstaande reacties`} />
      <div className="mb-4 flex gap-2">
        <Link href="/beheer/aanmeldingen" className="knop-secundair">Alles</Link>
        <Link href="/beheer/aanmeldingen?filter=uitnodiging" className="knop-secundair">Uitnodigingen zonder reactie</Link>
      </div>

      {items.length === 0 ? (
        <Leeg titel="Niets te beoordelen" tekst="Er staan op dit moment geen aanmeldingen of uitnodigingen open." />
      ) : (
        <Kaart className="overflow-x-auto p-0 sm:p-0">
          <table className="tabel">
            <thead>
              <tr>
                <th>Docent</th>
                <th>Opdracht</th>
                <th className="hidden md:table-cell">Datum</th>
                <th className="hidden lg:table-cell">Vergoeding</th>
                <th>Soort</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Ontvangen</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-zand-100">
                  <td>
                    <Link href={`/beheer/docenten/${a.teacher.id}`} className="font-medium hover:text-skool-600">
                      {a.teacher.voornaam} {a.teacher.achternaam}
                    </Link>
                    <div className="text-xs text-zand-500">{a.teacher.plaats}</div>
                  </td>
                  <td>
                    <Link href={`/beheer/opdrachten/moment/${a.position.sessionId}`} className="font-medium hover:text-skool-600">
                      {a.position.session.workshop.naam}
                    </Link>
                    <div className="text-xs text-zand-500">{a.position.session.project.client.naam}, {a.position.session.location?.plaats}</div>
                  </td>
                  <td className="hidden md:table-cell whitespace-nowrap">{datum(a.position.session.datum)}</td>
                  <td className="hidden lg:table-cell">{euro(a.position.vergoeding)}</td>
                  <td className="text-xs">{a.soort === "UITNODIGING" ? "Uitnodiging" : "Aanmelding"}</td>
                  <td><Badge kleur={statusKleur(a.status)}>{label(a.status)}</Badge></td>
                  <td className="hidden lg:table-cell text-xs text-zand-500">{datumTijd(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Kaart>
      )}
      <p className="mt-3 text-sm text-zand-500">Beoordelen en selecteren doe je op de opdrachtpagina, daar zie je alle kandidaten naast elkaar.</p>
    </>
  );
}
