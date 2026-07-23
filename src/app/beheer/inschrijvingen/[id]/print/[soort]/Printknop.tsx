"use client";

export default function Printknop() {
  return (
    <div className="mb-4 flex gap-2 print:hidden">
      <button className="knop-primair" onClick={() => window.print()}>Printen of opslaan als PDF</button>
      <button className="knop-secundair" onClick={() => history.back()}>Terug</button>
    </div>
  );
}
