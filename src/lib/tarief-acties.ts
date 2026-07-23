"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { vereisRol, ipAdres } from "@/lib/auth";
import { BEHEER } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { STANDAARD_TARIEVEN, type Tarieven } from "@/lib/tarieven";

const SLEUTELS: (keyof Tarieven)[] = [
  "uurtarief",
  "minimumPerDag",
  "kmTarief",
  "reistijdDrempelMinuten",
  "reistijdDeel",
];

/**
 * Leest de tarieven uit de instellingen. Ontbreekt er iets, dan geldt de standaard.
 * PUBLIEK: leest alleen algemene tarieven, geen persoonsgegevens. Een workshopdocent
 * mag zijn eigen tarieven zien, dus deze mag zonder rolcontrole.
 */
export async function haalTarieven(): Promise<Tarieven> {
  try {
    const rijen = await db.instelling.findMany({ where: { sleutel: { in: SLEUTELS.map((s) => `tarief.${s}`) } } });
    const uit = { ...STANDAARD_TARIEVEN };
    for (const r of rijen) {
      const naam = r.sleutel.replace("tarief.", "") as keyof Tarieven;
      const n = Number(r.waarde);
      if (SLEUTELS.includes(naam) && Number.isFinite(n)) uit[naam] = n;
    }
    return uit;
  } catch {
    return { ...STANDAARD_TARIEVEN };
  }
}

/** Slaat de tarieven op. Alleen beheerders mogen dit. */
export async function tarievenOpslaan(formData: FormData) {
  const u = await vereisRol(...BEHEER);

  const nieuw: Partial<Tarieven> = {};
  for (const sleutel of SLEUTELS) {
    const ruw = formData.get(sleutel);
    if (ruw === null) continue;
    const n = Number(String(ruw).replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return { fout: `Vul bij ${sleutel} een geldig getal in.` };
    nieuw[sleutel] = n;
  }

  if ((nieuw.uurtarief ?? 0) <= 0) return { fout: "Het uurtarief moet groter dan nul zijn." };
  if ((nieuw.reistijdDeel ?? 0) > 1) return { fout: "Het deel van het uurtarief kan niet boven 1 liggen." };

  for (const [sleutel, waarde] of Object.entries(nieuw)) {
    await db.instelling.upsert({
      where: { sleutel: `tarief.${sleutel}` },
      create: { sleutel: `tarief.${sleutel}`, waarde: String(waarde) },
      update: { waarde: String(waarde) },
    });
  }

  await logAudit({ userId: u.id, actie: "TARIEVEN_AANGEPAST", entiteit: "Instelling", nieuw, ip: ipAdres() });
  revalidatePath("/beheer/instellingen");
  revalidatePath("/beheer/financieel");
  return { ok: true };
}

/**
 * Zet het persoonlijke tarief van een workshopdocent.
 * Leeg laten betekent: gebruik het standaardtarief uit de instellingen.
 * Elke wijziging komt in de tariefhistorie en in de auditlog.
 */
export async function docentTariefOpslaan(teacherId: string, formData: FormData) {
  const u = await vereisRol(...BEHEER);
  const teacher = await db.teacherProfile.findUnique({ where: { id: teacherId } });
  if (!teacher) return { fout: "Deze workshopdocent bestaat niet." };

  const getal = (naam: string) => {
    const ruw = formData.get(naam);
    if (ruw === null || String(ruw).trim() === "") return null;
    const n = Number(String(ruw).replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const nieuweWaarden = {
    uurtarief: getal("uurtarief"),
    minDagtarief: getal("minDagtarief"),
    kmVergoeding: getal("kmVergoeding"),
  };
  const maxAfstand = getal("maxReisAfstand");
  const vanaf = String(formData.get("tariefVanaf") ?? "").trim();
  const notitie = String(formData.get("tariefNotitie") ?? "").trim();
  const reden = String(formData.get("reden") ?? "").trim();

  const oud: Record<string, string | null> = {
    uurtarief: teacher.uurtarief === null ? null : String(teacher.uurtarief),
    minDagtarief: teacher.minDagtarief === null ? null : String(teacher.minDagtarief),
    kmVergoeding: teacher.kmVergoeding === null ? null : String(teacher.kmVergoeding),
  };
  const regels: { veld: string; oudeWaarde: string | null; nieuweWaarde: string | null }[] = [];
  for (const veld of ["uurtarief", "minDagtarief", "kmVergoeding"] as const) {
    const waarde = nieuweWaarden[veld] === null ? null : String(nieuweWaarden[veld]);
    if (oud[veld] !== waarde) regels.push({ veld, oudeWaarde: oud[veld], nieuweWaarde: waarde });
  }

  await db.$transaction(async (tx) => {
    await tx.teacherProfile.update({
      where: { id: teacherId },
      data: {
        ...nieuweWaarden,
        maxReisAfstand: maxAfstand === null ? null : Math.round(maxAfstand),
        tariefVanaf: vanaf ? new Date(vanaf) : teacher.tariefVanaf,
        tariefNotitie: notitie || null,
        tariefDoor: regels.length > 0 ? u.email : teacher.tariefDoor,
        tariefOp: regels.length > 0 ? new Date() : teacher.tariefOp,
      },
    });
    for (const r of regels) {
      await tx.tariefHistorie.create({
        data: { teacherId, veld: r.veld, oudeWaarde: r.oudeWaarde, nieuweWaarde: r.nieuweWaarde, reden: reden || null, doorUserId: u.email },
      });
    }
  });

  if (regels.length > 0) {
    await logAudit({
      userId: u.id,
      actie: "TARIEF_AANGEPAST",
      entiteit: "TeacherProfile",
      entiteitId: teacherId,
      oud,
      nieuw: { ...nieuweWaarden, reden: reden || null },
      ip: ipAdres(),
    });
  }

  revalidatePath(`/beheer/docenten/${teacherId}`);
  return { ok: true, gewijzigd: regels.length };
}
