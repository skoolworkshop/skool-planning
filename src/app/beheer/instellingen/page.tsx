import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { ROL_LABEL } from "@/lib/rbac";
import { notifyDevMode, TEMPLATES } from "@/lib/notify";
import { PaginaKop, Kaart, Badge, Melding } from "@/components/ui";
import { datumTijd, label } from "@/lib/format";
import { uitloggenOveral } from "@/lib/acties";
import Medewerkers from "./Medewerkers";

export const dynamic = "force-dynamic";

export default async function InstellingenPagina() {
  const u = await vereisGebruiker();
  const superbeheerder = u.role === "SUPERBEHEERDER";

  const [berichten, audit, gebruikers] = await Promise.all([
    db.messageLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { user: { select: { email: true } } } }),
    superbeheerder ? db.user.findMany({ where: { role: { not: "DOCENT" } }, orderBy: { email: "asc" } }) : Promise.resolve([]),
  ]);

  return (
    <>
      <PaginaKop titel="Instellingen" sub="Berichten, auditlog en gebruikers" />

      {notifyDevMode && (
        <div className="mb-5">
          <Melding soort="waarschuwing">
            De applicatie draait in ontwikkelmodus voor notificaties. E-mails en WhatsApp-berichten worden niet echt
            verstuurd, maar wel volledig gelogd. Zet NOTIFY_MODE op live om echt te versturen.
          </Melding>
        </div>
      )}

      {superbeheerder && <Medewerkers gebruikers={gebruikers.map((g) => ({ id: g.id, email: g.email, rol: ROL_LABEL[g.role], actief: g.active }))} />}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Kaart>
          <h2 className="mb-3 font-semibold">Berichtenlog</h2>
          <ul className="max-h-[520px] space-y-3 overflow-y-auto text-sm">
            {berichten.map((b) => (
              <li key={b.id} className="border-b border-neutral-100 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge kleur={b.kanaal === "WHATSAPP" ? "groen" : "blauw"}>{b.kanaal}</Badge>
                  <span className="font-medium">{b.ontvanger}</span>
                  <Badge kleur={b.status === "MISLUKT" ? "rood" : b.status === "DEV" ? "geel" : "groen"}>{b.status}</Badge>
                  <span className="ml-auto text-xs text-neutral-400">{datumTijd(b.createdAt)}</span>
                </div>
                {b.onderwerp && <div className="mt-1 font-medium">{b.onderwerp}</div>}
                <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-neutral-600">{b.inhoud}</pre>
                {b.fout && <p className="text-xs text-red-700">Fout: {b.fout}</p>}
              </li>
            ))}
            {berichten.length === 0 && <li className="text-neutral-500">Nog geen berichten verstuurd.</li>}
          </ul>
        </Kaart>

        <Kaart>
          <h2 className="mb-3 font-semibold">Auditlog</h2>
          <ul className="max-h-[520px] space-y-2 overflow-y-auto text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-2 border-b border-neutral-100 py-1.5">
                <span className="font-medium">{label(a.actie)}</span>
                <span className="text-neutral-500">{a.entiteit}</span>
                <span className="ml-auto text-xs text-neutral-400">{a.user?.email ?? "systeem"} · {datumTijd(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Kaart>

        <Kaart className="lg:col-span-2">
          <h2 className="mb-3 font-semibold">Berichtsjablonen</h2>
          <p className="mb-3 text-sm text-neutral-500">
            Variabelen tussen dubbele accolades worden automatisch ingevuld, bijvoorbeeld voornaam, workshop, datum,
            starttijd, plaats, vergoeding, reactiedeadline en link.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {Object.entries(TEMPLATES).map(([k, v]) => (
              <li key={k} className="rounded-lg border border-neutral-200 p-3 text-sm">
                <div className="font-medium">{label(k)}</div>
                <div className="text-xs text-neutral-500">{v.onderwerp}</div>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-neutral-600">{v.tekst}</pre>
              </li>
            ))}
          </ul>
        </Kaart>

        <Kaart>
          <h2 className="mb-2 font-semibold">Beveiliging</h2>
          <p className="mb-3 text-sm text-neutral-500">
            Log uit op alle apparaten waar je nu bent ingelogd. Bestaande sessies worden direct ongeldig.
          </p>
          <form action={uitloggenOveral}>
            <button className="knop-gevaar">Uitloggen op alle apparaten</button>
          </form>
        </Kaart>
      </div>
    </>
  );
}
