"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { vereisRol, ipAdres } from "@/lib/auth";
import { BEHEER } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { herkenDoelgroep, herkenDoelgroepen } from "@/lib/doelgroepen";

export type MigratieRapport = {
  klantenBijgewerkt: number;
  sessiesBijgewerkt: number;
  workshopdocentenBijgewerkt: number;
  handmatig: { waar: string; naam: string; oudeWaarde: string }[];
};

/**
 * Zet oude vrije doelgroepteksten om naar de vaste lijst.
 * Wat niet betrouwbaar te herkennen is komt in een controlelijst,
 * zodat een beheerder het zelf kan nalopen. Er wordt niets gegokt.
 *
 * Deze actie is te herhalen. Al omgezette gegevens blijven ongemoeid.
 */
export async function doelgroepenMigreren(): Promise<MigratieRapport> {
  const u = await vereisRol(...BEHEER);
  const handmatig: { waar: string; naam: string; oudeWaarde: string }[] = [];
  let klantenBijgewerkt = 0;
  let sessiesBijgewerkt = 0;
  let workshopdocentenBijgewerkt = 0;

  // Klanten: de oude vrije tekst zat in doelgroepToelichting na de db push
  const klanten = await db.client.findMany({ select: { id: true, naam: true, doelgroepen: true, doelgroepToelichting: true } });
  for (const k of klanten) {
    if (k.doelgroepen.length > 0) continue;
    const bron = k.doelgroepToelichting;
    if (!bron) continue;
    const herkend = herkenDoelgroep(bron);
    if (herkend) {
      await db.client.update({ where: { id: k.id }, data: { doelgroepen: [herkend], doelgroepToelichting: null } });
      klantenBijgewerkt++;
    } else {
      handmatig.push({ waar: "Klant", naam: k.naam, oudeWaarde: bron });
    }
  }

  // Workshopmomenten
  const sessies = await db.workshopSession.findMany({
    select: { id: true, doelgroep: true, doelgroepToelichting: true, workshop: { select: { naam: true } } },
  });
  for (const s of sessies) {
    if (s.doelgroep) continue;
    const bron = s.doelgroepToelichting;
    if (!bron) continue;
    const herkend = herkenDoelgroep(bron);
    if (herkend) {
      await db.workshopSession.update({ where: { id: s.id }, data: { doelgroep: herkend, doelgroepToelichting: null } });
      sessiesBijgewerkt++;
    } else {
      handmatig.push({ waar: "Workshopmoment", naam: s.workshop.naam, oudeWaarde: bron });
    }
  }

  // Workshopdocenten hebben een lijst
  const docenten = await db.teacherProfile.findMany({ select: { id: true, voornaam: true, achternaam: true, doelgroepen: true } });
  for (const d of docenten) {
    if (d.doelgroepen.length > 0) continue;
    const { herkend, onbekend } = herkenDoelgroepen(d.doelgroepen as unknown as string[]);
    if (herkend.length > 0) {
      await db.teacherProfile.update({ where: { id: d.id }, data: { doelgroepen: herkend } });
      workshopdocentenBijgewerkt++;
    }
    for (const o of onbekend) {
      handmatig.push({ waar: "Workshopdocent", naam: `${d.voornaam} ${d.achternaam}`, oudeWaarde: o });
    }
  }

  await logAudit({
    userId: u.id,
    actie: "DOELGROEPEN_GEMIGREERD",
    entiteit: "Instelling",
    nieuw: { klantenBijgewerkt, sessiesBijgewerkt, workshopdocentenBijgewerkt, handmatig: handmatig.length },
    ip: ipAdres(),
  });
  revalidatePath("/beheer/instellingen");
  return { klantenBijgewerkt, sessiesBijgewerkt, workshopdocentenBijgewerkt, handmatig };
}
