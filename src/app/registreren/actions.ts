"use server";

import { db } from "@/lib/db";
import { hashWachtwoord, maakSessie, ipAdres, rateLimit } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { meld } from "@/lib/notify";

// PUBLIEK: open aanmeldformulier voor nieuwe workshopdocenten
export async function registreren(formData: FormData) {
  const ip = ipAdres() ?? "onbekend";
  if (!rateLimit(`reg:${ip}`, 5, 15 * 60_000)) {
    return { fout: "Te veel pogingen. Probeer het over een kwartier opnieuw." };
  }

  const voornaam = String(formData.get("voornaam") ?? "").trim();
  const achternaam = String(formData.get("achternaam") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telefoon = String(formData.get("telefoon") ?? "").trim();
  const wachtwoord = String(formData.get("wachtwoord") ?? "");
  const akkoord = formData.get("akkoord") === "on";

  if (!voornaam || !achternaam) return { fout: "Vul je voor- en achternaam in." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { fout: "Vul een geldig e-mailadres in." };
  if (wachtwoord.length < 10) return { fout: "Kies een wachtwoord van minimaal 10 tekens." };
  if (!akkoord) return { fout: "Ga akkoord met de privacyverklaring om verder te gaan." };

  const bestaat = await db.user.findUnique({ where: { email } });
  if (bestaat) return { fout: "Er bestaat al een account met dit e-mailadres. Log in of vraag een nieuw wachtwoord aan." };

  const user = await db.user.create({
    data: {
      email,
      passwordHash: await hashWachtwoord(wachtwoord),
      role: "DOCENT",
      emailVerified: new Date(),
      teacher: {
        create: {
          voornaam,
          achternaam,
          telefoon: telefoon || null,
          status: "REGISTRATIE_GESTART",
        },
      },
    },
    include: { teacher: true },
  });

  await meld({
    userId: user.id,
    email: user.email,
    sleutel: "REGISTRATIE_ONTVANGEN",
    vars: { voornaam },
    link: `${process.env.APP_URL ?? ""}/docent/profiel`,
    idempotencyKey: `reg:${user.id}`,
  });

  await logAudit({ userId: user.id, actie: "REGISTRATIE", entiteit: "User", entiteitId: user.id, ip });
  await maakSessie(user.id, user.role, user.sessionEpoch, false);
  return { ok: true };
}
