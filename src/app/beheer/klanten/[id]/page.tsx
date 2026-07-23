import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { Kaart, PaginaKop, Badge, statusKleur } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";
import Klantgegevens from "./Klantgegevens";

const ONDERWIJS = ["BASISSCHOOL", "VOORTGEZET_ONDERWIJS", "MBO", "HBO", "UNIVERSITEIT"];

export const dynamic = "force-dynamic";

export default async function KlantDetail({ params }: { params: { id: string } }) {
  await vereisGebruiker();
  const k = await db.client.findUnique({
    where: { id: params.id },
    include: {
      locations: true,
      contacts: true,
      projects: { orderBy: { startDatum: "desc" }, take: 20, include: { sessions: true } },
    },
  });
  if (!k) notFound();

  return (
    <>
      <Link href="/beheer/klanten" className="mb-3 inline-block text-sm text-zand-500 hover:text-skool-600">← Terug naar klanten</Link>
      <PaginaKop titel={k.naam} sub={`${k.klantnummer} · ${label(k.type)}`} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Kaart>
          <h2 className="mb-2 font-semibold">Locaties</h2>
          <ul className="space-y-3 text-sm">
            {k.locations.map((l) => (
              <li key={l.id} className="border-b border-zand-200 pb-2 last:border-0">
                <div className="font-medium">{l.naam}</div>
                <div className="text-zand-500">{[l.straat, l.huisnummer].filter(Boolean).join(" ")}, {l.postcode} {l.plaats}</div>
                {l.parkeren && <div className="mt-1 text-xs text-zand-500">Parkeren: {l.parkeren}</div>}
              </li>
            ))}
            {k.locations.length === 0 && <li className="text-zand-500">Geen locaties bekend.</li>}
          </ul>
        </Kaart>

        <Kaart>
          <h2 className="mb-2 font-semibold">Contactpersonen</h2>
          <ul className="space-y-3 text-sm">
            {k.contacts.map((c) => (
              <li key={c.id} className="border-b border-zand-200 pb-2 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.naam}</span>
                  {c.primair && <Badge kleur="oranje">Primair</Badge>}
                  {c.opDeDag && <Badge kleur="blauw">Op de dag</Badge>}
                </div>
                <div className="text-zand-500">{c.functie}</div>
                <div className="text-zand-500">{[c.mobiel, c.telefoon, c.email].filter(Boolean).join(" · ")}</div>
              </li>
            ))}
            {k.contacts.length === 0 && <li className="text-zand-500">Geen contactpersonen bekend.</li>}
          </ul>
        </Kaart>

        <Kaart>
          <Klantgegevens
            clientId={k.id}
            onderwijs={ONDERWIJS.includes(k.type)}
            doelgroepen={k.doelgroepen}
            doelgroepToelichting={k.doelgroepToelichting ?? ""}
            cjpNummer={k.cjpNummer ?? ""}
            factuurAdres={k.factuurAdres ?? ""}
            factuurEmail={k.factuurEmail ?? ""}
            betaaltermijn={k.betaaltermijn}
            tags={k.tags}
          />
        </Kaart>

        <Kaart className="lg:col-span-3">
          <h2 className="mb-3 font-semibold">Projecten</h2>
          <ul className="divide-y divide-zand-200 text-sm">
            {k.projects.map((p) => (
              <li key={p.id}>
                <Link href={`/beheer/opdrachten/${p.id}`} className="flex flex-wrap items-center gap-x-3 py-2 hover:bg-zand-100">
                  <span className="w-28 font-mono text-xs">{p.ordernummer}</span>
                  <span className="w-24">{datum(p.startDatum)}</span>
                  <span className="flex-1 font-medium">{p.naam}</span>
                  <span className="text-zand-500">{p.sessions.length} sessies</span>
                  <span>{euro(p.omzet)}</span>
                  <Badge kleur={statusKleur(p.status)}>{label(p.status)}</Badge>
                </Link>
              </li>
            ))}
            {k.projects.length === 0 && <li className="py-3 text-zand-500">Nog geen projecten voor deze klant.</li>}
          </ul>
        </Kaart>
      </div>
    </>
  );
}
