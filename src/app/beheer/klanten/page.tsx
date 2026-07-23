import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge, Leeg } from "@/components/ui";
import { label } from "@/lib/format";
import NieuweKlant from "./NieuweKlant";

export const dynamic = "force-dynamic";

export default async function KlantenPagina({ searchParams }: { searchParams: { q?: string } }) {
  const u = await vereisGebruiker();
  const q = searchParams.q?.trim();

  const klanten = await db.client.findMany({
    where: { deletedAt: null, ...(q ? { OR: [{ naam: { contains: q, mode: "insensitive" } }, { klantnummer: { contains: q, mode: "insensitive" } }] } : {}) },
    include: { locations: true, contacts: true, _count: { select: { projects: true } } },
    orderBy: { naam: "asc" },
    take: 200,
  });

  return (
    <>
      <PaginaKop titel="Klanten" sub={`${klanten.length} klanten`} />
      {u.role !== "LEZER" && <NieuweKlant />}

      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Zoek op naam of klantnummer" className="veld max-w-sm" aria-label="Zoeken" />
        <button className="knop-secundair">Zoeken</button>
      </form>

      {klanten.length === 0 ? (
        <Leeg titel="Nog geen klanten" tekst="Voeg een klant toe met een locatie en een contactpersoon." />
      ) : (
        <Kaart className="overflow-x-auto p-0 sm:p-0">
          <table className="tabel">
            <thead>
              <tr>
                <th>Klant</th>
                <th className="hidden sm:table-cell">Type</th>
                <th className="hidden md:table-cell">Locaties</th>
                <th className="hidden md:table-cell">Contactpersonen</th>
                <th>Projecten</th>
              </tr>
            </thead>
            <tbody>
              {klanten.map((k) => (
                <tr key={k.id} className="hover:bg-zand-100">
                  <td>
                    <Link href={`/beheer/klanten/${k.id}`} className="font-medium hover:text-skool-600">{k.naam}</Link>
                    <div className="text-xs text-zand-500">{k.klantnummer} · {k.locations[0]?.plaats ?? ""}</div>
                  </td>
                  <td className="hidden sm:table-cell"><Badge kleur="grijs">{label(k.type)}</Badge></td>
                  <td className="hidden md:table-cell">{k.locations.length}</td>
                  <td className="hidden md:table-cell">{k.contacts.length}</td>
                  <td>{k._count.projects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Kaart>
      )}
    </>
  );
}
