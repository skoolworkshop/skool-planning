"use server";

import { redirect } from "next/navigation";
import { verwijderSessie, huidigeGebruiker } from "@/lib/auth";
import { db } from "@/lib/db";

// PUBLIEK: uitloggen mag altijd, het wist alleen de eigen sessiecookie
export async function uitloggen() {
  verwijderSessie();
  redirect("/login");
}

export async function uitloggenOveral() {
  const u = await huidigeGebruiker();
  if (u) await db.user.update({ where: { id: u.id }, data: { sessionEpoch: { increment: 1 } } });
  verwijderSessie();
  redirect("/login");
}
