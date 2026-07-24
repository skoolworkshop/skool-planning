import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { vereisGebruiker } from "@/lib/auth";
import { magGevoeligeGegevens } from "@/lib/rbac";
import { Kaart, PaginaKop, Badge, statusKleur, Rij, Melding } from "@/components/ui";
import { datum, euro, label } from "@/lib/format";
import Acties from "./Acties";
import Bevoegdheden from "./Bevoegdheden";
import Tarief from "./Tarief";
import { haalTarieven } from "@/lib/tarief-acties";
import { isVerlopen, kentVervaldatum } from "@/lib/documenten";

export const dynamic = "force-dynamic";

export default async function DocentDetail({ params }: { params: { id: string } }) {
  const tarieven = await haalTarieven();
  const historie = await db.tariefHistorie.findMany({
    where: { teacherId: params.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const alleWorkshops = await db.workshop.findMany({
    where: { actief: true },
    include: { category: true },
    orderBy: [{ category: { volgorde: "asc" } }, { naam: "asc" }],
  });
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
      <Link href="/beheer/docenten" className="mb-3 inline-block text-sm text-zand-500 hover:text-skool-600">← Terug naar docenten</Link>
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
          <Tarief
            teacherId={d.id}
            uurtarief={d.uurtarief ? Number(d.uurtarief) : null}
            minDagtarief={d.minDagtarief ? Number(d.minDagtarief) : null}
            kmVergoeding={d.kmVergoeding ? Number(d.kmVergoeding) : null}
            maxReisAfstand={d.maxReisAfstand ?? null}
            tariefVanaf={d.tariefVanaf ? d.tariefVanaf.toISOString().slice(0, 10) : ""}
            tariefNotitie={d.tariefNotitie ?? ""}
            laatstDoor={d.tariefDoor ?? ""}
            laatstOp={d.tariefOp ? datum(d.tariefOp) : ""}
            historie={historie.map((h) => ({
              veld: h.veld,
              oud: h.oudeWaarde ?? "",
              nieuw: h.nieuweWaarde ?? "",
              reden: h.reden ?? "",
              wanneer: datum(h.createdAt),
              door: h.doorUserId ?? "",
            }))}
            standaard={{ uurtarief: tarieven.uurtarief, minimumPerDag: tarieven.minimumPerDag, kmTarief: tarieven.kmTarief }}
          />
        </Kaart>

        <Kaart>
          <h2 className="mb-2 font-semibold">Werk en vervoer</h2>
          <Rij label="Samenwerking">{d.samenwerking === "ZZP" ? "ZZP" : d.samenwerking === "FREELANCE" ? "Freelance" : d.samenwerking}</Rij>
          {d.samenwerking === "ZZP" && (
            <>
              <Rij toonLeeg label="KvK-nummer">{d.kvk}</Rij>
              <Rij toonLeeg label="Btw-nummer">{d.btwNummer}</Rij>
            </>
          )}
          <Rij label="Vervoer">
            {[d.eigenVervoer && "eigen vervoer", d.rijbewijs && "rijbewijs", d.ovMogelijk && "openbaar vervoer"].filter(Boolean).join(", ")}
          </Rij>
          <Rij label="Bankrekening">
            {gevoelig ? (
              d.iban ? `${d.iban} (${d.rekeninghouder ?? "onbekend"})` : ""
            ) : (
              <span className="text-zand-400">Afgeschermd voor jouw rol</span>
            )}
          </Rij>
        </Kaart>

        <Kaart>
          <h2 className="mb-1 font-semibold">Workshopbevoegdheden</h2>
          <p className="mb-3 text-sm text-zand-500">
            Jij bepaalt wat deze workshopdocent mag geven. Hij kan dit zelf niet aanpassen.
          </p>
          <Bevoegdheden
            teacherId={d.id}
            workshops={alleWorkshops.map((w) => ({
              id: w.id,
              naam: w.naam,
              categorie: w.category.naam,
              bevoegdheid: d.skills.find((sk) => sk.workshopId === w.id)?.bevoegdheid ?? "GEEN",
            }))}
          />
        </Kaart>

        <Kaart>
          <h2 className="mb-3 font-semibold">Documenten</h2>
          <ul className="space-y-2 text-sm">
            {d.documents.map((doc) => {
              const verlopen = isVerlopen(doc, nu);
              const zichtbaar = gevoelig || (doc.type !== "IDENTITEITSBEWIJS" && doc.type !== "RIJBEWIJS");
              return (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-zand-200 pb-2 last:border-0">
                  <div>
                    <div className="font-medium">{label(doc.type)}{doc.verplicht && <span className="ml-1 text-skool-600">*</span>}</div>
                    <div className="text-xs text-zand-500">
                      {zichtbaar
                        ? kentVervaldatum(doc.type) && doc.vervaldatum ? `Geldig tot ${datum(doc.vervaldatum)}` : "Geen vervaldatum"
                        : "Inhoud afgeschermd voor jouw rol"}
                    </div>
                  </div>
                  <Badge kleur={verlopen ? "rood" : statusKleur(doc.status)}>{verlopen ? "Verlopen" : label(doc.status)}</Badge>
                </li>
              );
            })}
            {d.documents.length === 0 && <li className="text-zand-500">Nog geen documenten aangeleverd.</li>}
          </ul>
        </Kaart>

        <Kaart className="lg:col-span-2">
          <h2 className="mb-3 font-semibold">Laatste opdrachten</h2>
          {d.assignments.length === 0 ? (
            <p className="text-sm text-zand-500">Nog geen opdrachten.</p>
          ) : (
            <ul className="divide-y divide-zand-200 text-sm">
              {d.assignments.map((a) => (
                <li key={a.id} className="flex flex-wrap gap-x-3 py-2">
                  <span className="w-24 font-medium">{datum(a.position.session.datum)}</span>
                  <Link href={`/beheer/opdrachten/moment/${a.position.sessionId}`} className="flex-1 hover:text-skool-600">
                    {a.position.session.workshop.naam}, {a.position.session.project.client.naam}
                  </Link>
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
            <p className="whitespace-pre-line text-sm text-zand-600">{d.interneNotitie}</p>
          </Kaart>
        </div>
      )}
    </>
  );
}
