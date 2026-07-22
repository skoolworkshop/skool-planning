import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPagina() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-skool-500 text-lg font-black text-white">S</div>
          <div>
            <div className="text-lg font-bold leading-tight">Skool Workshop</div>
            <div className="text-sm text-neutral-500">Planningsysteem</div>
          </div>
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
