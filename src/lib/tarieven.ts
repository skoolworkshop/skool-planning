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
