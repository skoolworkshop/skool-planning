import { redirect } from "next/navigation";
import { huidigeGebruiker } from "@/lib/auth";
import { db } from "@/lib/db";
import { PaginaKop, Kaart, Badge, statusKleur, Melding } from "@/components/ui";
import { label, datum } from "@/lib/format";
import ProfielFormulier from "./ProfielFormulier";
import WorkshopKiezer from "./WorkshopKiezer";
import Weekdagen from "./Weekdagen";
import Indienen from "./Indienen";
import { uitloggen } from "@/lib/acties";

export const dynamic = "force-dynamic";

export default async function ProfielPagina() {
  const u = await huidigeGebruiker();
  if (!u) redirect("/login");

  const teacher = await db.teacherProfile.findUnique({
    where: { userId: u.id },
    include: {
      skills: { include: { workshop: true } },
      documents: true,
      availability: { where: { weekdag: { not: null } } },
    },
  });
  if (!teacher) redirect("/login");

  const workshops = await db.workshop.findMany({
    where: { actief: true },
    include: { category: true },
    orderBy: [{ category: { volgorde: "asc" } }, { naam: "asc" }],
  });

  const gekozen = teacher.skills.map((s) => s.workshopId);
  const weekdagen = teacher.availability.filter((a) => a.beschikbaar).map((a) => a.weekdag as number);
  const nu = new Date();
  const verlopen = teacher.documents.filter((d) => d.vervaldatum && d.vervaldatum < nu);
  const compleet = Boolean(teacher.telefoon && teacher.plaats && teacher.iban && gekozen.length > 0);

  const profiel = {
    voornaam: teacher.voornaam,
    tussenvoegsel: teacher.tussenvoegsel ?? "",
    achternaam: teacher.achternaam,
    telefoon: teacher.telefoon ?? "",
    geboortedatum: teacher.geboortedatum ? teacher.geboortedatum.toISOString().slice(0, 10) : "",
    bio: teacher.bio ?? "",
    noodcontact: teacher.noodcontact ?? "",
    noodcontactTel: teacher.noodcontactTel ?? "",
    straat: teacher.straat ?? "",
    huisnummer: teacher.huisnummer ?? "",
    postcode: teacher.postcode ?? "",
    plaats: teacher.plaats ?? "",
    samenwerking: teacher.samenwerking ?? "",
    kvk: teacher.kvk ?? "",
    btwNummer: teacher.btwNummer ?? "",
    iban: teacher.iban ?? "",
    rekeninghouder: teacher.rekeninghouder ?? "",
    uurtarief: teacher.uurtarief ? String(teacher.uurtarief) : "",
    minDagtarief: teacher.minDagtarief ? String(teacher.minDagtarief) : "",
    kmVergoeding: teacher.kmVergoeding ? String(teacher.kmVergoeding) : "0.23",
    maxReisAfstand: teacher.maxReisAfstand ? String(teacher.maxReisAfstand) : "",
    eigenVervoer: teacher.eigenVervoer,
    rijbewijs: teacher.rijbewijs,
    ovMogelijk: teacher.ovMogelijk,
    talen: teacher.talen.join(", "),
    doelgroepen: teacher.doelgroepen,
  };

  return (
    <div className="space-y-5">
      <PaginaKop
        titel="Mijn profiel"
        sub={u.email}
        actie={<Badge kleur={statusKleur(teacher.status)}>{label(teacher.status)}</Badge>}
      />

      {teacher.status === "AANVULLING_NODIG" && (
        <Melding soort="waarschuwing">
          De planner vraagt om een aanvulling. Check je gegevens en dien je profiel opnieuw in.
        </Melding>
      )}
      {teacher.status === "TER_BEOORDELING" && (
        <Melding soort="info">Je profiel ligt bij de planner. Je krijgt bericht zodra het bekeken is.</Melding>
      )}
      {verlopen.length > 0 && (
        <Melding soort="fout">
          Verlopen document: {verlopen.map((d) => label(d.type)).join(", ")}. Lever een nieuwe versie aan bij de planner.
        </Melding>
      )}

      <ProfielFormulier profiel={profiel} />

      <Kaart>
        <h2 className="font-semibold">Mijn workshops</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Kies wat je kunt geven. Je ziet alleen opdrachten van workshops die hier aan staan.
        </p>
        <WorkshopKiezer
          workshops={workshops.map((w) => ({ id: w.id, naam: w.naam, categorie: w.category.naam }))}
          gekozen={gekozen}
        />
      </Kaart>

      <Kaart>
        <h2 className="font-semibold">Vaste beschikbaarheid</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Op welke dagen kun je meestal werken? Losse dagen zet je in je kalender.
        </p>
        <Weekdagen actief={weekdagen} />
      </Kaart>

      <Kaart>
        <h2 className="font-semibold">Documenten</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Aanleveren gaat via de planner. Hier zie je de status.
        </p>
        <div className="mt-3 space-y-2">
          {teacher.documents.length === 0 && (
            <p className="text-sm text-neutral-400">Er staan nog geen documenten in je dossier.</p>
          )}
          {teacher.documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{label(d.type)}</div>
                {d.vervaldatum && <div className="text-xs text-neutral-500">Geldig tot {datum(d.vervaldatum)}</div>}
              </div>
              <Badge kleur={statusKleur(d.vervaldatum && d.vervaldatum < nu ? "VERLOPEN" : d.status)}>
                {label(d.vervaldatum && d.vervaldatum < nu ? "VERLOPEN" : d.status)}
              </Badge>
            </div>
          ))}
        </div>
      </Kaart>

      {["REGISTRATIE_GESTART", "UITGENODIGD", "AANVULLING_NODIG"].includes(teacher.status) && (
        <Indienen compleet={compleet} />
      )}

      <form action={uitloggen}>
        <button className="knop-ghost w-full">Uitloggen</button>
      </form>
    </div>
  );
}
