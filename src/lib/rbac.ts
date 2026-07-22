import type { Role } from "@prisma/client";

export const BEHEER: Role[] = ["SUPERBEHEERDER", "PLANNER", "FINANCIEEL", "LEZER"];
export const PLANNEN: Role[] = ["SUPERBEHEERDER", "PLANNER"];
export const FINANCIEEL: Role[] = ["SUPERBEHEERDER", "FINANCIEEL"];

/** Bankgegevens en identiteitsdocumenten zijn alleen zichtbaar voor deze rollen. */
export function magGevoeligeGegevens(role: Role) {
  return role === "SUPERBEHEERDER" || role === "FINANCIEEL";
}

export function magWijzigen(role: Role) {
  return role !== "LEZER" && role !== "DOCENT";
}

export function isBeheer(role: Role) {
  return BEHEER.includes(role);
}

export const ROL_LABEL: Record<Role, string> = {
  SUPERBEHEERDER: "Superbeheerder",
  PLANNER: "Planner",
  FINANCIEEL: "Financiële administratie",
  DOCENT: "Workshopdocent",
  LEZER: "Alleen lezen",
};
