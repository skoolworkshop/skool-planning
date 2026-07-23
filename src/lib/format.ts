export const TZ = "Europe/Amsterdam";

export function euro(v: unknown): string {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

export function datum(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).format(date);
}

export function datumLang(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(date);
}

export function datumTijd(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ,
  }).format(date);
}

export function label(s: string | null | undefined): string {
  if (!s) return "";
  const t = s.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Minuten tussen twee "HH:MM" strings. */
export function minutenTussen(start: string, eind: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = eind.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function urenTussen(start: string, eind: string): number {
  return Math.round((minutenTussen(start, eind) / 60) * 100) / 100;
}

/** Grove afstandsschatting in kilometers over de weg. */
export function afstandKm(a?: { lat?: number | null; lng?: number | null }, b?: { lat?: number | null; lng?: number | null }): number | null {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const hemelsbreed = 2 * R * Math.asin(Math.sqrt(h));
  return Math.round(hemelsbreed * 1.3);
}

export function reistijdMin(km: number | null): number | null {
  if (km === null) return null;
  return Math.round((km / 60) * 60 + 8);
}
