"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checkWachtwoord, maakSessie, ipAdres, rateLimit, hashWachtwoord } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { meld } from "@/lib/notify";
import crypto from "crypto";

export type LoginState = { fout?: string };

// PUBLIEK: iedereen mag inloggen, wel met een snelheidslimiet
export async function inloggen(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const wachtwoord = String(formData.get("wachtwoord") ?? "");
  const onthoud = formData.get("onthoud") === "on";
  const ip = ipAdres() ?? "onbekend";

  if (!email || !wachtwoord) return { fout: "Vul je e-mailadres en wachtwoord in." };
  if (!rateLimit(`login:${ip}`, 20, 60_000)) return { fout: "Te veel pogingen. Probeer het over een minuut opnieuw." };

  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.active || user.deletedAt) {
    await logAudit({ actie: "LOGIN_MISLUKT", entiteit: "User", nieuw: { email }, ip });
    return { fout: "Onjuiste combinatie van e-mailadres en wachtwoord." };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { fout: "Dit account is tijdelijk geblokkeerd. Probeer het later opnieuw." };
  }

  const ok = await checkWachtwoord(wachtwoord, user.passwordHash);
  if (!ok) {
    const n = user.failedLogins + 1;
    await db.user.update({
      where: { id: user.id },
      data: { failedLogins: n, lockedUntil: n >= 8 ? new Date(Date.now() + 15 * 60_000) : null },
    });
    await logAudit({ userId: user.id, actie: "LOGIN_MISLUKT", entiteit: "User", entiteitId: user.id, ip });
    return { fout: "Onjuiste combinatie van e-mailadres en wachtwoord." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await maakSessie(user.id, user.role, user.sessionEpoch, onthoud);
  await logAudit({ userId: user.id, actie: "LOGIN", entiteit: "User", entiteitId: user.id, ip });

  redirect(user.role === "DOCENT" ? "/docent" : "/beheer");
}

// PUBLIEK: iedereen mag een resetlink aanvragen, wel met een snelheidslimiet
export async function wachtwoordVergeten(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!rateLimit(`reset:${email}`, 3, 15 * 60_000)) {
    return { fout: "Je hebt dit al een paar keer aangevraagd. Kijk even in je mailbox." };
  }
  const user = await db.user.findUnique({ where: { email }, include: { teacher: true } });
  if (user) {
    const token = crypto.randomUUID().replace(/-/g, "");
    await db.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetExpires: new Date(Date.now() + 60 * 60_000) },
    });
    await meld({
      userId: user.id,
      email: user.email,
      sleutel: "WACHTWOORD_RESET",
      vars: { voornaam: user.teacher?.voornaam ?? "" },
      link: `${process.env.APP_URL}/wachtwoord/${token}`,
    });
  }
  // Altijd dezelfde melding, zodat je niet kunt achterhalen welke adressen bestaan.
  return { fout: "Als dit adres bij ons bekend is, staat er een e-mail voor je klaar." };
}

// PUBLIEK: beveiligd met een eenmalige token uit de mail
export async function wachtwoordInstellen(token: string, wachtwoord: string) {
  const user = await db.user.findFirst({
    where: { OR: [{ resetToken: token }, { inviteToken: token }] },
  });
  if (!user) return { fout: "Deze link is niet geldig." };

  const isInvite = user.inviteToken === token;
  const vervalt = isInvite ? user.inviteExpires : user.resetExpires;
  if (!vervalt || vervalt < new Date()) return { fout: "Deze link is verlopen. Vraag een nieuwe aan." };
  if (wachtwoord.length < 10) return { fout: "Kies een wachtwoord van minimaal 10 tekens." };

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashWachtwoord(wachtwoord),
      resetToken: null,
      resetExpires: null,
      inviteToken: null,
      inviteExpires: null,
      emailVerified: new Date(),
      failedLogins: 0,
      lockedUntil: null,
      sessionEpoch: { increment: 1 },
    },
  });

  if (isInvite) {
    await db.teacherProfile.updateMany({
      where: { userId: user.id, status: "UITGENODIGD" },
      data: { status: "REGISTRATIE_GESTART" },
    });
  }

  await logAudit({ userId: user.id, actie: isInvite ? "ACCOUNT_GEACTIVEERD" : "WACHTWOORD_GEWIJZIGD", entiteit: "User", entiteitId: user.id });
  return { ok: true };
}
