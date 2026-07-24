/**
 * Berekent wat een workshopdocent krijgt voor een opdracht.
 *
 * Losse module zonder database, zodat de rekenregels te testen zijn.
 * De tarieven zelf staan in de instellingen en zijn dus aan te passen.
 */

export type Tarieven = {
  /** Uurtarief van de workshopdocent in euro. */
  uurtarief: number;
  /** Minimale vergoeding per dag, ongeacht het aantal uren. */
  minimumPerDag: number;
  /** Vergoeding per kilometer, enkele reis. Wordt maal twee gerekend. */
  kmTarief: number;
  /** Vanaf hoeveel minuten enkele reis er reistijd wordt vergoed. */
  reistijdDrempelMinuten: number;
  /** Welk deel van het uurtarief geldt als reistijdvergoeding. */
  reistijdDeel: number;
  /** Richtbedrag per kilometer voor het openbaar vervoer. */
  ovTariefPerKm: number;
};

/** Wat de klant betaalt. Los van wat de workshopdocent krijgt. */
export type Verkooptarieven = {
  starttarief: number;
  extraDeelnemer: number;
  kmTariefKlant: number;
  maxDeelnemers: number;
};

export const STANDAARD_VERKOOP: Verkooptarieven = {
  starttarief: 45,
  extraDeelnemer: 7.5,
  kmTariefKlant: 0.38,
  maxDeelnemers: 25,
};

/**
 * Wat een opdracht de klant kost.
 * Starttarief eenmalig, daarna per workshopronde de verkoopprijs naar rato van de duur.
 */
export function opdrachtPrijs(
  regels: { verkoopprijs60: number; duurMinuten: number; rondes: number; deelnemers: number }[],
  v: Verkooptarieven = STANDAARD_VERKOOP
): { workshops: number; extra: number; start: number; totaal: number } {
  let workshops = 0;
  let extra = 0;
  for (const r of regels) {
    workshops += (r.verkoopprijs60 / 60) * r.duurMinuten * r.rondes;
    extra += Math.max(0, r.deelnemers - v.maxDeelnemers) * v.extraDeelnemer;
  }
  const start = regels.length > 0 ? v.starttarief : 0;
  const rond = (n: number) => Math.round(n * 100) / 100;
  return { workshops: rond(workshops), extra: rond(extra), start, totaal: rond(workshops + extra + start) };
}

export const STANDAARD_TARIEVEN: Tarieven = {
  uurtarief: 45,
  minimumPerDag: 100,
  kmTarief: 0.25,
  reistijdDrempelMinuten: 90,
  reistijdDeel: 0.5,
  ovTariefPerKm: 0.2,
};

function rond(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Reiskosten voor een hele dag.
 * De opgegeven afstand is enkele reis, dus we rekenen heen en terug.
 */
export function reiskosten(kmEnkeleReis: number | null, t: Tarieven = STANDAARD_TARIEVEN): number {
  if (!kmEnkeleReis || kmEnkeleReis <= 0) return 0;
  return rond(kmEnkeleReis * t.kmTarief * 2);
}

/**
 * Reistijdvergoeding. Alleen als de enkele reis langer duurt dan de drempel.
 * De workshopdocent krijgt dan de helft van het uurtarief, voor heen en terug.
 */
export function reistijdVergoeding(reistijdMinutenEnkeleReis: number | null, t: Tarieven = STANDAARD_TARIEVEN): number {
  if (!reistijdMinutenEnkeleReis || reistijdMinutenEnkeleReis <= t.reistijdDrempelMinuten) return 0;
  const uurEnkeleReis = reistijdMinutenEnkeleReis / 60;
  return rond(t.uurtarief * t.reistijdDeel * uurEnkeleReis * 2);
}

/** Vergoeding voor de gewerkte uren, met het dagminimum eroverheen. */
export function urenVergoeding(uren: number, t: Tarieven = STANDAARD_TARIEVEN): number {
  const berekend = rond(Math.max(0, uren) * t.uurtarief);
  return Math.max(berekend, t.minimumPerDag);
}

export type Vergoeding = {
  uren: number;
  uurVergoeding: number;
  minimumToegepast: boolean;
  kilometers: number;
  reiskosten: number;
  reistijdMinuten: number;
  reistijdVergoeding: number;
  parkeerkosten: number;
  totaal: number;
};

/** Alles bij elkaar voor één werkdag. */
export function berekenVergoeding(
  invoer: { uren: number; kilometers?: number | null; reistijdMinuten?: number | null; parkeerkosten?: number },
  t: Tarieven = STANDAARD_TARIEVEN
): Vergoeding {
  const uren = Math.max(0, invoer.uren);
  const berekendeUren = rond(uren * t.uurtarief);
  const uurVergoeding = Math.max(berekendeUren, t.minimumPerDag);
  const km = invoer.kilometers ?? 0;
  const reis = reiskosten(km, t);
  const reistijd = invoer.reistijdMinuten ?? 0;
  const reistijdGeld = reistijdVergoeding(reistijd, t);
  const parkeer = invoer.parkeerkosten ?? 0;

  return {
    uren,
    uurVergoeding,
    minimumToegepast: berekendeUren < t.minimumPerDag,
    kilometers: km,
    reiskosten: reis,
    reistijdMinuten: reistijd,
    reistijdVergoeding: reistijdGeld,
    parkeerkosten: parkeer,
    totaal: rond(uurVergoeding + reis + reistijdGeld + parkeer),
  };
}

/**
 * Mag deze opdracht aan deze workshopdocent worden getoond?
 * Staat de afstand boven zijn maximale reisafstand, dan niet.
 */
export function binnenReisafstand(kmEnkeleReis: number | null, maxReisAfstand: number | null | undefined): boolean {
  if (!maxReisAfstand || maxReisAfstand <= 0) return true;
  if (kmEnkeleReis === null) return true; // afstand onbekend, niet verbergen
  return kmEnkeleReis <= maxReisAfstand;
}

/** Korte uitleg van de opbouw, voor op het scherm van de workshopdocent. */
export function uitlegVergoeding(v: Vergoeding, t: Tarieven = STANDAARD_TARIEVEN): string[] {
  const regels: string[] = [];
  regels.push(
    v.minimumToegepast
      ? `Dagminimum van € ${t.minimumPerDag.toFixed(2)} toegepast, gewerkte uren waren € ${rond(v.uren * t.uurtarief).toFixed(2)}`
      : `${v.uren} uur maal € ${t.uurtarief.toFixed(2)} is € ${v.uurVergoeding.toFixed(2)}`
  );
  if (v.reiskosten > 0) {
    regels.push(`${v.kilometers} km heen en terug maal € ${t.kmTarief.toFixed(2)} is € ${v.reiskosten.toFixed(2)}`);
  }
  if (v.reistijdVergoeding > 0) {
    regels.push(
      `Reistijd boven ${Math.round(t.reistijdDrempelMinuten / 60 * 10) / 10} uur, vergoed tegen het halve uurtarief heen en terug: € ${v.reistijdVergoeding.toFixed(2)}`
    );
  }
  if (v.parkeerkosten > 0) regels.push(`Parkeerkosten € ${v.parkeerkosten.toFixed(2)}`);
  return regels;
}

/* ---------------- vergoeding voor één opdracht ---------------- */

export type OpdrachtInvoer = {
  /** Tijd waarop de workshopdocent aanwezig moet zijn. Alleen ter informatie, niet betaald. */
  aanwezigVanaf?: string | null;
  /** Begin van de workshop. Vanaf hier telt de tijd mee. */
  startTijd: string;
  /** Einde van de workshop. Tot hier telt de tijd mee. */
  eindTijd: string;
  /** Tijd waarop hij na afbouw kan vertrekken. Alleen ter informatie, niet betaald. */
  afbouwTot?: string | null;
  /** Enkele reis in kilometers, van huisadres naar locatie. */
  kilometers?: number | null;
  /** Enkele reis in minuten. */
  reistijdMinuten?: number | null;
};

export type OpdrachtVergoeding = {
  /** Begin van de betaalde workshoptijd. */
  vanTijd: string;
  /** Einde van de betaalde workshoptijd. */
  totTijd: string;
  /** Wanneer hij aanwezig moet zijn, ter informatie. */
  aanwezigVanaf: string | null;
  /** Wanneer hij kan vertrekken, ter informatie. */
  afbouwTot: string | null;
  uren: number;
  werk: number;
  minimumToegepast: boolean;
  kilometers: number;
  reiskosten: number;
  reistijdMinuten: number;
  reistijdVergoeding: number;
  reisTotaal: number;
  totaal: number;
  uitleg: { werk: string; reis: string[] };
};

function naarMin(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

/**
 * Wat een workshopdocent verdient aan één opdrachtdag.
 *
 * De betaalde tijd is de duur van de workshop zelf, van starttijd tot eindtijd.
 * Aankomen, voorbereiden en opruimen tellen niet mee als betaalde uren.
 * Komt het bedrag onder het dagminimum uit, dan geldt het dagminimum.
 *
 * Reiskosten en reistijd staan er los van, zodat je ziet wat hij aan de
 * workshop verdient en wat aan het reizen.
 */
export function vergoedingVoorOpdracht(
  invoer: OpdrachtInvoer,
  t: Tarieven = STANDAARD_TARIEVEN
): OpdrachtVergoeding {
  // Alleen de workshop zelf is betaalde tijd
  const van = invoer.startTijd;
  const tot = invoer.eindTijd;
  const minuten = Math.max(0, naarMin(tot) - naarMin(van));
  const uren = Math.round((minuten / 60) * 100) / 100;

  const berekend = Math.round(uren * t.uurtarief * 100) / 100;
  const werk = Math.max(berekend, t.minimumPerDag);
  const minimumToegepast = berekend < t.minimumPerDag;

  const km = invoer.kilometers ?? 0;
  const reis = reiskosten(km, t);
  const reistijd = invoer.reistijdMinuten ?? 0;
  const reistijdGeld = reistijdVergoeding(reistijd, t);
  const reisTotaal = Math.round((reis + reistijdGeld) * 100) / 100;

  const reisUitleg: string[] = [];
  if (reis > 0) {
    reisUitleg.push(`${km} km heen en ${km} km terug, maal € ${t.kmTarief.toFixed(2)} per km`);
  }
  if (reistijdGeld > 0) {
    const uurEnkel = Math.round((reistijd / 60) * 10) / 10;
    reisUitleg.push(
      `${uurEnkel} uur rijden per kant, dat is meer dan ${Math.round((t.reistijdDrempelMinuten / 60) * 10) / 10} uur, ` +
        `dus heen en terug vergoed tegen € ${(t.uurtarief * t.reistijdDeel).toFixed(2)} per uur`
    );
  }
  if (reisUitleg.length === 0) reisUitleg.push("Geen reisvergoeding, de afstand is niet bekend");

  return {
    vanTijd: van,
    totTijd: tot,
    aanwezigVanaf: invoer.aanwezigVanaf?.trim() || null,
    afbouwTot: invoer.afbouwTot?.trim() || null,
    uren,
    werk,
    minimumToegepast,
    kilometers: km,
    reiskosten: reis,
    reistijdMinuten: reistijd,
    reistijdVergoeding: reistijdGeld,
    reisTotaal,
    totaal: Math.round((werk + reisTotaal) * 100) / 100,
    uitleg: {
      werk: minimumToegepast
        ? `${uren} uur workshop maal € ${t.uurtarief.toFixed(2)} is € ${berekend.toFixed(2)}, aangevuld tot het dagminimum van € ${t.minimumPerDag.toFixed(2)}`
        : `${uren} uur workshop, van ${van} tot ${tot}, maal € ${t.uurtarief.toFixed(2)} per uur`,
      reis: reisUitleg,
    },
  };
}

/* ---------------- reizen met het openbaar vervoer ---------------- */

/**
 * Richtbedrag per kilometer voor het openbaar vervoer.
 * Ongeveer het NS-tarief tweede klas. Aanpasbaar onder Instellingen.
 */
export const OV_TARIEF_PER_KM = 0.2;

/**
 * Schatting van de OV-kosten voor een retour.
 *
 * Let op: dit is een richtbedrag, geen echte prijs. 9292 en de NS hebben geen
 * gratis koppeling waar we de exacte prijs uit kunnen halen. De workshopdocent
 * declareert daarom achteraf wat hij echt betaald heeft. Deze schatting is er
 * om vooraf een idee te geven en om jouw begroting te kunnen maken.
 */
export function ovSchatting(kmEnkeleReis: number | null, tariefPerKm = OV_TARIEF_PER_KM): number {
  if (!kmEnkeleReis || kmEnkeleReis <= 0) return 0;
  return Math.round(kmEnkeleReis * tariefPerKm * 2 * 100) / 100;
}

export type ReisOptie = {
  vervoer: "AUTO" | "OV";
  label: string;
  bedrag: number;
  regels: string[];
};

/**
 * De reisopties naast elkaar, zodat een workshopdocent zelf kan kiezen.
 * Ook iemand met een auto mag het openbaar vervoer pakken.
 */
export function reisOpties(
  invoer: { kilometers?: number | null; reistijdMinuten?: number | null },
  t: Tarieven = STANDAARD_TARIEVEN
): ReisOptie[] {
  const km = invoer.kilometers ?? 0;
  const reistijd = invoer.reistijdMinuten ?? 0;
  if (km <= 0) return [];

  const autoKm = reiskosten(km, t);
  const autoTijd = reistijdVergoeding(reistijd, t);
  const autoRegels = [`${km} km heen en ${km} km terug, maal € ${t.kmTarief.toFixed(2)} per km`];
  if (autoTijd > 0) {
    autoRegels.push(
      `Reistijd boven ${Math.round((t.reistijdDrempelMinuten / 60) * 10) / 10} uur, vergoed tegen € ${(t.uurtarief * t.reistijdDeel).toFixed(2)} per uur`
    );
  }

  const ov = ovSchatting(km, t.ovTariefPerKm);
  const ovRegels = [
    `Richtbedrag voor een retour van ongeveer ${km} km`,
    "Je declareert achteraf wat je echt betaald hebt",
  ];
  if (autoTijd > 0) ovRegels.push("Reistijdvergoeding geldt ook als je met het OV gaat");

  return [
    { vervoer: "AUTO", label: "Met de auto", bedrag: Math.round((autoKm + autoTijd) * 100) / 100, regels: autoRegels },
    { vervoer: "OV", label: "Met het openbaar vervoer", bedrag: Math.round((ov + autoTijd) * 100) / 100, regels: ovRegels },
  ];
}

/**
 * Bouwt een link naar 9292 zodat de workshopdocent in één klik de echte
 * reistijd en prijs ziet. We geven vertrekpunt, bestemming en aankomsttijd mee.
 */
export function ovLink(opties: {
  vanPostcode?: string | null;
  vanPlaats?: string | null;
  naarPostcode?: string | null;
  naarPlaats?: string | null;
  datum?: Date | null;
  aankomstTijd?: string | null;
}): string | null {
  const van = [opties.vanPostcode, opties.vanPlaats].filter(Boolean).join(" ").trim();
  const naar = [opties.naarPostcode, opties.naarPlaats].filter(Boolean).join(" ").trim();
  if (!van || !naar) return null;

  const p = new URLSearchParams({ van, naar });
  if (opties.datum) {
    const d = opties.datum;
    p.set("datum", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  if (opties.aankomstTijd) {
    p.set("tijd", opties.aankomstTijd);
    p.set("aankomst", "1");
  }
  return `https://9292.nl/?${p.toString()}`;
}
