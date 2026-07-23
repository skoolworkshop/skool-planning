/**
 * Hulpfuncties voor het inschrijfsysteem. Geen server-afhankelijkheden,
 * zodat je ze los kunt testen.
 */

/** Letters en cijfers die niet met elkaar te verwarren zijn. Geen 0, O, 1, I of L. */
const TEKENS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function maakCode(lengte = 6) {
  let uit = "";
  for (let i = 0; i < lengte; i++) {
    uit += TEKENS[Math.floor(Math.random() * TEKENS.length)];
  }
  return uit;
}

export function maakCodes(aantal: number, lengte = 6) {
  const set = new Set<string>();
  let pogingen = 0;
  while (set.size < aantal && pogingen < aantal * 50) {
    set.add(maakCode(lengte));
    pogingen++;
  }
  return [...set];
}

export function normaliseerCode(invoer: string) {
  return invoer.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Hoeveel plekken zijn er nog vrij in een slot. */
export function vrijePlekken(capaciteit: number, bezet: number) {
  return Math.max(0, capaciteit - bezet);
}

/**
 * Verdeelt leerlingen over slots op basis van hun voorkeuren.
 * Werkt per ronde. Wie de minste opties heeft komt eerst aan de beurt,
 * daarna wordt op voorkeursvolgorde toegewezen. Wie nergens meer past
 * komt in de restlijst en wordt daarna over de vrije plekken verdeeld.
 */
export function verdeelVoorkeuren(
  leerlingen: { id: string; voorkeuren: string[] }[],
  slots: { id: string; capaciteit: number; bezet: number }[]
) {
  const ruimte = new Map(slots.map((s) => [s.id, s.capaciteit - s.bezet]));
  const toewijzing = new Map<string, string>();
  const rest: string[] = [];

  // Wie de minste voorkeuren opgaf eerst, dat is het meest knellend
  const volgorde = [...leerlingen].sort((a, b) => a.voorkeuren.length - b.voorkeuren.length);

  for (const l of volgorde) {
    let geplaatst = false;
    for (const slotId of l.voorkeuren) {
      const over = ruimte.get(slotId) ?? 0;
      if (over > 0) {
        ruimte.set(slotId, over - 1);
        toewijzing.set(l.id, slotId);
        geplaatst = true;
        break;
      }
    }
    if (!geplaatst) rest.push(l.id);
  }

  // Restgroep over de resterende vrije plekken verdelen
  for (const id of rest) {
    const vrij = [...ruimte.entries()].sort((a, b) => b[1] - a[1])[0];
    if (vrij && vrij[1] > 0) {
      ruimte.set(vrij[0], vrij[1] - 1);
      toewijzing.set(id, vrij[0]);
    }
  }

  const nietGeplaatst = leerlingen.filter((l) => !toewijzing.has(l.id)).map((l) => l.id);
  const eersteKeuze = leerlingen.filter((l) => toewijzing.get(l.id) === l.voorkeuren[0]).length;

  return { toewijzing, nietGeplaatst, eersteKeuze };
}

/**
 * Maakt een rotatieschema voor de klassikale modus.
 * Elke klas rouleert langs de workshops, zodat iedereen alles een keer doet.
 */
export function maakRotatie(klassen: string[], slotsPerRonde: string[][]) {
  const schema: { klas: string; ronde: number; slotId: string }[] = [];
  for (let ronde = 0; ronde < slotsPerRonde.length; ronde++) {
    const slots = slotsPerRonde[ronde];
    if (slots.length === 0) continue;
    klassen.forEach((klas, i) => {
      schema.push({ klas, ronde: ronde + 1, slotId: slots[(i + ronde) % slots.length] });
    });
  }
  return schema;
}

/** Leest een CSV met leerlingen. Kolommen: voornaam, achternaam, klas, email. */
export function leesLeerlingenCsv(tekst: string) {
  const regels = tekst.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (regels.length === 0) return { leerlingen: [], fouten: ["Het bestand is leeg."] };

  const scheiding = regels[0].includes(";") ? ";" : ",";
  const kop = regels[0].split(scheiding).map((k) => k.trim().toLowerCase());
  const heeftKop = kop.includes("voornaam") || kop.includes("klas");
  const start = heeftKop ? 1 : 0;

  const idx = (naam: string, standaard: number) => {
    const i = kop.indexOf(naam);
    return heeftKop && i >= 0 ? i : standaard;
  };
  const iVoor = idx("voornaam", 0);
  const iAchter = idx("achternaam", 1);
  const iKlas = idx("klas", 2);
  const iMail = idx("email", 3);

  const leerlingen: { voornaam: string; achternaam: string; klas: string; email: string }[] = [];
  const fouten: string[] = [];

  for (let r = start; r < regels.length; r++) {
    const v = regels[r].split(scheiding).map((x) => x.trim().replace(/^"|"$/g, ""));
    const voornaam = v[iVoor] ?? "";
    const klas = v[iKlas] ?? "";
    if (!voornaam) {
      fouten.push(`Regel ${r + 1} heeft geen voornaam.`);
      continue;
    }
    if (!klas) {
      fouten.push(`Regel ${r + 1} heeft geen klas.`);
      continue;
    }
    leerlingen.push({ voornaam, achternaam: v[iAchter] ?? "", klas, email: v[iMail] ?? "" });
  }

  return { leerlingen, fouten };
}
