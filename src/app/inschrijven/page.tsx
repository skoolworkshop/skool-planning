import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { leerlingSessie, huidigeLeerling } from "@/lib/inschrijving-acties";
import CodeFormulier from "./CodeFormulier";
import NaamFormulier from "./NaamFormulier";
import Kiezen from "./Kiezen";
import Rooster from "./Rooster";

export const dynamic = "force-dynamic";

export default async function InschrijvenPagina({ searchParams }: { searchParams: { wijzig?: string } }) {
  const sessie = await leerlingSessie();
  if (!sessie) return <CodeFormulier />;
  if (sessie.schoolPortaal) redirect(`/inschrijven/school`);

  const leerling = await huidigeLeerling();
  const e = sessie.enrollment;

  if (!leerling) {
    const lijst = sessie.klas
      ? await db.participant.findMany({
          where: { enrollmentId: e.id, klas: sessie.klas },
          orderBy: [{ voornaam: "asc" }],
          select: { id: true, voornaam: true, achternaam: true, ingeschrevenOp: true },
        })
      : [];
    return (
      <NaamFormulier
        titel={e.titel}
        klas={sessie.klas}
        welkomtekst={e.welkomtekst}
        leerlingen={lijst.map((l) => ({
          id: l.id,
          naam: [l.voornaam, l.achternaam].filter(Boolean).join(" "),
          klaar: Boolean(l.ingeschrevenOp),
        }))}
      />
    );
  }

  const rondes = await db.enrollmentRound.findMany({
    where: { enrollmentId: e.id },
    orderBy: { nummer: "asc" },
    include: {
      slots: {
        include: {
          workshop: { include: { category: true } },
          _count: { select: { keuzes: true } },
        },
      },
    },
  });

  const keuzes = await db.choice.findMany({
    where: { participantId: leerling.id },
    include: { slot: { include: { workshop: true, round: true } } },
  });

  const alles = rondes.length > 0 && keuzes.length >= rondes.length;

  const data = {
    titel: e.titel,
    welkomtekst: e.welkomtekst,
    toonVrijePlekken: e.toonVrijePlekken,
    wijzigenToegestaan: e.wijzigenToegestaan,
    naam: [leerling.voornaam, leerling.achternaam].filter(Boolean).join(" "),
    klas: leerling.klas,
    rondes: rondes.map((r) => ({
      id: r.id,
      nummer: r.nummer,
      naam: r.naam,
      startTijd: r.startTijd,
      eindTijd: r.eindTijd,
      gekozenSlotId: keuzes.find((k) => k.roundId === r.id)?.slotId ?? null,
      slots: r.slots.map((s) => ({
        id: s.id,
        workshop: s.workshop.naam,
        categorie: s.workshop.category.naam,
        omschrijving: s.workshop.korteOmschrijving ?? "",
        ruimte: s.ruimte,
        capaciteit: s.capaciteit,
        vrij: Math.max(0, s.capaciteit - s._count.keuzes),
      })),
    })),
  };

  if (alles && searchParams.wijzig !== "1") return <Rooster data={data} />;
  return <Kiezen data={data} />;
}
