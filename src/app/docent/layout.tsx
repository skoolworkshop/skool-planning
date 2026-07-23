import { redirect } from "next/navigation";
import { huidigeGebruiker } from "@/lib/auth";
import { db } from "@/lib/db";
import { MobielNav, type NavItem } from "@/components/Navigatie";

export const dynamic = "force-dynamic";

const ITEMS: NavItem[] = [
  { href: "/docent", label: "Home", icoon: "🏠" },
  { href: "/docent/opdrachten", label: "Open opdrachten", icoon: "🔎" },
  { href: "/docent/mijn", label: "Mijn opdrachten", icoon: "📌" },
  { href: "/docent/meldingen", label: "Meldingen", icoon: "🔔" },
  { href: "/docent/profiel", label: "Profiel", icoon: "👤" },
];

export default async function DocentLayout({ children }: { children: React.ReactNode }) {
  const u = await huidigeGebruiker();
  if (!u) redirect("/login");
  if (u.role !== "DOCENT") redirect("/beheer");

  const ongelezen = await db.notification.count({ where: { userId: u.id, gelezen: false } });

  return (
    <div className="min-h-screen">
      <main className="veilig-onder mx-auto max-w-3xl px-4 py-5">{children}</main>
      <MobielNav items={ITEMS} ongelezen={ongelezen} />
    </div>
  );
}
