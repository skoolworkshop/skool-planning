"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { vereisRol, ipAdres } from "@/lib/auth";
import { BEHEER } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const SITE = "https://skoolworkshop.nl";
const MAX_BYTES = 3 * 1024 * 1024;
const TOEGESTAAN = ["image/jpeg", "image/png", "image/webp"];

export type SyncResultaat = {
  gelukt: number;
  overgeslagen: number;
  controle: { naam: string; reden: string }[];
};

/** Haalt de uitgelichte afbeelding op via de WordPress REST API. */
async function viaRestApi(slug: string): Promise<{ url: string; alt: string; pagina: string } | null> {
  try {
    const res = await fetch(`${SITE}/wp-json/wp/v2/workshops?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia`, {
      headers: { "user-agent": "SkoolWorkshopPlanning/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const lijst = (await res.json()) as {
      link?: string;
      _embedded?: { "wp:featuredmedia"?: { source_url?: string; alt_text?: string }[] };
    }[];
    const item = lijst?.[0];
    const media = item?._embedded?.["wp:featuredmedia"]?.[0];
    if (!media?.source_url) return null;
    return { url: media.source_url, alt: media.alt_text ?? "", pagina: item?.link ?? `${SITE}/workshops/${slug}/` };
  } catch {
    return null;
  }
}

/** Terugval: lees de og:image uit de workshoppagina. */
async function viaOgImage(slug: string): Promise<{ url: string; alt: string; pagina: string } | null> {
  const pagina = `${SITE}/workshops/${slug}/`;
  try {
    const res = await fetch(pagina, { headers: { "user-agent": "SkoolWorkshopPlanning/1.0" }, cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
    if (!m) return null;
    const alt = /<meta[^>]+property=["']og:image:alt["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] ?? "";
    return { url: m[1], alt, pagina };
  } catch {
    return null;
  }
}

/** Downloadt de afbeelding en bewaart hem in de database. */
async function bewaar(workshopId: string, naam: string, bron: { url: string; alt: string; pagina: string }) {
  const res = await fetch(bron.url, { headers: { "user-agent": "SkoolWorkshopPlanning/1.0" }, cache: "no-store" });
  if (!res.ok) return { fout: `Downloaden lukte niet (${res.status})` };

  const mimeType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!TOEGESTAAN.includes(mimeType)) return { fout: `Onverwacht bestandstype ${mimeType || "onbekend"}` };

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength === 0) return { fout: "Leeg bestand" };
  if (buffer.byteLength > MAX_BYTES) return { fout: "Bestand is te groot" };

  const hash = createHash("sha256").update(buffer).digest("hex");

  // Staat deze afbeelding er al? Dan niet opnieuw wegschrijven.
  const bestaand = await db.workshopAfbeelding.findUnique({ where: { workshopId } });
  if (bestaand?.hash === hash) {
    await db.workshop.update({
      where: { id: workshopId },
      data: { afbeeldingGesyncedOp: new Date(), bronPaginaUrl: bron.pagina, bronAfbeeldingUrl: bron.url },
    });
    return { ongewijzigd: true };
  }

  await db.$transaction(async (tx) => {
    await tx.workshopAfbeelding.upsert({
      where: { workshopId },
      create: { workshopId, data: buffer, mimeType, bytes: buffer.byteLength, hash, bronUrl: bron.url },
      update: { data: buffer, mimeType, bytes: buffer.byteLength, hash, bronUrl: bron.url },
    });
    await tx.workshop.update({
      where: { id: workshopId },
      data: {
        afbeeldingUrl: `/api/workshop-foto/${workshopId}`,
        afbeeldingAlt: bron.alt || `Workshop ${naam.replace(/^Workshop /, "")} van Skool Workshop`,
        bronPaginaUrl: bron.pagina,
        bronAfbeeldingUrl: bron.url,
        afbeeldingGesyncedOp: new Date(),
        afbeeldingControle: false,
      },
    });
  });
  return { ok: true };
}

/**
 * Haalt alle workshopfoto's op van skoolworkshop.nl en bewaart ze in de app.
 * Eerst via de WordPress REST API, anders via de og:image van de pagina.
 * Lukt het niet betrouwbaar, dan komt de workshop in de controlelijst.
 */
export async function afbeeldingenSynchroniseren(): Promise<SyncResultaat> {
  const u = await vereisRol(...BEHEER);
  const workshops = await db.workshop.findMany({
    where: { actief: true },
    select: { id: true, naam: true, siteSlug: true },
    orderBy: { naam: "asc" },
  });

  let gelukt = 0;
  let overgeslagen = 0;
  const controle: { naam: string; reden: string }[] = [];

  for (const w of workshops) {
    if (!w.siteSlug) {
      controle.push({ naam: w.naam, reden: "Geen koppeling met een pagina op de website" });
      await db.workshop.update({ where: { id: w.id }, data: { afbeeldingControle: true } });
      continue;
    }

    const bron = (await viaRestApi(w.siteSlug)) ?? (await viaOgImage(w.siteSlug));
    if (!bron) {
      controle.push({ naam: w.naam, reden: "Geen uitgelichte afbeelding gevonden op de pagina" });
      await db.workshop.update({ where: { id: w.id }, data: { afbeeldingControle: true } });
      continue;
    }

    const res = await bewaar(w.id, w.naam, bron);
    if (res.ok) gelukt++;
    else if (res.ongewijzigd) overgeslagen++;
    else {
      controle.push({ naam: w.naam, reden: res.fout ?? "Onbekende fout" });
      await db.workshop.update({ where: { id: w.id }, data: { afbeeldingControle: true } });
    }
  }

  await logAudit({
    userId: u.id,
    actie: "AFBEELDINGEN_GESYNCED",
    entiteit: "Workshop",
    nieuw: { gelukt, overgeslagen, controle: controle.length },
    ip: ipAdres(),
  });
  revalidatePath("/beheer/workshops");
  return { gelukt, overgeslagen, controle };
}

/** Koppelt handmatig een andere pagina aan een workshop en haalt die foto op. */
export async function afbeeldingHandmatig(workshopId: string, slugOfUrl: string) {
  const u = await vereisRol(...BEHEER);
  const w = await db.workshop.findUnique({ where: { id: workshopId }, select: { id: true, naam: true } });
  if (!w) return { fout: "Deze workshop bestaat niet." };

  const schoon = slugOfUrl.trim();
  if (!schoon) return { fout: "Vul een slug of een adres in." };

  const slug = schoon.startsWith("http")
    ? (schoon.replace(/\/$/, "").split("/").pop() ?? "")
    : schoon.replace(/^\/+|\/+$/g, "");
  if (!slug) return { fout: "Uit dit adres kan ik geen pagina afleiden." };

  const bron = (await viaRestApi(slug)) ?? (await viaOgImage(slug));
  if (!bron) return { fout: "Op die pagina staat geen uitgelichte afbeelding." };

  const res = await bewaar(w.id, w.naam, bron);
  if (!res.ok && !res.ongewijzigd) return { fout: res.fout ?? "Opslaan lukte niet." };

  await db.workshop.update({ where: { id: workshopId }, data: { siteSlug: slug, afbeeldingControle: false } });
  await logAudit({ userId: u.id, actie: "AFBEELDING_GEKOPPELD", entiteit: "Workshop", entiteitId: workshopId, nieuw: { slug }, ip: ipAdres() });
  revalidatePath("/beheer/workshops");
  return { ok: true };
}
