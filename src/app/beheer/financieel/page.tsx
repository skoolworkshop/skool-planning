import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { magGevoeligeGegevens } from "@/lib/rbac";
import { PaginaKop, Kaart, Badge, statusKleur, Leeg, Melding, Stat } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";
import DeclaratieRij from "./DeclaratieRij";

export const dynamic = "force-dynamic";

export default async function FinancieelPagina({ searchParams }: { searchParams: { status?: string } }) {
  const u = await vereisGebruiker();
  const mag = magGevoeligeGegevens(u.role);

  const [items, opensom, betaaldsom] = await Promise.all([
    db.workRegistration.findMany({
      where: searchParams.status ? { status: searchParams.status as never } : { status: { notIn: ["CONCEPT", "BETAALD"] } },
      include: {
        teacher: { select: { id: true, voornaam: true, achternaam: true, iban: true, rekeninghouder: true } },
        assignment: { include: { position: { include: { session: { include: { workshop: true, project: { include: { client: true } } } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.workRegistration.aggregate({ _sum: { totaal: true }, where: { status: { in: ["INGEDIEND", "CONTROLE_NODIG", "GOEDGEKEURD", "KLAAR_VOOR_BETALING"] } } }),
    db.workRegistration.aggregate({ _sum: { totaal: true }, where: { status: "BETAALD" } }),
  ]);

  return (
    <>
      <PaginaKop titel="Financieel" sub="Werkregistraties, declaraties en betalingen" />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat titel="Openstaand" waarde={euro(opensom._sum.totaal ?? 0)} accent />
        <Stat titel="Betaald" waarde={euro(betaaldsom._sum.totaal ?? 0)} />
        <Stat titel="Te beoordelen" waarde={items.filter((i) => i.status === "INGEDIEND").length} />
        <Stat titel="Klaar voor betaling" waarde={items.filter((i) => i.status === "KLAAR_VOOR_BETALING").length} />
      </div>

      {!mag && (
        <div className="mb-4">
          <Melding soort="info">Bankgegevens zijn afgeschermd voor jouw rol. Je ziet wel de bedragen en statussen.</Melding>
        </div>
      )}

      {items.length === 0 ? (
        <Leeg titel="Niets te verwerken" tekst="Er zijn op dit moment geen declaraties die je aandacht nodig hebben." />
      ) : (
        <div className="space-y-3">
          {items.map((w) => (
            <DeclaratieRij
              key={w.id}
              id={w.id}
              docent={`${w.teacher.voornaam} ${w.teacher.achternaam}`}
              iban={mag ? w.teacher.iban : null}
              workshop={w.assignment.position.session.workshop.naam}
              klant={w.assignment.position.session.project.client.naam}
              opdrachtDatum={datum(w.assignment.position.session.datum)}
              uren={Number(w.uren)}
              kilometers={w.kilometers}
              regels={[
                [`Werk, ${Number(w.uren)} uur`, euro(w.workshopVergoeding)],
                ...(Number(w.kmVergoeding) > 0
                  ? [[w.vervoer === "AUTO" ? `Auto, ${w.kilometers} km heen en terug` : "Reistijd", euro(w.kmVergoeding)] as [string, string]]
                  : []),
                ...(Number(w.ovKosten) > 0 ? [["Openbaar vervoer", euro(w.ovKosten)] as [string, string]] : []),
                ...(Number(w.parkeerkosten) > 0 ? [["Parkeerkosten", euro(w.parkeerkosten)] as [string, string]] : []),
                ...(Number(w.overigeKosten) > 0 ? [["Overige kosten", euro(w.overigeKosten)] as [string, string]] : []),
              ]}
              totaal={Number(w.totaal)}
              status={w.status}
              opmerking={w.opmerking}
              incident={w.incident}
              magBeoordelen={mag}
            />
          ))}
        </div>
      )}
    </>
  );
}
