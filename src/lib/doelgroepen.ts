/**
 * Centrale doelgroeplijst. Overal dezelfde waarden, geen vrije tekst meer.
 * Deze lijst is de enige bron. Maak nergens anders een eigen lijstje.
 */
import type { Doelgroep } from "@prisma/client";

export const DOELGROEPEN: { waarde: Doelgroep; label: string }[] = [
  { waarde: "PRIMAIR_ONDERWIJS", label: "Primair onderwijs" },
  { waarde: "VOORTGEZET_ONDERWIJS", label: "Voortgezet onderwijs" },
  { waarde: "SPECIAAL_ONDERWIJS", label: "Speciaal onderwijs" },
  { waarde: "MBO", label: "MBO" },
  { waarde: "HBO", label: "HBO" },
  { waarde: "UNIVERSITEIT", label: "Universiteit" },
  { waarde: "BUITENSCHOOLSE_OPVANG", label: "Buitenschoolse opvang" },
  { waarde: "KINDEROPVANG", label: "Kinderopvang" },
  { waarde: "BIBLIOTHEEK", label: "Bibliotheek" },
  { waarde: "JEUGDINSTELLING", label: "Jeugdinstelling" },
  { waarde: "ZORGINSTELLING", label: "Zorginstelling" },
  { waarde: "GEMEENTE", label: "Gemeente" },
  { waarde: "BEDRIJF", label: "Bedrijf" },
  { waarde: "PARTICULIER", label: "Particulier" },
  { waarde: "VOLWASSENEN", label: "Volwassenen" },
  { waarde: "SENIOREN", label: "Senioren" },
  { waarde: "OVERIG", label: "Overig" },
];

const LABELS = new Map(DOELGROEPEN.map((d) => [d.waarde, d.label]));

export function doelgroepLabel(waarde: Doelgroep | null | undefined): string {
  if (!waarde) return "";
  return LABELS.get(waarde) ?? waarde;
}

export function doelgroepenLabel(waarden: Doelgroep[] | null | undefined): string {
  if (!waarden || waarden.length === 0) return "";
  return waarden.map(doelgroepLabel).join(", ");
}

export function isDoelgroep(waarde: string): waarde is Doelgroep {
  return DOELGROEPEN.some((d) => d.waarde === waarde);
}

/** Woorden die op een doelgroep wijzen, voor het omzetten van oude vrije tekst. */
const HERKENNING: { patroon: RegExp; waarde: Doelgroep }[] = [
  { patroon: /\bbso\b|buitenschools|naschools/i, waarde: "BUITENSCHOOLSE_OPVANG" },
  { patroon: /speciaal onderwijs|\bsbo\b|\bvso\b|\bso\b/i, waarde: "SPECIAAL_ONDERWIJS" },
  { patroon: /\bpo\b|basisschool|basisonderwijs|primair|onderbouw|bovenbouw|groep\s?\d/i, waarde: "PRIMAIR_ONDERWIJS" },
  { patroon: /\bvo\b|voortgezet|vmbo|havo|vwo|middelbare|brugklas|mavo|gymnasium/i, waarde: "VOORTGEZET_ONDERWIJS" },
  { patroon: /\bmbo\b|roc\b/i, waarde: "MBO" },
  { patroon: /\bhbo\b|hogeschool/i, waarde: "HBO" },
  { patroon: /universiteit|\bwo\b|academi/i, waarde: "UNIVERSITEIT" },
  { patroon: /kinderopvang|kdv\b|peuter|cr[eè]che/i, waarde: "KINDEROPVANG" },
  { patroon: /bibliotheek|biblio/i, waarde: "BIBLIOTHEEK" },
  { patroon: /jeugdinstelling|jeugdzorg|jongerenwerk/i, waarde: "JEUGDINSTELLING" },
  { patroon: /zorginstelling|verpleeg|zorgcentrum|revalidat/i, waarde: "ZORGINSTELLING" },
  { patroon: /gemeente|wijkcentrum|buurthuis/i, waarde: "GEMEENTE" },
  { patroon: /bedrijf|zakelijk|teamuitje|personeel|corporate/i, waarde: "BEDRIJF" },
  { patroon: /particulier|kinderfeest|vrijgezel|priv[eé]/i, waarde: "PARTICULIER" },
  { patroon: /senior|oudere|55\+|65\+/i, waarde: "SENIOREN" },
  { patroon: /volwassen/i, waarde: "VOLWASSENEN" },
];

/**
 * Zet oude vrije tekst om naar een vaste doelgroep.
 * Lukt dat niet betrouwbaar, dan komt er null uit en moet een beheerder kijken.
 */
export function herkenDoelgroep(tekst: string | null | undefined): Doelgroep | null {
  if (!tekst) return null;
  const schoon = tekst.trim();
  if (schoon === "") return null;
  if (isDoelgroep(schoon)) return schoon;

  const exact = DOELGROEPEN.find((d) => d.label.toLowerCase() === schoon.toLowerCase());
  if (exact) return exact.waarde;

  for (const h of HERKENNING) {
    if (h.patroon.test(schoon)) return h.waarde;
  }
  return null;
}

/** Zet een lijst oude waarden om. Wat niet lukt komt in onbekend terecht. */
export function herkenDoelgroepen(waarden: (string | null | undefined)[]): {
  herkend: Doelgroep[];
  onbekend: string[];
} {
  const herkend: Doelgroep[] = [];
  const onbekend: string[] = [];
  for (const w of waarden) {
    const d = herkenDoelgroep(w);
    if (d) {
      if (!herkend.includes(d)) herkend.push(d);
    } else if (w && w.trim() !== "") {
      onbekend.push(w.trim());
    }
  }
  return { herkend, onbekend };
}
