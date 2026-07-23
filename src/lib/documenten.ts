/**
 * Regels rond documenten van workshopdocenten.
 *
 * Belangrijk: een VOG heeft binnen dit systeem geen verloopdatum.
 * Alle plekken die naar verlopen documenten kijken gebruiken deze module,
 * zodat de regel maar op één plek staat.
 */
import type { DocType, DocStatus } from "@prisma/client";

export type DocLite = { type: DocType; status: DocStatus; vervaldatum?: Date | null };

/** Documenttypen die wél een verloopdatum kennen. */
export const VERLOOPT: DocType[] = ["IDENTITEITSBEWIJS", "RIJBEWIJS", "CERTIFICAAT", "CONTRACT"];

/** Een VOG verloopt nooit. */
export function kentVervaldatum(type: DocType): boolean {
  return VERLOOPT.includes(type);
}

/** Is dit document verlopen op de peildatum? Een VOG nooit. */
export function isVerlopen(doc: DocLite, peildatum: Date = new Date()): boolean {
  if (!kentVervaldatum(doc.type)) return false;
  return Boolean(doc.vervaldatum && doc.vervaldatum < peildatum);
}

/** Is dit document bruikbaar voor een opdracht op deze datum? */
export function isGeldig(doc: DocLite | undefined | null, peildatum: Date = new Date()): boolean {
  if (!doc) return false;
  if (doc.status !== "GOEDGEKEURD") return false;
  return !isVerlopen(doc, peildatum);
}

/** De status om te tonen. Voor een VOG negeren we een oude vervaldatum. */
export function toonStatus(doc: DocLite, peildatum: Date = new Date()): DocStatus {
  return isVerlopen(doc, peildatum) ? "VERLOPEN" : doc.status;
}

/** Alle vereiste documenten die ontbreken of niet geldig zijn. */
export function ontbrekendeDocumenten(vereist: DocType[], documenten: DocLite[], peildatum: Date = new Date()): DocType[] {
  return vereist.filter((type) => !isGeldig(documenten.find((d) => d.type === type), peildatum));
}
