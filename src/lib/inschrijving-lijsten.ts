import "server-only";
import { db } from "@/lib/db";

export type LijstSoort =
  | "roosters" | "presentie" | "klassen" | "dagrooster" | "docenten" | "materiaal";

export const LIJST_TITEL: Record<LijstSoort, string> = {
  roosters: "Persoonlijke roosters",
  presentie: "Presentielijsten",
  klassen: "Klassenlijsten",
  dagrooster: "Dagrooster",
  docenten: "Docentenrooster",
  materiaal: "Materiaaloverzicht",
};

export async function haalInschrijving(id: string) {
  return db.enrollment.findUnique({
    where: { id },
    include: {
      project: { include: { client: true, location: true } },
      rondes: {
        orderBy: { nummer: "asc" },
        include: {
          slots: {
            include: {
              workshop: true,
              teacher: { select: { voornaam: true, achternaam: true } },
              keuzes: { include: { participant: true } },
            },
          },
        },
      },
      deelnemers: { orderBy: [{ klas: "asc" }, { voornaam: "asc" }] },
    },
  });
}

export type Inschrijving = NonNullable<Awaited<ReturnType<typeof haalInschrijving>>>;

function naam(p: { voornaam: string; achternaam: string | null }) {
  return [p.voornaam, p.achternaam].filter(Boolean).join(" ");
}

/** Bouwt de rijen voor een lijst. Wordt gebruikt door zowel de CSV export als het printscherm. */
export function bouwLijst(e: Inschrijving, soort: LijstSoort): { kop: string[]; rijen: string[][] } {
  const slotVan = (participantId: string, roundId: string) => {
    for (const r of e.rondes) {
      if (r.id !== roundId) continue;
      for (const s of r.slots) {
        if (s.keuzes.some((k) => k.participantId === participantId)) return s;
      }
    }
    return null;
  };

  if (soort === "roosters") {
    const kop = ["Naam", "Klas", ...e.rondes.map((r) => `Ronde ${r.nummer} (${r.startTijd})`)];
    const rijen = e.deelnemers.map((d) => [
      naam(d),
      d.klas,
      ...e.rondes.map((r) => {
        const s = slotVan(d.id, r.id);
        return s ? `${s.workshop.naam}${s.ruimte ? ` - ${s.ruimte}` : ""}` : "nog niet gekozen";
      }),
    ]);
    return { kop, rijen };
  }

  if (soort === "presentie") {
    const kop = ["Ronde", "Tijd", "Workshop", "Ruimte", "Docent", "Naam", "Klas", "Aanwezig"];
    const rijen: string[][] = [];
    for (const r of e.rondes) {
      for (const s of r.slots) {
        const deelnemers = s.keuzes.map((k) => k.participant).sort((a, b) => a.voornaam.localeCompare(b.voornaam));
        if (deelnemers.length === 0) {
          rijen.push([String(r.nummer), `${r.startTijd}-${r.eindTijd}`, s.workshop.naam, s.ruimte ?? "", s.teacher ? naam(s.teacher) : "", "geen deelnemers", "", ""]);
          continue;
        }
        for (const d of deelnemers) {
          rijen.push([
            String(r.nummer), `${r.startTijd}-${r.eindTijd}`, s.workshop.naam, s.ruimte ?? "",
            s.teacher ? naam(s.teacher) : "", naam(d), d.klas, "",
          ]);
        }
      }
    }
    return { kop, rijen };
  }

  if (soort === "klassen") {
    const kop = ["Klas", "Naam", ...e.rondes.map((r) => `Ronde ${r.nummer}`)];
    const rijen = e.deelnemers.map((d) => [
      d.klas,
      naam(d),
      ...e.rondes.map((r) => {
        const s = slotVan(d.id, r.id);
        return s ? `${s.workshop.naam}${s.ruimte ? ` (${s.ruimte})` : ""}` : "-";
      }),
    ]);
    return { kop, rijen };
  }

  if (soort === "dagrooster") {
    const ruimtes = [...new Set(e.rondes.flatMap((r) => r.slots.map((s) => s.ruimte ?? "Ruimte onbekend")))].sort();
    const kop = ["Ruimte", ...e.rondes.map((r) => `Ronde ${r.nummer} ${r.startTijd}-${r.eindTijd}`)];
    const rijen = ruimtes.map((ruimte) => [
      ruimte,
      ...e.rondes.map((r) => {
        const s = r.slots.find((x) => (x.ruimte ?? "Ruimte onbekend") === ruimte);
        if (!s) return "vrij";
        return `${s.workshop.naam} (${s.keuzes.length} lln)`;
      }),
    ]);
    return { kop, rijen };
  }

  if (soort === "docenten") {
    const kop = ["Docent", "Ronde", "Tijd", "Workshop", "Ruimte", "Aantal deelnemers"];
    const rijen: string[][] = [];
    for (const r of e.rondes) {
      for (const s of r.slots) {
        rijen.push([
          s.teacher ? naam(s.teacher) : "Nog niet toegewezen",
          String(r.nummer), `${r.startTijd}-${r.eindTijd}`,
          s.workshop.naam, s.ruimte ?? "", String(s.keuzes.length),
        ]);
      }
    }
    rijen.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
    return { kop, rijen };
  }

  // materiaal
  const perWorkshop = new Map<string, { groepen: number; deelnemers: number; materialen: string; door: string }>();
  for (const r of e.rondes) {
    for (const s of r.slots) {
      const huidig = perWorkshop.get(s.workshop.naam) ?? {
        groepen: 0, deelnemers: 0,
        materialen: s.workshop.materialen ?? "",
        door: s.workshop.materialenDoor ?? "",
      };
      huidig.groepen += 1;
      huidig.deelnemers += s.keuzes.length;
      perWorkshop.set(s.workshop.naam, huidig);
    }
  }
  return {
    kop: ["Workshop", "Aantal groepen", "Totaal deelnemers", "Materialen", "Geleverd door"],
    rijen: [...perWorkshop.entries()].map(([w, v]) => [
      w, String(v.groepen), String(v.deelnemers), v.materialen, v.door,
    ]),
  };
}
