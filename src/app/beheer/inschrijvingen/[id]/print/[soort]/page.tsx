import { notFound } from "next/navigation";
import { vereisGebruiker } from "@/lib/auth";
import { datum } from "@/lib/format";
import { haalInschrijving, bouwLijst, LIJST_TITEL, type LijstSoort } from "@/lib/inschrijving-lijsten";
import Printknop from "./Printknop";

export const dynamic = "force-dynamic";

export default async function PrintPagina({ params }: { params: { id: string; soort: string } }) {
  await vereisGebruiker();
  const soort = params.soort as LijstSoort;
  if (!(soort in LIJST_TITEL)) notFound();

  const e = await haalInschrijving(params.id);
  if (!e) notFound();

  const { kop, rijen } = bouwLijst(e, soort);

  return (
    <div className="mx-auto max-w-5xl bg-white p-8 print:p-0">
      <Printknop />

      <div className="mb-5 border-b border-zand-300 pb-3">
        <h1 className="text-2xl font-bold">{LIJST_TITEL[soort]}</h1>
        <p className="text-sm text-zand-600">
          {e.titel} · {e.project.client.naam}
          {e.project.startDatum ? ` · ${datum(e.project.startDatum)}` : ""}
        </p>
        {e.project.location && (
          <p className="text-sm text-zand-600">
            {e.project.location.naam}, {e.project.location.plaats}
          </p>
        )}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-neutral-800 text-left">
            {kop.map((k) => <th key={k} className="py-2 pr-3 font-semibold">{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {rijen.map((r, i) => (
            <tr key={i} className="break-inside-avoid border-b border-zand-200">
              {r.map((v, j) => (
                <td key={j} className="py-1.5 pr-3 align-top">
                  {soort === "presentie" && j === kop.length - 1
                    ? <span className="inline-block h-4 w-4 border border-neutral-500" />
                    : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rijen.length === 0 && (
        <p className="mt-4 text-sm text-zand-500">Er is nog niets om te tonen.</p>
      )}

      <p className="mt-6 text-xs text-zand-400 print:fixed print:bottom-2">
        Skool Workshop · {LIJST_TITEL[soort]} · {new Date().toLocaleDateString("nl-NL")}
      </p>
    </div>
  );
}
