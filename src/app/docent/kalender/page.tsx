import { redirect } from "next/navigation";
import { huidigeGebruiker } from "@/lib/auth";
import { db } from "@/lib/db";
import { PaginaKop } from "@/components/ui";
import Maand from "./Maand";

export const dynamic = "force-dynamic";

export default async function KalenderPagina({
  searchParams,
}: {
  searchParams: { maand?: string };
}) {
  const u = await huidigeGebruiker();
  if (!u) redirect("/login");
  const teacher = await db.teacherProfile.findUnique({ where: { userId: u.id } });
  if (!teacher) redirect("/login");

  const vandaag = new Date();
  const basis = searchParams.maand ? new Date(searchParams.maand + "-01T12:00:00") : vandaag;
  const start = new Date(basis.getFullYear(), basis.getMonth(), 1);
  const eind = new Date(basis.getFullYear(), basis.getMonth() + 1, 1);

  const [toewijzingen, beschikbaarheid] = await Promise.all([
    db.assignment.findMany({
      where: {
        teacherId: teacher.id,
        uitgevallen: false,
        position: { session: { datum: { gte: start, lt: eind }, status: { not: "GEANNULEERD" } } },
      },
      include: {
        position: { include: { session: { include: { workshop: true, location: true } } } },
      },
    }),
    db.availability.findMany({
      where: { teacherId: teacher.id, datum: { gte: start, lt: eind } },
    }),
  ]);

  const dagen = toewijzingen.map((a) => ({
    datum: a.position.session.datum.toISOString().slice(0, 10),
    titel: a.position.session.workshop.naam,
    tijd: `${a.position.session.startTijd} tot ${a.position.session.eindTijd}`,
    plaats: a.position.session.location?.plaats ?? "",
    id: a.position.sessionId,
    reserve: a.reserve,
  }));

  const markeringen = beschikbaarheid.map((b) => ({
    datum: (b.datum as Date).toISOString().slice(0, 10),
    beschikbaar: b.beschikbaar,
  }));

  const maandSleutel = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      <PaginaKop titel="Mijn kalender" sub="Tik op een dag om je beschikbaarheid te wisselen" />
      <Maand maand={maandSleutel} opdrachten={dagen} markeringen={markeringen} />
    </div>
  );
}
