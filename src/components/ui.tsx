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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zand-700 sm:text-[28px]">{titel}</h1>
        {sub && <p className="mt-1.5 text-sm text-zand-500">{sub}</p>}
      </div>
      {actie}
    </div>
  );
}

// Zachte vlakken met een dunne rand. Rustig genoeg om naast elkaar te staan.
const KLEUREN: Record<string, string> = {
  grijs: "bg-zand-100 text-zand-600 ring-1 ring-inset ring-zand-200",
  oranje: "bg-skool-50 text-skool-700 ring-1 ring-inset ring-skool-200",
  groen: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  rood: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  blauw: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  paars: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  geel: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
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
    TOEGEWEZEN: "groen",
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
      <p className="max-w-md text-sm text-zand-500">{tekst}</p>
      {actie}
    </div>
  );
}

export function Stat({ titel, waarde, href, accent }: { titel: string; waarde: ReactNode; href?: string; accent?: boolean }) {
  const inhoud = (
    <div className={`kaart h-full p-4 transition ${href ? "hover:border-skool-200 hover:shadow-zacht" : ""}`}>
      <div className="text-xs font-medium text-zand-500">{titel}</div>
      <div className={`mt-1.5 text-2xl font-semibold tracking-tight ${accent ? "text-skool-600" : "text-zand-700"}`}>{waarde}</div>
    </div>
  );
  return href ? <Link href={href}>{inhoud}</Link> : inhoud;
}

/**
 * Eén regel met een label en een waarde.
 * Is er niets ingevuld, dan tonen we de regel helemaal niet.
 * Wil je juist zien dat iets ontbreekt, zet dan toonLeeg aan.
 */
export function Rij({ label, children, toonLeeg = false }: { label: string; children: ReactNode; toonLeeg?: boolean }) {
  const leeg =
    children === null ||
    children === undefined ||
    children === false ||
    children === "" ||
    (Array.isArray(children) && children.filter(Boolean).length === 0);

  if (leeg && !toonLeeg) return null;

  return (
    <div className="flex gap-3 border-b border-zand-200 py-2 text-sm last:border-0">
      <div className="w-32 shrink-0 text-zand-500 sm:w-40">{label}</div>
      <div className="min-w-0 flex-1 break-words font-medium [overflow-wrap:anywhere]">
        {leeg ? <span className="text-zand-400">Niet ingevuld</span> : children}
      </div>
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
