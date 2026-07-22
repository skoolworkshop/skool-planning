import Formulier from "./Formulier";

export const dynamic = "force-dynamic";

export default function WachtwoordPagina({ params }: { params: { token: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-skool-500 text-lg font-black text-white">S</div>
          <div className="text-lg font-bold">Skool Workshop</div>
        </div>
        <Formulier token={params.token} />
      </div>
    </main>
  );
}
