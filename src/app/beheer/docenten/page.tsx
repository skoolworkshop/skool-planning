import Link from "next/link";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge, statusKleur, Leeg } from "@/components/ui";
import { label } from "@/lib/format";
import UitnodigenForm from "./UitnodigenForm";
import { isVerlopen } from "@/lib/documenten";

export const dynamic = "force-dynamic";

export default async function DocentenPagina({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const u = await vereisGebruiker();
  const q = searchParams.q?.trim();

  const docenten = await db.teacherProfile.findMany({
    where: {
      ...(searchParams.status ? { status: searchParams.status as never } : {}),
      ...(q
        ? {
            OR: [
              { voornaam: { contains: q, mode: "insensitive" as const } },
              { achternaam: { contains: q, mode: "insensitive" as const } },
              { plaats: { contains: q, mode: "insensitive" as const } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { email: true } },
      skills: { select: { id: true } },
      documents: { select: { type: true, status: true, vervaldatum: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: [{ status: "asc" }, { achternaam: "asc" }],
    take: 200,
  });

  const statussen = ["TER_BEOORDELING", "GOEDGEKEURD", "AANVULLING_NODIG", "UITGENODIGD", "INACTIEF"];
  const nu = new Date();

  return (
    <>
      <PaginaKop titel="Workshopdocenten" sub={`${docenten.length} docenten gevonden`} />

      {u.role !== "LEZER" && <UitnodigenForm />}

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Zoek op naam, plaats of e-mail" className="veld max-w-xs" aria-label="Zoeken" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="veld max-w-[220px]" aria-label="Status">
          <option value="">Alle statussen</option>
          {statussen.map((s) => (
            <option key={s} value={s}>{label(s)}</option>
          ))}
        </select>
        <button className="knop-secundair">Filteren</button>
        {(q || searchParams.status) && <Link href="/beheer/docenten" className="knop-ghost">Wissen</Link>}
      </form>

      {docenten.length === 0 ? (
        <Leeg titel="Geen workshopdocenten gevonden" tekst="Pas je zoekopdracht aan of nodig een nieuwe docent uit." />
      ) : (
        <Kaart className="overflow-x-auto p-0 sm:p-0">
          <table className="tabel">
            <thead>
              <tr>
                <th>Naam</th>
                <th className="hidden sm:table-cell">Plaats</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Workshops</th>
                <th className="hidden md:table-cell">Documenten</th>
                <th className="hidden lg:table-cell">Opdrachten</th>
              </tr>
            </thead>
            <tbody>
              {docenten.map((d) => {
                const problemen = d.documents.filter(
                  (x) => x.status === "AFGEKEURD" || isVerlopen(x, nu)
                ).length;
                return (
                  <tr key={d.id} className="hover:bg-zand-100">
                    <td>
                      <Link href={`/beheer/docenten/${d.id}`} className="font-semibold text-zand-700 hover:text-skool-600">
                        {[d.voornaam, d.tussenvoegsel, d.achternaam].filter(Boolean).join(" ")}
                      </Link>
                      <div className="text-xs text-zand-500">{d.user.email}</div>
                    </td>
                    <td className="hidden sm:table-cell">{d.plaats ?? "-"}</td>
                    <td><Badge kleur={statusKleur(d.status)}>{label(d.status)}</Badge></td>
                    <td className="hidden md:table-cell">{d.skills.length}</td>
                    <td className="hidden md:table-cell">
                      {problemen > 0 ? <Badge kleur="rood">{problemen} aandacht</Badge> : <span className="text-zand-400">In orde</span>}
                    </td>
                    <td className="hidden lg:table-cell">{d._count.assignments}</td>
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
