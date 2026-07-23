import "server-only";
import { db } from "./db";
import type { Channel } from "@prisma/client";
import { TEMPLATES, vul } from "./berichten";

export { TEMPLATES };

/**
 * Notificatiemodule.
 * Kanalen: app, e-mail, WhatsApp. In ontwikkelmodus wordt niets echt verstuurd,
 * maar alles gelogd in MessageLog zodat je het in de app kunt terugzien.
 * Verzenden is idempotent via idempotencyKey, zodat een bericht nooit dubbel gaat.
 */

const DEV = (process.env.NOTIFY_MODE ?? "dev") !== "live";

async function verstuur(opts: {
  kanaal: Channel;
  ontvanger: string;
  sleutel: string;
  onderwerp: string | null;
  inhoud: string;
  idempotencyKey?: string;
}) {
  if (opts.idempotencyKey) {
    const bestaat = await db.messageLog.findUnique({ where: { idempotencyKey: opts.idempotencyKey } });
    if (bestaat) return; // al verstuurd, niet nog een keer
  }

  let status = DEV ? "DEV" : "VERZONDEN";
  let fout: string | null = null;

  if (!DEV) {
    try {
      if (opts.kanaal === "EMAIL") await emailProvider(opts.ontvanger, opts.onderwerp ?? "", opts.inhoud);
      if (opts.kanaal === "WHATSAPP") await whatsappProvider(opts.ontvanger, opts.inhoud);
    } catch (e) {
      status = "MISLUKT";
      fout = e instanceof Error ? e.message : String(e);
    }
  }

  await db.messageLog.create({
    data: { ...opts, onderwerp: opts.onderwerp, status, fout, idempotencyKey: opts.idempotencyKey ?? null },
  });
}

/** E-mail provider abstraction. Standaard Resend, eenvoudig te vervangen. */
async function emailProvider(naar: string, onderwerp: string, tekst: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY ontbreekt");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: naar, subject: onderwerp, text: tekst }),
  });
  if (!res.ok) throw new Error(`Resend fout ${res.status}`);
}

/** Officiële WhatsApp Business API via Meta Cloud API. Geen onofficiële automatisering. */
async function whatsappProvider(naar: string, tekst: string) {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!id || !token) throw new Error("WhatsApp instellingen ontbreken");
  const res = await fetch(`https://graph.facebook.com/v20.0/${id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: naar, type: "text", text: { body: tekst } }),
  });
  if (!res.ok) throw new Error(`WhatsApp fout ${res.status}`);
}

/**
 * Stuurt een bericht over alle gewenste kanalen.
 * Maakt altijd een in-app notificatie aan, plus e-mail en optioneel WhatsApp.
 */
export async function meld(opts: {
  userId: string;
  email: string;
  telefoon?: string | null;
  sleutel: keyof typeof TEMPLATES;
  vars: Record<string, string | undefined>;
  link?: string;
  whatsapp?: boolean;
  idempotencyKey?: string;
}) {
  const tpl = TEMPLATES[opts.sleutel];
  const vars = { ...opts.vars, link: opts.link ?? opts.vars.link };
  const onderwerp = vul(tpl.onderwerp, vars);
  const inhoud = vul(tpl.tekst, vars);

  await db.notification.create({
    data: { userId: opts.userId, titel: onderwerp, tekst: inhoud, link: opts.link ?? null },
  });

  await verstuur({
    kanaal: "EMAIL",
    ontvanger: opts.email,
    sleutel: opts.sleutel,
    onderwerp,
    inhoud,
    idempotencyKey: opts.idempotencyKey ? `${opts.idempotencyKey}:email` : undefined,
  });

  if (opts.whatsapp && opts.telefoon) {
    await verstuur({
      kanaal: "WHATSAPP",
      ontvanger: opts.telefoon,
      sleutel: opts.sleutel,
      onderwerp: null,
      inhoud,
      idempotencyKey: opts.idempotencyKey ? `${opts.idempotencyKey}:wa` : undefined,
    });
  }
}

export const notifyDevMode = DEV;
