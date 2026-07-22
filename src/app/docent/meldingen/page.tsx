import { redirect } from "next/navigation";
import { huidigeGebruiker } from "@/lib/auth";
import { db } from "@/lib/db";
import { PaginaKop, Leeg } from "@/components/ui";
import Lijst from "./Lijst";
import AllesGelezen from "./AllesGelezen";

export const dynamic = "force-dynamic";

export default async function MeldingenPagina() {
  const u = await huidigeGebruiker();
  if (!u) redirect("/login");

  const meldingen = await db.notification.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const ongelezen = meldingen.filter((m) => !m.gelezen).length;

  return (
    <div>
      <PaginaKop
        titel="Meldingen"
        sub={ongelezen > 0 ? `${ongelezen} ongelezen` : "Je bent bij"}
        actie={ongelezen > 0 ? <AllesGelezen /> : undefined}
      />
      {meldingen.length === 0 ? (
        <Leeg titel="Nog geen meldingen" tekst="Zodra er een opdracht voor je is, lees je het hier als eerste." />
      ) : (
        <Lijst
          items={meldingen.map((m) => ({
            id: m.id,
            titel: m.titel,
            tekst: m.tekst,
            link: m.link,
            gelezen: m.gelezen,
            wanneer: m.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
