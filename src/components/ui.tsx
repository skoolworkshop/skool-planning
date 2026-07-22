import Link from "next/link";
import type { ReactNode } from "react";

export function Kaart({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`kaart p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function PaginaKop({
  titel,
  sub,
  actie,
}: {
  titel: string;
  sub?: string;
  actie?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{titel}</h1>
        {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
      </div>
      {actie}
    </div>
  );
}

const KLEUREN: Record<string, string> = {
  grijs: "bg-neutral-100 text-neutral-700",
  oranje: "bg-skool-100 text-skool-800",
  groen: "bg-emerald-100 text-emerald-800",
  rood: "bg-red-100 text-red-700",
  blauw: "bg-sky-100 text-sky-800",
  paars: "bg-violet-100 text-violet-800",
  geel: "bg-amber-100 text-amber-800",
};

export function Badge({ kleur = "grijs", children }: { kleur?: keyof typeof KLEUREN; children: ReactNode }) {
  return <span className={`badge ${KLEUREN[kleur] ?? KLEUREN.grijs}`}>{children}</span>;
}

/** Statuskleuren centraal, zodat het hele systeem dezelfde taal spreekt. */
export function statusKleur(status: string): keyof typeof KLEUREN {
  const map: Record<string, keyof typeof KLEUREN> = {
    CONCEPT: "grijs",
    NIET_GEPUBLICEERD: "grijs",
    OPTIE: "geel",
    BEVESTIGD: "blauw",
    PLANNING_GESTART: "blauw",
    DOCENTEN_GEZOCHT: "oranje",
    AANMELDINGEN_ONTVANGEN: "oranje",
    GEDEELTELIJK_BEZET: "geel",
    VOLLEDIG_BEZET: "groen",
    UITGEVOERD: "groen",
    GEANNULEERD: "rood",
    FINANCIEEL_AFGEROND: "paars",
    GEARCHIVEERD: "grijs",
    GOEDGEKEURD: "groen",
    TER_BEOORDELING: "geel",
    AANVULLING_NODIG: "oranje",
    UITGENODIGD: "blauw",
    REGISTRATIE_GESTART: "blauw",
    GEBLOKKEERD: "rood",
    AFGEWEZEN: "rood",
    INACTIEF: "grijs",
    AANGEMELD: "blauw",
    IN_BEHANDELING: "geel",
    RESERVELIJST: "paars",
    GESELECTEERD: "groen",
    GEWEIGERD: "rood",
    INGETROKKEN: "grijs",
    VERLOPEN: "rood",
    INGEDIEND: "blauw",
    CONTROLE_NODIG: "geel",
    KLAAR_VOOR_BETALING: "paars",
    BETAALD: "groen",
    NIET_AANGELEVERD: "grijs",
    AANGELEVERD: "blauw",
  };
  return map[status] ?? "grijs";
}

export function Leeg({ titel, tekst, actie }: { titel: string; tekst: string; actie?: ReactNode }) {
  return (
    <div className="kaart flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-skool-50 text-2xl">📋</div>
      <h3 className="font-semibold">{titel}</h3>
      <p className="max-w-md text-sm text-neutral-500">{tekst}</p>
      {actie}
    </div>
  );
}

export function Stat({ titel, waarde, href, accent }: { titel: string; waarde: ReactNode; href?: string; accent?: boolean }) {
  const inhoud = (
    <div className={`kaart h-full p-4 transition ${href ? "hover:border-skool-300 hover:shadow-md" : ""}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{titel}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? "text-skool-600" : ""}`}>{waarde}</div>
    </div>
  );
  return href ? <Link href={href}>{inhoud}</Link> : inhoud;
}

export function Rij({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-neutral-100 py-2 text-sm last:border-0">
      <div className="w-32 shrink-0 text-neutral-500 sm:w-40">{label}</div>
      <div className="min-w-0 flex-1 break-words font-medium [overflow-wrap:anywhere]">{children || <span className="text-neutral-400">Niet ingevuld</span>}</div>
    </div>
  );
}

export function Melding({ soort = "info", children }: { soort?: "info" | "waarschuwing" | "fout" | "ok"; children: ReactNode }) {
  const k = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    waarschuwing: "border-amber-200 bg-amber-50 text-amber-900",
    fout: "border-red-200 bg-red-50 text-red-800",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[soort];
  return <div className={`rounded-lg border px-4 py-3 text-sm ${k}`}>{children}</div>;
}
