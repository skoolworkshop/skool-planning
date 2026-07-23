import { redirect } from "next/navigation";
import { huidigeGebruiker } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROL_LABEL } from "@/lib/rbac";
import { DesktopNav, type NavItem } from "@/components/Navigatie";

export const dynamic = "force-dynamic";

const ITEMS: NavItem[] = [
  { href: "/beheer", label: "Dashboard", icoon: "🏠" },
  { href: "/beheer/opdrachten", label: "Opdrachten", icoon: "📌" },
  { href: "/beheer/aanmeldingen", label: "Aanmeldingen", icoon: "✋" },
  { href: "/beheer/inschrijvingen", label: "Inschrijvingen", icoon: "📝" },
  { href: "/beheer/docenten", label: "Workshopdocenten", icoon: "👥" },
  { href: "/beheer/klanten", label: "Klanten", icoon: "🏫" },
  { href: "/beheer/workshops", label: "Workshops", icoon: "🎨" },
  { href: "/beheer/financieel", label: "Financieel", icoon: "💶" },
  { href: "/beheer/rapportages", label: "Rapportages", icoon: "📊" },
  { href: "/beheer/instellingen", label: "Instellingen", icoon: "⚙️" },
];

export default async function BeheerLayout({ children }: { children: React.ReactNode }) {
  const u = await huidigeGebruiker();
  if (!u) redirect("/login");
  if (u.role === "DOCENT") redirect("/docent");

  const ongelezen = await db.notification.count({ where: { userId: u.id, gelezen: false } });
  const naam = u.teacher ? `${u.teacher.voornaam} ${u.teacher.achternaam}` : u.email;

  return (
    <div className="min-h-screen">
      <DesktopNav items={ITEMS} naam={naam} rol={ROL_LABEL[u.role]} ongelezen={ongelezen} />
      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:ml-60 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
