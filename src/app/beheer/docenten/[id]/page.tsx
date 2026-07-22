import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { magGevoeligeGegevens } from "@/lib/rbac";
import { Kaart, PaginaKop, Badge, statusKleur, Rij, Melding } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";
import Acties from "./Acties";

export const dynamic = "force-dynamic";

export default async function DocentDetail({ params }: { params: { id: string } }) {
  const u = await vereisGebruiker();
  const d = await db.teacherProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      skills: { include: { workshop: { select: { naam: true } } } },
      documents: { orderBy: { type: "asc" } },
      availability: true,
      assignments: {
        include: { position: { include: { session: { include: { workshop: true, project: { include: { client: true } } } } } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!d) notFound();

  const gevoelig = magGevoeligeGegevens(u.role);
  const naam = [d.voornaam, d.tussenvoegsel, d.achternaam].filter(Boolean).join(" ");
  const nu = new Date();

  return (
    <>
      <Link href="/beheer/docenten" className="mb-3 inline-block text-sm text-neutral-500 hover:text-skool-600">← Terug naar docenten</Link>
      <PaginaKop
        titel={naam}
        sub={d.user.email}
        actie={<Badge kleur={statusKleur(d.status)}>{label(d.status)}</Badge>}
      />

      {d.status === "TER_BEOORDELING" && (
        <div className="mb-4">
          <Melding soort="waarschuwing">
            Dit profiel wacht op beoordeling. Controleer de gegevens en documenten voordat je goedkeurt.
          </Melding>
        </div>
      )}

      {u.role !== "LEZER" && <Acties teacherId={d.id} status={d.status} />}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Kaart>
          <h2 className="mb-2 font-semibold">Contact en adres</h2>
          <Rij label="Telefoon">{d.telefoon}</Rij>
          <Rij label="Geboortedatum">{d.geboortedatum ? datum(d.geboortedatum) : ""}</Rij>
          <Rij label="Adres">{[d.straat, d.huisnummer].filter(Boolean).join(" ")}</Rij>
          <Rij label="Postcode en plaats">{[d.postcode, d.plaats].filter(Boolean).join(" ")}</Rij>
          <Rij label="Noodcontact">{d.noodcontact ? `${d.noodcontact}, ${d.noodcontactTel ?? ""}` : ""}</Rij>
          <Rij label="Talen">{d.talen.join(", ")}</Rij>
          <Rij label="Doelgroepen">{d.doelgroepen.join(", ")}</Rij>
        </Kaart>

        <Kaart>
          <h2 className="mb-2 font-semibold">Werk en vervoer</h2>
          <Rij label="Samenwerking">{d.samenwerking}</Rij>
          <Rij label="KvK-nummer">{d.kvk}</Rij>
          <Rij label="Uurtarief">{d.uurtarief ? euro(d.uurtarief) : ""}</Rij>
          <Rij label="Minimum dagtarief">{d.minDagtarief ? euro(d.minDagtarief) : ""}</Rij>
          <Rij label="Kilometervergoeding">{d.kmVergoeding ? euro(d.kmVergoeding) : ""}</Rij>
          <Rij label="Maximale reisafstand">{d.maxReisAfstand ? `${d.maxReisAfstand} km` : ""}</Rij>
          <Rij label="Vervoer">
            {[d.eigenVervoer && "eigen vervoer", d.rijbewijs && "rijbewijs", d.ovMogelijk && "openbaar vervoer"].filter(Boolean).join(", ")}
          </Rij>
          <Rij label="Bankrekening">
            {gevoelig ? (
              d.iban ? `${d.iban} (${d.rekeninghouder ?? "onbekend"})` : ""
            ) : (
              <span className="text-neutral-400">Afgeschermd voor jouw rol</span>
            )}
          </Rij>
        </Kaart>

        <Kaart>
          <h2 className="mb-3 font-semibold">Workshops</h2>
          {d.skills.length === 0 ? (
            <p className="text-sm text-neutral-500">Nog geen workshops gekoppeld.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {d.skills.map((s) => (
                <li key={s.id}>
                  <Badge kleur={s.niveau >= 3 ? "groen" : "oranje"}>
                    {s.workshop.naam} · niveau {s.niveau}
                    {!s.zelfstandig && " · assistent"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Kaart>

        <Kaart>
          <h2 className="mb-3 font-semibold">Documenten</h2>
          <ul className="space-y-2 text-sm">
            {d.documents.map((doc) => {
              const verlopen = doc.vervaldatum && doc.vervaldatum < nu;
              const zichtbaar = gevoelig || (doc.type !== "IDENTITEITSBEWIJS" && doc.type !== "RIJBEWIJS");
              return (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2 last:border-0">
                  <div>
                    <div className="font-medium">{label(doc.type)}{doc.verplicht && <span className="ml-1 text-skool-600">*</span>}</div>
                    <div className="text-xs text-neutral-500">
                      {zichtbaar
                        ? doc.vervaldatum ? `Geldig tot ${datum(doc.vervaldatum)}` : "Geen vervaldatum"
                        : "Inhoud afgeschermd voor jouw rol"}
                    </div>
                  </div>
                  <Badge kleur={verlopen ? "rood" : statusKleur(doc.status)}>{verlopen ? "Verlopen" : label(doc.status)}</Badge>
                </li>
              );
            })}
            {d.documents.length === 0 && <li className="text-neutral-500">Nog geen documenten aangeleverd.</li>}
          </ul>
        </Kaart>

        <Kaart className="lg:col-span-2">
          <h2 className="mb-3 font-semibold">Laatste opdrachten</h2>
          {d.assignments.length === 0 ? (
            <p className="text-sm text-neutral-500">Nog geen opdrachten.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 text-sm">
              {d.assignments.map((a) => (
                <li key={a.id} className="flex flex-wrap gap-x-3 py-2">
                  <span className="w-24 font-medium">{datum(a.position.session.datum)}</span>
                  <Link href={`/beheer/opdrachten/${a.position.sessionId}`} className="flex-1 hover:text-skool-600">
                    {a.position.session.workshop.naam}, {a.position.session.project.client.naam}
                  </Link>
                  {a.reserve && <Badge kleur="paars">Reserve</Badge>}
                  {a.uitgevallen && <Badge kleur="rood">Uitgevallen</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Kaart>
      </div>

      {d.interneNotitie && (
        <div className="mt-5">
          <Kaart>
            <h2 className="mb-2 font-semibold">Interne notitie</h2>
            <p className="whitespace-pre-line text-sm text-neutral-700">{d.interneNotitie}</p>
          </Kaart>
        </div>
      )}
    </>
  );
}
