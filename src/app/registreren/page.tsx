import Link from "next/link";
import Formulier from "./Formulier";

export const metadata = { title: "Aanmelden als docent | Skool Workshop" };

export default function RegistrerenPagina() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight">Skool Workshop</div>
        <h1 className="mt-4 text-xl font-bold">Aanmelden als docent</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Maak een account aan, vul je profiel in en wij nemen contact op.
        </p>
      </div>
      <Formulier />
      <p className="mt-6 text-center text-sm text-neutral-500">
        Heb je al een account? <Link href="/login" className="font-medium text-skool-600 hover:underline">Inloggen</Link>
      </p>
    </div>
  );
}
