export const metadata = { title: "Inschrijven | Skool Workshop" };

export default function InschrijvenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zand-100">
      <header className="border-b border-zand-200 bg-white">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="font-bold tracking-tight">Skool Workshop</div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-5 pb-24">{children}</main>
    </div>
  );
}
