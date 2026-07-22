import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { PaginaKop, Kaart, Badge, statusKleur, Stat } from "@/components/ui";
import { datum, label } from "@/lib/format";
import Instellingen from "./Instellingen";
import Rondes from "./Rondes";
import Leerlingen from "./Leerlingen";
import Codes from "./Codes";
import StatusKnoppen from "./StatusKnoppen";

export const dynamic = "force-dynamic";

export default async function InschrijvingPagina({ params }: { params: { id: string } }) {
  await vereisGebruiker();

  const e = await db.enrollment.findUnique({
    where: { id: params.id },
    include: {
      project: { include: { client: true, location: true } },
      rondes: {
        orderBy: { nummer: "asc" },
        include: {
          slots: {
            include: {
              workshop: true,
              teacher: { select: { id: true, voornaam: true, achternaam: true } },
              _count: { select: { keuzes: true } },
            },
          },
        },
      },
      deelnemers: { orderBy: [{ klas: "asc" }, { voornaam: "asc" }] },
      codes: { orderBy: [{ klas: "asc" }, { code: "asc" }] },
    },
  });
  if (!e) notFound();

  const [workshops, docenten] = await Promise.all([
    db.workshop.findMany({ where: { actief: true }, include: { category: true }, orderBy: { naam: "asc" } }),
    db.teacherProfile.findMany({ where: { status: "GOEDGEKEURD" }, orderBy: { voornaam: "asc" } }),
  ]);

  const totaal = e.deelnemers.length;
  const klaar = e.deelnemers.filter((d) => d.ingeschrevenOp).length;
  const plekken = e.rondes.reduce((n, r) => n + r.slots.reduce((m, s) => m + s.capaciteit, 0), 0);
  const bezet = e.rondes.reduce((n, r) => n + r.slots.reduce((m, s) => m + s._count.keuzes, 0), 0);
  const schoolcode = e.codes.find((c) => c.schoolPortaal);

  return (
    <>
      <PaginaKop
        titel={e.titel}
        sub={`${e.project.client.naam} · ${e.project.startDatum ? datum(e.project.startDatum) : "geen datum"}`}
        actie={<Badge kleur={statusKleur(e.status)}>{label(e.status)}</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat titel="Leerlingen" waarde={totaal} />
        <Stat titel="Ingeschreven" waarde={`${klaar} van ${totaal}`} accent />
        <Stat titel="Plekken" waarde={plekken} />
        <Stat titel="Bezet" waarde={`${bezet} van ${plekken}`} />
      </div>

      <div className="mt-5 space-y-5">
        <StatusKnoppen id={e.id} status={e.status} />

        <Rondes
          enrollmentId={e.id}
          rondes={e.rondes.map((r) => ({
            id: r.id,
            nummer: r.nummer,
            naam: r.naam,
            startTijd: r.startTijd,
            eindTijd: r.eindTijd,
            slots: r.slots.map((s) => ({
              id: s.id,
              workshop: s.workshop.naam,
              ruimte: s.ruimte,
              capaciteit: s.capaciteit,
              bezet: s._count.keuzes,
              docent: s.teacher ? `${s.teacher.voornaam} ${s.teacher.achternaam}` : null,
            })),
          }))}
          workshops={workshops.map((w) => ({ id: w.id, naam: w.naam, categorie: w.category.naam, max: w.maxGroep }))}
          docenten={docenten.map((d) => ({ id: d.id, naam: `${d.voornaam} ${d.achternaam}` }))}
        />

        <Leerlingen
          enrollmentId={e.id}
          leerlingen={e.deelnemers.map((d) => ({
            id: d.id,
            naam: [d.voornaam, d.achternaam].filter(Boolean).join(" "),
            klas: d.klas,
            klaar: Boolean(d.ingeschrevenOp),
          }))}
        />

        <Codes
          enrollmentId={e.id}
          scope={e.codeScope}
          codes={e.codes.filter((c) => !c.schoolPortaal).map((c) => ({
            code: c.code,
            klas: c.klas,
            gebruikt: c.gebruikt,
          }))}
          schoolcode={schoolcode?.code ?? null}
        />

        <Instellingen
          waarden={{
            id: e.id,
            titel: e.titel,
            modus: e.modus,
            codeScope: e.codeScope,
            keuzesPerRonde: e.keuzesPerRonde,
            voorkeurenAantal: e.voorkeurenAantal,
            herhalingToegestaan: e.herhalingToegestaan,
            wijzigenToegestaan: e.wijzigenToegestaan,
            toonVrijePlekken: e.toonVrijePlekken,
            welkomtekst: e.welkomtekst ?? "",
            sluitingsdatum: e.sluitingsdatum ? e.sluitingsdatum.toISOString().slice(0, 10) : "",
          }}
        />

        <Kaart>
          <h2 className="font-semibold">Downloads</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Alles wat de school en de workshopdocenten op de dag zelf nodig hebben.
          </p>
          <div className="mt-3 space-y-3">
            {([
              ["roosters", "Persoonlijke roosters"],
              ["presentie", "Presentielijsten"],
              ["klassen", "Klassenlijsten"],
              ["dagrooster", "Dagrooster"],
              ["docenten", "Docentenrooster"],
              ["materiaal", "Materiaaloverzicht"],
            ] as const).map(([soort, titel]) => (
              <div key={soort} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2">
                <span className="text-sm font-medium">{titel}</span>
                <span className="flex gap-2">
                  <Link className="knop-secundair" href={`/beheer/inschrijvingen/${e.id}/print/${soort}`} target="_blank">
                    Print of PDF
                  </Link>
                  <a className="knop-secundair" href={`/api/inschrijving/${e.id}/${soort}`}>CSV</a>
                </span>
              </div>
            ))}
          </div>
        </Kaart>

        <Kaart>
          <h2 className="font-semibold">Delen met de school</h2>
          <div className="mt-2 space-y-2 text-sm">
            <Rij titel="Inschrijflink voor leerlingen" waarde="/inschrijven" />
            {schoolcode && <Rij titel="Code voor de contactpersoon" waarde={schoolcode.code} />}
            <p className="text-neutral-500">
              De contactpersoon van de school volgt hiermee de voortgang en ziet wie zich nog niet heeft ingeschreven.
            </p>
          </div>
        </Kaart>

        <Link href="/beheer/inschrijvingen" className="knop-ghost">Terug naar het overzicht</Link>
      </div>
    </>
  );
}

function Rij({ titel, waarde }: { titel: string; waarde: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2">
      <span className="text-neutral-500">{titel}</span>
      <span className="font-mono font-semibold">{waarde}</span>
    </div>
  );
}
