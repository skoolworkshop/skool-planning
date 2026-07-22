import "server-only";
import { db } from "./db";

export async function logAudit(opts: {
  userId?: string | null;
  actie: string;
  entiteit: string;
  entiteitId?: string | null;
  oud?: unknown;
  nieuw?: unknown;
  ip?: string | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        actie: opts.actie,
        entiteit: opts.entiteit,
        entiteitId: opts.entiteitId ?? null,
        oud: opts.oud ? JSON.stringify(opts.oud).slice(0, 4000) : null,
        nieuw: opts.nieuw ? JSON.stringify(opts.nieuw).slice(0, 4000) : null,
        ip: opts.ip ?? null,
      },
    });
  } catch {
    // Auditlog mag een gebruikersactie nooit blokkeren.
  }
}
