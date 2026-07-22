import "server-only";
import { db } from "./db";
import { afstandKm, reistijdMin } from "./format";

export type MatchResultaat = {
  teacherId: string;
  naam: string;
  score: number;
  redenen: string[];
  waarschuwingen: string[];
  afstand: number | null;
  reistijd: number | null;
  eerderVoorKlant: number;
  opdrachtenDezeWeek: number;
  documentenOk: boolean;
  blokkerend: boolean;
};

/**
 * Rangschikt docenten voor een positie.
 * De planner maakt altijd zelf de eindkeuze. Docenten worden niet automatisch
 * en definitief uitgesloten, ze krijgen een waarschuwing en een lagere score.
 */
export async function matchDocenten(positionId: string): Promise<MatchResultaat[]> {
  const positie = await db.staffingPosition.findUnique({
    where: { id: positionId },
    include: {
      session: { include: { workshop: true, location: true, project: { include: { client: true } } } },
      assignments: true,
      applications: true,
    },
  });
  if (!positie) return [];

  const sessie = positie.session;
  const dagStart = new Date(sessie.datum);
  dagStart.setHours(0, 0, 0, 0);
  const dagEind = new Date(dagStart);
  dagEind.setDate(dagEind.getDate() + 1);

  const weekStart = new Date(dagStart);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEind = new Date(weekStart);
  weekEind.setDate(weekEind.getDate() + 7);

  const docenten = await db.teacherProfile.findMany({
    where: { status: "GOEDGEKEURD" },
    include: {
      skills: true,
      documents: true,
      availability: true,
      assignments: { include: { position: { include: { session: { include: { project: true } } } } } },
    },
  });

  const vereist = new Set([...positie.vereisteDocumenten, ...sessie.workshop.vereisteDocumenten]);
  const nu = new Date();

  const resultaten: MatchResultaat[] = docenten.map((d) => {
    const redenen: string[] = [];
    const waarschuwingen: string[] = [];
    let score = 0;
    let blokkerend = false;

    // Vaardigheid
    const skill = d.skills.find((s) => s.workshopId === sessie.workshopId);
    if (skill) {
      score += 35 + skill.niveau * 5;
      redenen.push(skill.niveau >= 3 ? "Expert in deze workshop" : "Geeft deze workshop");
      if (!skill.zelfstandig && positie.rol !== "ASSISTENT") {
        waarschuwingen.push("Alleen inzetbaar als assistent");
        score -= 20;
      }
    } else {
      waarschuwingen.push("Workshop staat niet in het profiel");
      blokkerend = true;
    }

    // Documenten
    const documentenOk = [...vereist].every((t) => {
      const doc = d.documents.find((x) => x.type === t);
      return doc && doc.status === "GOEDGEKEURD" && (!doc.vervaldatum || doc.vervaldatum > nu);
    });
    if (documentenOk) {
      score += 10;
    } else {
      waarschuwingen.push("Verplicht document ontbreekt of is verlopen");
      blokkerend = true;
    }

    // Dubbele boeking
    const zelfdeDag = d.assignments.filter((a) => {
      const s = a.position.session;
      return s.datum >= dagStart && s.datum < dagEind && !a.uitgevallen;
    });
    const overlap = zelfdeDag.some((a) => {
      const s = a.position.session;
      return !(s.eindTijd <= sessie.startTijd || s.startTijd >= sessie.eindTijd);
    });
    if (overlap) {
      waarschuwingen.push("Heeft al een opdracht op dit tijdstip");
      blokkerend = true;
    } else if (zelfdeDag.length > 0) {
      waarschuwingen.push("Heeft dezelfde dag al een andere opdracht");
      score -= 5;
    }

    // Beschikbaarheid
    const weekdag = ((sessie.datum.getDay() + 6) % 7) + 1;
    const opDatum = d.availability.find(
      (a) => a.datum && a.datum >= dagStart && a.datum < dagEind
    );
    if (opDatum && !opDatum.beschikbaar) {
      waarschuwingen.push("Heeft deze dag als niet beschikbaar opgegeven");
      blokkerend = true;
    } else if (opDatum?.beschikbaar) {
      score += 15;
      redenen.push("Expliciet beschikbaar op deze datum");
    } else {
      const vast = d.availability.find((a) => a.weekdag === weekdag && a.beschikbaar);
      if (vast) {
        score += 10;
        redenen.push("Standaard beschikbaar op deze weekdag");
      } else if (d.availability.some((a) => a.weekdag !== null)) {
        waarschuwingen.push("Geeft deze weekdag normaal niet aan als beschikbaar");
        score -= 10;
      }
    }

    // Afstand
    const km = afstandKm(d, sessie.location ?? undefined);
    if (km !== null) {
      if (d.maxReisAfstand && km > d.maxReisAfstand) {
        waarschuwingen.push(`Verder dan de gewenste maximale reisafstand van ${d.maxReisAfstand} km`);
        score -= 15;
      } else {
        score += Math.max(0, 20 - Math.round(km / 5));
        if (km <= 20) redenen.push(`Woont dichtbij, ongeveer ${km} km`);
      }
      if (km > 40 && !d.eigenVervoer) waarschuwingen.push("Geen eigen vervoer bij een grote afstand");
    }

    // Doelgroepervaring
    if (sessie.doelgroep && d.doelgroepen.includes(sessie.doelgroep)) {
      score += 8;
      redenen.push("Ervaring met deze doelgroep");
    }

    // Eerder bij deze klant
    const eerderVoorKlant = d.assignments.filter(
      (a) => a.position.session.project.clientId === sessie.project.clientId
    ).length;
    if (eerderVoorKlant > 0) {
      score += Math.min(10, eerderVoorKlant * 3);
      redenen.push(`Werkte al ${eerderVoorKlant}x voor deze klant`);
    }

    // Spreiding over docenten
    const opdrachtenDezeWeek = d.assignments.filter((a) => {
      const s = a.position.session;
      return s.datum >= weekStart && s.datum < weekEind;
    }).length;
    if (opdrachtenDezeWeek >= 4) {
      waarschuwingen.push("Heeft deze week al veel opdrachten");
      score -= 8;
    } else if (opdrachtenDezeWeek === 0) {
      score += 5;
    }

    // Al aangemeld of toegewezen
    if (positie.assignments.some((a) => a.teacherId === d.id)) {
      waarschuwingen.push("Al toegewezen aan deze positie");
      blokkerend = true;
    }

    return {
      teacherId: d.id,
      naam: [d.voornaam, d.tussenvoegsel, d.achternaam].filter(Boolean).join(" "),
      score: Math.max(0, Math.min(100, score)),
      redenen,
      waarschuwingen,
      afstand: km,
      reistijd: reistijdMin(km),
      eerderVoorKlant,
      opdrachtenDezeWeek,
      documentenOk,
      blokkerend,
    };
  });

  return resultaten.sort((a, b) => Number(a.blokkerend) - Number(b.blokkerend) || b.score - a.score);
}
