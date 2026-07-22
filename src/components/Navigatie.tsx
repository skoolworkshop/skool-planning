"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { uitloggen } from "@/lib/acties";

export type NavItem = { href: string; label: string; icoon: string };

export function DesktopNav({
  items,
  naam,
  rol,
  ongelezen,
}: {
  items: NavItem[];
  naam: string;
  rol: string;
  ongelezen: number;
}) {
  const pad = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-col gap-1" aria-label="Hoofdnavigatie">
      {items.map((i) => {
        const actief = pad === i.href || (i.href !== "/beheer" && pad.startsWith(i.href));
        return (
          <Link
            key={i.href}
            href={i.href}
            onClick={() => setOpen(false)}
            aria-current={actief ? "page" : undefined}
            className={`flex min-h-[42px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
              actief ? "bg-skool-50 text-skool-700" : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <span aria-hidden className="w-5 text-center text-base">{i.icoon}</span>
            <span>{i.label}</span>
            {i.href === "/beheer/meldingen" && ongelezen > 0 && (
              <span className="ml-auto rounded-full bg-skool-500 px-2 py-0.5 text-xs font-bold text-white">{ongelezen}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobiele topbalk */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(!open)} className="knop-secundair px-3" aria-expanded={open} aria-label="Menu">
          ☰
        </button>
        <span className="font-bold">Skool Planning</span>
      </header>
      {open && (
        <div className="border-b border-neutral-200 bg-white p-3 lg:hidden">
          {links}
          <form action={uitloggen} className="mt-2">
            <button className="knop-ghost w-full justify-start">Uitloggen</button>
          </form>
        </div>
      )}

      {/* Desktop zijbalk */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-neutral-200 bg-white p-3 lg:flex">
        <Link href="/beheer" className="mb-4 flex items-center gap-2 px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-skool-500 font-black text-white">S</span>
          <span className="text-sm font-bold leading-tight">
            Skool Workshop
            <br />
            <span className="font-normal text-neutral-500">Planning</span>
          </span>
        </Link>
        {links}
        <div className="mt-auto border-t border-neutral-200 pt-3">
          <div className="px-3 pb-2 text-xs">
            <div className="font-semibold">{naam}</div>
            <div className="text-neutral-500">{rol}</div>
          </div>
          <form action={uitloggen}>
            <button className="knop-ghost w-full justify-start text-sm">Uitloggen</button>
          </form>
        </div>
      </aside>
    </>
  );
}

export function MobielNav({ items, ongelezen }: { items: NavItem[]; ongelezen: number }) {
  const pad = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]"
      aria-label="Hoofdnavigatie"
    >
      {items.map((i) => {
        const actief = pad === i.href || (i.href !== "/docent" && pad.startsWith(i.href));
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={actief ? "page" : undefined}
            className={`relative flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              actief ? "text-skool-600" : "text-neutral-500"
            }`}
          >
            <span aria-hidden className="text-lg">{i.icoon}</span>
            {i.label}
            {i.href === "/docent/meldingen" && ongelezen > 0 && (
              <span className="absolute right-4 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-skool-500 px-1 text-[10px] font-bold text-white">
                {ongelezen}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
