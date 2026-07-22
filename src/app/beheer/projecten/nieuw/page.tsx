import { db } from "@/lib/db";
import { vereisRol } from "@/lib/auth";
import { PLANNEN } from "@/lib/rbac";
import { PaginaKop } from "@/components/ui";
import Wizard from "./Wizard";

export const dynamic = "force-dynamic";

export default async function NieuwProject() {
  await vereisRol(...PLANNEN);
  const [klanten, workshops] = await Promise.all([
    db.client.findMany({
      where: { actief: true },
      include: { locations: true, contacts: true },
      orderBy: { naam: "asc" },
    }),
    db.workshop.findMany({ where: { actief: true }, include: { category: true }, orderBy: { naam: "asc" } }),
  ]);

  return (
    <>
      <PaginaKop titel="Nieuw project" sub="Eén project met één of meerdere workshopmomenten" />
      <Wizard
        klanten={klanten.map((k) => ({
          id: k.id,
          naam: k.naam,
          locaties: k.locations.map((l) => ({ id: l.id, naam: `${l.naam}, ${l.plaats}` })),
          contacten: k.contacts.map((c) => ({ id: c.id, naam: c.naam })),
        }))}
        workshops={workshops.map((w) => ({
          id: w.id,
          naam: w.naam,
          categorie: w.category.naam,
          duur: w.standaardDuur,
          vergoeding: Number(w.standaardVergoeding),
          docenten: w.docentenPerGroep,
        }))}
      />
    </>
  );
}
