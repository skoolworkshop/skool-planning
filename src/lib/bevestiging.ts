/**
 * Bouwt het tijdschema en de bevestigingstekst voor een opdracht.
 *
 * Losse module zonder database, zodat de logica te testen is.
 * De opbouw volgt de bevestigingsmails die Skool Workshop al jaren verstuurt.
 */

export type BevRonde = {
  nummer: number;
  startTijd: string;
  eindTijd: string;
  afdeling?: string | null;
  aantalGroepen?: number;
};

export type BevSessie = {
  workshopNaam: string;
  aanwezigVanaf?: string | null;
  afbouwTot?: string | null;
  klantBenodigdheden?: string | null;
  voorbeeldLink?: string | null;
  rondes: BevRonde[];
};

export type BevInvoer = {
  aanhef?: string | null;
  klantNaam: string;
  datumTekst: string;
  locatieNaam?: string | null;
  adresregels?: string[];
  contactNaam?: string | null;
  contactTelefoon?: string | null;
  aantalPersonenTekst?: string | null;
  eigenTelefoon?: string;
  afzender?: string;
  afzenderFunctie?: string;
  sessies: BevSessie[];
};

export type Tijdschema = { afdeling: string | null; regels: string[] };

const STANDAARD_TELEFOON = "085-0653923";
const AFBOUW_MINUTEN = 15;
const VOORBEREIDING_MINUTEN = 30;

/* ---------------- tijd rekenen ---------------- */

export function naarMinuten(tijd: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(tijd.trim());
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function naarTijd(minuten: number): string {
  const m = ((minuten % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function u(tijd: string) {
  return `${tijd}u`;
}

function opsomming(namen: string[]): string {
  if (namen.length === 0) return "";
  if (namen.length === 1) return namen[0];
  return `${namen.slice(0, -1).join(", ")} en ${namen[namen.length - 1]}`;
}

function meervoud(aantal: number) {
  return aantal === 1 ? "workshopdocent" : "workshopdocenten";
}

/* ---------------- tijdschema ---------------- */

/** Alle afdelingen die in de rondes voorkomen. Zonder afdeling geeft [null]. */
export function afdelingen(sessies: BevSessie[]): (string | null)[] {
  const gevonden: (string | null)[] = [];
  for (const s of sessies) {
    for (const r of s.rondes) {
      const a = r.afdeling?.trim() || null;
      if (!gevonden.some((x) => x === a)) gevonden.push(a);
    }
  }
  if (gevonden.length === 0) return [null];
  // Zonder afdeling naar achteren, de rest op naam
  return gevonden.sort((a, b) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)));
}

/**
 * Bouwt de regels van het tijdschema voor één afdeling.
 * Aankomst, voorbereiding, rondes met parallelle groepen, pauzes en afbouw.
 */
export function bouwTijdschema(sessies: BevSessie[], afdeling: string | null = null): string[] {
  // Alleen sessies en rondes die bij deze afdeling horen
  const deel = sessies
    .map((s) => ({
      ...s,
      rondes: s.rondes
        .filter((r) => (r.afdeling?.trim() || null) === afdeling)
        .sort((a, b) => a.nummer - b.nummer || naarMinuten(a.startTijd) - naarMinuten(b.startTijd)),
    }))
    .filter((s) => s.rondes.length > 0);

  if (deel.length === 0) return [];

  const regels: string[] = [];

  // Rondes samenvoegen op starttijd. Binnen een afdeling tellen we opnieuw vanaf 1,
  // zodat elke afdeling zijn eigen ronde 1 heeft.
  const starttijden = [...new Set(deel.flatMap((s) => s.rondes.map((r) => naarMinuten(r.startTijd))))].sort((a, b) => a - b);
  const rondeBlokken = starttijden.map((start, index) => {
    const items = deel
      .map((s) => ({ naam: s.workshopNaam, rondes: s.rondes.filter((r) => naarMinuten(r.startTijd) === start) }))
      .filter((x) => x.rondes.length > 0);
    const eind = Math.max(...items.flatMap((x) => x.rondes.map((r) => naarMinuten(r.eindTijd))));
    const delen = items.map((x) => {
      const groepen = x.rondes.reduce((n, r) => n + Math.max(1, r.aantalGroepen ?? 1), 0);
      return `${groepen}x ${x.naam}`;
    });
    return { nummer: index + 1, start, eind, delen };
  });

  const eersteStart = Math.min(...rondeBlokken.map((b) => b.start));

  // Aankomst en voorbereiding, gegroepeerd op aankomsttijd
  const aankomsten = new Map<number, string[]>();
  for (const s of deel) {
    const eigenStart = Math.min(...s.rondes.map((r) => naarMinuten(r.startTijd)));
    const tijd = s.aanwezigVanaf ? naarMinuten(s.aanwezigVanaf) : eigenStart - VOORBEREIDING_MINUTEN;
    aankomsten.set(tijd, [...(aankomsten.get(tijd) ?? []), s.workshopNaam]);
  }
  const aankomstTijden = [...aankomsten.keys()].sort((a, b) => a - b);
  const meerdereAankomsten = aankomstTijden.length > 1;

  for (const tijd of aankomstTijden) {
    const namen = aankomsten.get(tijd)!;
    const achtervoegsel = meerdereAankomsten ? ` ${opsomming(namen)}` : "";
    // De voorbereiding loopt tot de eerste ronde waar deze docenten in zitten
    const hunEerste = Math.min(
      ...deel.filter((s) => namen.includes(s.workshopNaam)).flatMap((s) => s.rondes.map((r) => naarMinuten(r.startTijd)))
    );
    regels.push(`${u(naarTijd(tijd))} Aankomst ${meervoud(namen.length > 1 ? 2 : 1)}${achtervoegsel}`);
    if (hunEerste > tijd) {
      regels.push(
        `${u(naarTijd(tijd))}-${u(naarTijd(hunEerste))} Voorbereiding workshopruimte${namen.length > 1 ? "s" : ""}${achtervoegsel}`
      );
    }
  }
  void eersteStart;

  // Rondes en pauzes
  rondeBlokken.forEach((b, i) => {
    regels.push(`${u(naarTijd(b.start))}-${u(naarTijd(b.eind))} Workshopronde ${b.nummer} (${b.delen.join(", ")})`);
    const volgende = rondeBlokken[i + 1];
    if (volgende && volgende.start - b.eind >= 5) {
      regels.push(`${u(naarTijd(b.eind))}-${u(naarTijd(volgende.start))} Pauze`);
    }
  });

  // Afbouw en vertrek, gegroepeerd op eindtijd
  const vertrek = new Map<number, string[]>();
  for (const s of deel) {
    const eigenEind = Math.max(...s.rondes.map((r) => naarMinuten(r.eindTijd)));
    vertrek.set(eigenEind, [...(vertrek.get(eigenEind) ?? []), s.workshopNaam]);
  }
  const vertrekTijden = [...vertrek.keys()].sort((a, b) => a - b);
  const meerdereVertrekken = vertrekTijden.length > 1;

  for (const tijd of vertrekTijden) {
    const namen = vertrek.get(tijd)!;
    const achtervoegsel = meerdereVertrekken ? ` ${opsomming(namen)}` : "";
    const tot = deel
      .filter((s) => namen.includes(s.workshopNaam))
      .map((s) => (s.afbouwTot ? naarMinuten(s.afbouwTot) : tijd + AFBOUW_MINUTEN))
      .reduce((a, b) => Math.max(a, b), tijd + AFBOUW_MINUTEN);
    regels.push(`${u(naarTijd(tijd))}-${u(naarTijd(tot))} Afbouw / vertrek ${meervoud(namen.length > 1 ? 2 : 1)}${achtervoegsel}`);
  }

  return regels;
}

/** Tijdschema per afdeling. Zonder afdelingen krijg je één blok met afdeling null. */
export function bouwAlleTijdschemas(sessies: BevSessie[]): Tijdschema[] {
  return afdelingen(sessies)
    .map((a) => ({ afdeling: a, regels: bouwTijdschema(sessies, a) }))
    .filter((t) => t.regels.length > 0);
}

/* ---------------- bevestigingstekst ---------------- */

/** Hoogste aantal rondes over alle workshops heen. */
export function aantalRondes(sessies: BevSessie[]): number {
  const perAfdeling = afdelingen(sessies).map((a) => {
    const starts = sessies.flatMap((s) =>
      s.rondes.filter((r) => (r.afdeling?.trim() || null) === a).map((r) => r.startTijd)
    );
    return new Set(starts).size;
  });
  return perAfdeling.length === 0 ? 0 : Math.max(...perAfdeling);
}

/** Eerste starttijd van de dag. */
export function eersteTijdstip(sessies: BevSessie[]): string {
  const starts = sessies.flatMap((s) => s.rondes.map((r) => naarMinuten(r.startTijd)));
  return starts.length === 0 ? "" : naarTijd(Math.min(...starts));
}

export function bouwBevestiging(invoer: BevInvoer): string {
  const {
    aanhef,
    klantNaam,
    datumTekst,
    locatieNaam,
    adresregels = [],
    contactNaam,
    contactTelefoon,
    aantalPersonenTekst,
    eigenTelefoon = STANDAARD_TELEFOON,
    afzender = "",
    afzenderFunctie = "Skool Workshop",
    sessies,
  } = invoer;

  const namen = sessies.map((s) => s.workshopNaam);
  const r: string[] = [];

  r.push(`Beste ${aanhef?.trim() || contactNaam?.split(" ")[0] || "relatie"},`);
  r.push("");
  r.push(
    `Bedankt voor je akkoord! Hierbij bevestigen wij de details van de door jou geboekte workshops op ${datumTekst} bij ${klantNaam}. Hieronder vind je een overzicht van de planning en afspraken:`
  );
  r.push("");
  r.push(`Naam workshop(s): ${namen.join(", ")}`);
  const tijdstip = eersteTijdstip(sessies);
  if (tijdstip) r.push(`Tijdstip workshop: ${tijdstip} uur`);
  const rondes = aantalRondes(sessies);
  if (rondes > 0) r.push(`Aantal workshoprondes: ${rondes}`);
  if (aantalPersonenTekst) r.push(`Aantal personen: ${aantalPersonenTekst}`);
  r.push("");

  r.push("Locatie");
  if (locatieNaam) r.push(locatieNaam);
  for (const regel of adresregels.filter(Boolean)) r.push(regel);
  r.push("");

  r.push("Contact");
  if (contactNaam) r.push(`Opdrachtgever: ${[contactNaam, contactTelefoon].filter(Boolean).join(", ")}`);
  r.push(`Skool Workshop: ${eigenTelefoon}`);
  r.push("");

  for (const schema of bouwAlleTijdschemas(sessies)) {
    r.push(schema.afdeling ? `Tijdschema ${schema.afdeling}` : "Tijdschema");
    for (const regel of schema.regels) r.push(regel);
    r.push("");
  }

  const metBenodigdheden = sessies.filter((s) => s.klantBenodigdheden?.trim());
  for (const s of metBenodigdheden) {
    r.push(metBenodigdheden.length > 1 ? `Benodigdheden ${s.workshopNaam}` : "Benodigdheden");
    r.push(s.klantBenodigdheden!.trim());
    if (s.voorbeeldLink?.trim()) r.push(`Klik hier voor een voorbeeld: ${s.voorbeeldLink.trim()}`);
    r.push("");
  }

  r.push("Financiën");
  r.push("De factuur wordt zeven dagen voor aanvang van de workshop verstuurd.");
  r.push("");
  r.push("Graag ontvang ik nog een bevestiging terug. Ik vertrouw erop jou hiermee voldoende te hebben geïnformeerd.");
  r.push("");
  r.push("Met vriendelijke groet,");
  if (afzender) {
    r.push(afzender);
    r.push(afzenderFunctie);
  }

  return r.join("\n");
}

/** Korte samenvatting voor bovenaan de opdracht, bijvoorbeeld "4 workshops, 4 rondes". */
export function samenvatting(sessies: BevSessie[]): string {
  const groepen = sessies.flatMap((s) => s.rondes).reduce((n, r) => n + Math.max(1, r.aantalGroepen ?? 1), 0);
  const delen = [
    `${sessies.length} ${sessies.length === 1 ? "workshop" : "workshops"}`,
    `${aantalRondes(sessies)} ${aantalRondes(sessies) === 1 ? "ronde" : "rondes"}`,
    `${groepen} ${groepen === 1 ? "groep" : "groepen"}`,
  ];
  return delen.join(", ");
}
