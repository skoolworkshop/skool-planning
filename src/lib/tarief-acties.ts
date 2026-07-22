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

/** Leest de tarieven uit de instellingen. Ontbreekt er iets, dan geldt de standaard. */
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
