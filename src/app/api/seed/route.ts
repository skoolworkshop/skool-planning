import { db } from "@/lib/db";
import { SEED_STAPPEN } from "@/lib/seed-data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function pagina(titel: string, inhoud: string) {
  return new Response(
    `<!doctype html><html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titel}</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:40px auto;padding:0 20px;color:#111;line-height:1.6}
h1{font-size:22px;margin-bottom:4px}
.balk{background:#f3f4f6;border-radius:8px;height:10px;overflow:hidden;margin:16px 0}
.balk div{background:#f47c20;height:100%}
a.knop{display:inline-block;background:#f47c20;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px}
code{background:#f3f4f6;padding:2px 6px;border-radius:4px}
ul{padding-left:20px}
.fout{background:#fef2f2;border:1px solid #fecaca;padding:12px 16px;border-radius:8px;color:#991b1b}
.klaar{background:#ecfdf5;border:1px solid #a7f3d0;padding:12px 16px;border-radius:8px}
small{color:#6b7280}
</style></head><body>${inhoud}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

/**
 * Eenmalige route om de database te vullen met demodata.
 * Werkt alleen met het juiste token uit SEED_TOKEN.
 * Loopt in stappen, zodat elke stap binnen de tijdslimiet past.
 * Zet SEED_TOKEN leeg zodra je systeem in gebruik is.
 */
export async function GET(req: Request) {
  const token = process.env.SEED_TOKEN;
  if (!token) {
    return pagina("Seeden staat uit", `<div class="fout"><b>Seeden staat uit.</b><br>Zet <code>SEED_TOKEN</code> in je omgevingsvariabelen om het aan te zetten.</div>`);
  }

  const url = new URL(req.url);
  const gegeven = url.searchParams.get("token");
  if (gegeven !== token) {
    return pagina("Ongeldig token", `<div class="fout"><b>Ongeldig token.</b><br>Controleer of de waarde achter <code>?token=</code> klopt met <code>SEED_TOKEN</code>.</div>`);
  }

  const nr = Math.max(1, Math.min(SEED_STAPPEN.length, Number(url.searchParams.get("stap") ?? "1")));
  const stap = SEED_STAPPEN[nr - 1];
  const volgende = nr < SEED_STAPPEN.length ? nr + 1 : null;

  let resultaat: Record<string, unknown>;
  try {
    resultaat = (await stap.fn(db)) as Record<string, unknown>;
  } catch (e) {
    const bericht = e instanceof Error ? e.message : "Onbekende fout";
    return pagina(
      "Er ging iets mis",
      `<h1>Stap ${nr} is mislukt</h1>
       <div class="fout">${bericht.replace(/</g, "&lt;")}</div>
       <p><a class="knop" href="?token=${encodeURIComponent(token)}&stap=${nr}">Probeer stap ${nr} opnieuw</a></p>`
    );
  }

  const percentage = Math.round((nr / SEED_STAPPEN.length) * 100);
  const kop = `<h1>Stap ${nr} van ${SEED_STAPPEN.length} klaar</h1>
    <small>${stap.titel}</small>
    <div class="balk"><div style="width:${percentage}%"></div></div>`;

  if (volgende) {
    return pagina(
      `Stap ${nr} klaar`,
      `${kop}
       <p>Klik op de knop om verder te gaan. Elke stap duurt een paar seconden.</p>
       <a class="knop" href="?token=${encodeURIComponent(token)}&stap=${volgende}">Ga naar stap ${volgende}: ${SEED_STAPPEN[volgende - 1].titel}</a>`
    );
  }

  const r = resultaat as {
    wachtwoord?: string;
    accounts?: string[];
    inschrijving?: { titel: string; leerlingen: number; klasCodes: string[]; schoolCode: string };
  };

  return pagina(
    "Klaar",
    `${kop}
     <div class="klaar"><b>De database is gevuld met demodata.</b></div>
     <h3>Inloggen</h3>
     <p>Wachtwoord voor alle accounts: <code>${r.wachtwoord ?? ""}</code></p>
     <ul>${(r.accounts ?? []).map((a) => `<li><code>${a}</code></li>`).join("")}</ul>
     <h3>Demo-inschrijving</h3>
     <p>${r.inschrijving?.titel ?? ""} met ${r.inschrijving?.leerlingen ?? 0} leerlingen.</p>
     <ul>${(r.inschrijving?.klasCodes ?? []).map((c) => `<li>Klascode <code>${c}</code></li>`).join("")}
     <li>Schoolportaal <code>${r.inschrijving?.schoolCode ?? ""}</code></li></ul>
     <p><b>Schrijf deze codes over.</b> Met een klascode ga je naar <code>/inschrijven</code>, met de schoolcode naar <code>/inschrijven/school</code>.</p>
     <h3>Nog één ding</h3>
     <p>Maak <code>SEED_TOKEN</code> nu leeg in je omgevingsvariabelen en doe een redeploy. Anders kan iemand anders deze pagina ook openen.</p>
     <a class="knop" href="/login">Ga naar het inlogscherm</a>`
  );
}
