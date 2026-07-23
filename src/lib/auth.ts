import "server-only";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { Role } from "@prisma/client";

const COOKIE = "sw_session";
const MAX_LEEFTIJD = 60 * 60 * 24 * 14; // 14 dagen

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET ontbreekt of is te kort. Zet een string van minimaal 32 tekens in .env");
  }
  return new TextEncoder().encode(s);
}

export type Sessie = { userId: string; role: Role; epoch: number };

export async function hashWachtwoord(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function checkWachtwoord(pw: string, hash: string | null) {
  if (!hash) return false;
  return bcrypt.compare(pw, hash);
}

export async function maakSessie(userId: string, role: Role, epoch: number, onthoud: boolean) {
  const token = await new SignJWT({ role, epoch })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(onthoud ? "14d" : "12h")
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: onthoud ? MAX_LEEFTIJD : undefined,
  });
}

export function verwijderSessie() {
  cookies().delete(COOKIE);
}

export async function leesSessie(): Promise<Sessie | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: String(payload.sub), role: payload.role as Role, epoch: Number(payload.epoch ?? 0) };
  } catch {
    return null;
  }
}

/** Haalt de ingelogde gebruiker op en controleert of de sessie nog geldig is. */
export async function huidigeGebruiker() {
  const s = await leesSessie();
  if (!s) return null;
  const user = await db.user.findUnique({
    where: { id: s.userId },
    include: { teacher: { select: { id: true, voornaam: true, achternaam: true, status: true } } },
  });
  if (!user || !user.active || user.deletedAt) return null;
  if (user.sessionEpoch !== s.epoch) return null; // uitgelogd op alle apparaten
  return user;
}

export type Gebruiker = NonNullable<Awaited<ReturnType<typeof huidigeGebruiker>>>;

export async function vereisGebruiker() {
  const u = await huidigeGebruiker();
  if (!u) throw new Error("NIET_INGELOGD");
  return u;
}

export async function vereisRol(...rollen: Role[]) {
  const u = await vereisGebruiker();
  if (!rollen.includes(u.role)) throw new Error("GEEN_RECHTEN");
  return u;
}

export function ipAdres() {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

/** Eenvoudige rate limiting in geheugen. Voor productie vervangen door Redis of Upstash. */
const pogingen = new Map<string, { n: number; tot: number }>();
export function rateLimit(sleutel: string, max = 10, vensterMs = 60_000) {
  const nu = Date.now();
  const huidig = pogingen.get(sleutel);
  if (!huidig || huidig.tot < nu) {
    pogingen.set(sleutel, { n: 1, tot: nu + vensterMs });
    return true;
  }
  huidig.n += 1;
  return huidig.n <= max;
}
