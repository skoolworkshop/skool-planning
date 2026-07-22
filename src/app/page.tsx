import { redirect } from "next/navigation";
import { huidigeGebruiker } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const u = await huidigeGebruiker();
  if (!u) redirect("/login");
  redirect(u.role === "DOCENT" ? "/docent" : "/beheer");
}
