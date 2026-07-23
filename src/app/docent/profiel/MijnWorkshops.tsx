import { Badge } from "@/components/ui";

type Item = { id: string; naam: string; categorie: string; kleur: string; korteOmschrijving: string; afbeeldingUrl: string | null; afbeeldingAlt: string | null; bevoegdheid: string };

const LABEL: Record<string, string> = {
  ZELFSTANDIG: "Mag je zelfstandig geven",
  ASSISTEREN: "Mag je assisteren",
  NIET_INZETBAAR: "Niet inzetbaar",
};

/**
 * Toont voor welke workshops deze workshopdocent is goedgekeurd.
 * Alleen bekijken, want Skool Workshop bepaalt dit.
 */
export default function MijnWorkshops({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zand-500">
        Er zijn nog geen workshops aan je profiel gekoppeld. Skool Workshop doet dat voor je.
      </p>
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-zand-500">
        Skool Workshop bepaalt welke workshops je mag geven. Klopt er iets niet? Laat het weten aan je planner.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((w) => (
          <li key={w.id} className="flex items-center gap-3 rounded-lg border border-zand-300 p-2">
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded bg-zand-200">
              {w.afbeeldingUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.afbeeldingUrl} alt={w.afbeeldingAlt ?? ""} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="block h-full w-full" style={{ background: w.kleur + "33" }} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{w.naam}</span>
              <span className="block text-xs text-zand-500">{w.categorie}</span>
              {w.korteOmschrijving && <span className="mt-0.5 line-clamp-2 block text-xs text-zand-500">{w.korteOmschrijving}</span>}
            </span>
            <Badge kleur={w.bevoegdheid === "ZELFSTANDIG" ? "groen" : w.bevoegdheid === "ASSISTEREN" ? "geel" : "grijs"}>
              {LABEL[w.bevoegdheid] ?? w.bevoegdheid}
            </Badge>
          </li>
        ))}
      </ul>
    </>
  );
}
