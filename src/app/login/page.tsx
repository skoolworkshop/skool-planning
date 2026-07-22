import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPagina() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zand-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Skool Workshop" className="h-12 w-auto" />
          <div className="mt-1 text-sm text-zand-500">Planningsysteem</div>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-neutral-400">
          Nog geen account? Vraag een uitnodiging aan via je planner of{" "}
          <a href="/registreren" className="font-medium text-skool-600 underline">
            meld je hier aan
          </a>
          .
        </p>
      </div>
    </main>
  );
}
