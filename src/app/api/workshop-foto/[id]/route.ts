import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Serveert de opgeslagen workshopfoto uit de database.
 * Zo hoeven we niet permanent naar de website te hotlinken.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const foto = await db.workshopAfbeelding.findUnique({
    where: { workshopId: params.id },
    select: { data: true, mimeType: true, hash: true },
  });
  if (!foto) return new Response("Niet gevonden", { status: 404 });

  return new Response(new Uint8Array(foto.data), {
    headers: {
      "content-type": foto.mimeType,
      "cache-control": "public, max-age=31536000, immutable",
      etag: `"${foto.hash}"`,
    },
  });
}
