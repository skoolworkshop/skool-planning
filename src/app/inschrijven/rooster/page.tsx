import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { leerlingSessie, huidigeLeerling } from "@/lib/inschrijving-acties";
import { datum } from "@/lib/format";
import Printknop from "@/app/beheer/inschrijvingen/[id]/print/[soort]/Printknop";

export const dynamic = "force-dynamic";

export default async function MijnRooster() {
  const sessie = await leerlingSessie();
  const leerling = await huidigeLeerling();
  if (!sessie || !leerling) redirect("/inschrijven");

  const rondes = await db.enrollmentRound.findMany({
    where: { enrollmentId: sessie.enrollmentId },
    orderBy: { nummer: "asc" },
    include: { slots: { include: { workshop: true } } },
  });
  const keuzes = await db.choice.findMany({ where: { participantId: leerling.id } });
  const e = await db.enrollment.findUnique({
    where: { id: sessie.enrollmentId },
    include: { project: { include: { client: true, location: true } } },
  });

  return (
    <div className="bg-white">
      <Printknop />
      <div className="border-b border-zand-300 pb-3">
        <h1 className="text-xl font-bold">{e?.titel}</h1>
        <p className="text-sm text-zand-600">
          {[leerling.voornaam, leerling.achternaam].filter(Boolean).join(" ")} · klas {leerling.klas}
        </p>
        <p className="text-sm text-zand-600">
          {e?.project.client.naam}
          {e?.project.startDatum ? ` · ${datum(e.project.startDatum)}` : ""}
        </p>
      </div>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-neutral-800 text-left">
            <th className="py-2 pr-3">Tijd</th>
            <th className="py-2 pr-3">Workshop</th>
            <th className="py-2">Ruimte</th>
          </tr>
        </thead>
        <tbody>
          {rondes.map((r) => {
            const keuze = keuzes.find((k) => k.roundId === r.id);
            const slot = r.slots.find((s) => s.id === keuze?.slotId);
            return (
              <tr key={r.id} className="border-b border-zand-200">
                <td className="py-2 pr-3 whitespace-nowrap">{r.startTijd} tot {r.eindTijd}</td>
                <td className="py-2 pr-3 font-medium">{slot?.workshop.naam ?? "nog niet gekozen"}</td>
                <td className="py-2">{slot?.ruimte ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-6 text-xs text-zand-400">
        Zorg dat je op tijd bent. Skool Workshop.
      </p>
    </div>
  );
}
