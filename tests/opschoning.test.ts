import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { leesMaand, maandSleutel, maandOpties } from "../src/lib/maand";
import { DOELGROEPEN, doelgroepLabel, herkenDoelgroep, herkenDoelgroepen, isDoelgroep } from "../src/lib/doelgroepen";
import { kentVervaldatum, isVerlopen, isGeldig, toonStatus, ontbrekendeDocumenten } from "../src/lib/documenten";
import { TEMPLATES } from "../src/lib/berichten";

const WORTEL = join(__dirname, "..");

function bestaat(pad: string) {
  return existsSync(join(WORTEL, pad));
}

function alleBronbestanden(map = "src"): string[] {
  const uit: string[] = [];
  const loop = (p: string) => {
    for (const item of readdirSync(join(WORTEL, p), { withFileTypes: true })) {
      const kind = `${p}/${item.name}`;
      if (item.isDirectory()) loop(kind);
      else if (/\.tsx?$/.test(item.name)) uit.push(kind);
    }
  };
  loop(map);
  return uit;
}

const BRON = alleBronbestanden().map((p) => ({ pad: p, inhoud: readFileSync(join(WORTEL, p), "utf8") }));

/* ---------------- dashboard en maanden ---------------- */

test("dashboard toont standaard de huidige maand", () => {
  const nu = new Date();
  const m = leesMaand(undefined);
  assert.equal(m.isHuidige, true);
  assert.equal(m.sleutel, maandSleutel(nu));
});

test("dashboard wisselt correct tussen maanden", () => {
  const m = leesMaand("2026-03");
  assert.equal(m.sleutel, "2026-03");
  assert.equal(m.vorige, "2026-02");
  assert.equal(m.volgende, "2026-04");
  assert.equal(m.isHuidige, false);
  assert.equal(m.start.getMonth(), 2);
  assert.equal(m.eind.getMonth(), 2);
  assert.equal(m.eind.getDate(), 31);
});

test("een jaargrens werkt in beide richtingen", () => {
  assert.equal(leesMaand("2026-01").vorige, "2025-12");
  assert.equal(leesMaand("2026-12").volgende, "2027-01");
});

test("een onzinnige maand valt terug op de huidige maand", () => {
  for (const rommel of ["kaas", "2026-13", "0000-00", ""]) {
    assert.equal(leesMaand(rommel).isHuidige, true);
  }
});

test("de maandkeuzelijst bevat de huidige maand", () => {
  const opties = maandOpties();
  assert.ok(opties.some((o) => o.waarde === maandSleutel(new Date())));
});

test("documenten staan niet meer op het dashboard", () => {
  const dashboard = readFileSync(join(WORTEL, "src/app/beheer/page.tsx"), "utf8");
  for (const woord of ["VOG", "vervaldatum", "document", "Document", "contract", "Contract"]) {
    assert.ok(!dashboard.includes(woord), `dashboard bevat nog "${woord}"`);
  }
});

/* ---------------- VOG zonder verloopdatum ---------------- */

test("een VOG kent geen vervaldatum", () => {
  assert.equal(kentVervaldatum("VOG"), false);
  assert.equal(kentVervaldatum("IDENTITEITSBEWIJS"), true);
});

test("een VOG verloopt nooit, ook niet met een oude datum in de database", () => {
  const oud = new Date("2000-01-01");
  const vog = { type: "VOG" as const, status: "GOEDGEKEURD" as const, vervaldatum: oud };
  assert.equal(isVerlopen(vog), false);
  assert.equal(isGeldig(vog), true);
  assert.equal(toonStatus(vog), "GOEDGEKEURD");
});

test("een identiteitsbewijs verloopt wel", () => {
  const oud = { type: "IDENTITEITSBEWIJS" as const, status: "GOEDGEKEURD" as const, vervaldatum: new Date("2000-01-01") };
  assert.equal(isVerlopen(oud), true);
  assert.equal(isGeldig(oud), false);
  assert.equal(toonStatus(oud), "VERLOPEN");
});

test("ontbrekende documenten worden herkend zonder de VOG mee te tellen", () => {
  const docs = [
    { type: "VOG" as const, status: "GOEDGEKEURD" as const, vervaldatum: new Date("1999-01-01") },
    { type: "IDENTITEITSBEWIJS" as const, status: "GOEDGEKEURD" as const, vervaldatum: new Date("1999-01-01") },
  ];
  assert.deepEqual(ontbrekendeDocumenten(["VOG", "IDENTITEITSBEWIJS"], docs), ["IDENTITEITSBEWIJS"]);
});

test("nergens in de code staat nog een verloopcontrole op een VOG", () => {
  for (const b of BRON) {
    if (b.pad.endsWith("documenten.ts")) continue;
    assert.ok(!/VOG[^\\n]*vervaldatum|vervaldatum[^\\n]*VOG/.test(b.inhoud), `${b.pad} koppelt VOG nog aan een vervaldatum`);
  }
});

/* ---------------- verwijderde modules ---------------- */

test("de planningmodule is nergens meer bereikbaar", () => {
  assert.equal(bestaat("src/app/beheer/planning"), false);
  assert.equal(bestaat("src/app/docent/kalender"), false);
  for (const b of BRON) {
    assert.ok(!b.inhoud.includes("/beheer/planning"), `${b.pad} verwijst nog naar de planning`);
    assert.ok(!b.inhoud.includes("/docent/kalender"), `${b.pad} verwijst nog naar de kalender`);
  }
});

test("het oude projectenoverzicht bestaat niet meer", () => {
  assert.equal(bestaat("src/app/beheer/projecten"), false);
  for (const b of BRON) {
    assert.ok(!b.inhoud.includes("/beheer/projecten"), `${b.pad} verwijst nog naar projecten`);
  }
});

test("opdrachten vormen één omgeving met een detail en een moment", () => {
  assert.ok(bestaat("src/app/beheer/opdrachten/page.tsx"));
  assert.ok(bestaat("src/app/beheer/opdrachten/[id]/page.tsx"));
  assert.ok(bestaat("src/app/beheer/opdrachten/moment/[id]/page.tsx"));
  assert.ok(bestaat("src/app/beheer/opdrachten/nieuw/page.tsx"));
});

test("de reservelijst is nergens meer aanwezig", () => {
  for (const b of BRON) {
    assert.ok(!b.inhoud.includes("RESERVELIJST"), `${b.pad} kent nog een reservelijst`);
    assert.ok(!/\breserve:\s/.test(b.inhoud), `${b.pad} zet nog een reserveveld`);
  }
});

test("de beheernavigatie klopt met de nieuwe indeling", () => {
  const layout = readFileSync(join(WORTEL, "src/app/beheer/layout.tsx"), "utf8");
  for (const goed of ["/beheer/opdrachten", "/beheer/aanmeldingen", "/beheer/docenten", "/beheer/klanten", "/beheer/workshops", "/beheer/financieel", "/beheer/rapportages", "/beheer/instellingen"]) {
    assert.ok(layout.includes(goed), `navigatie mist ${goed}`);
  }
  assert.ok(!layout.includes('label: "Projecten"'));
  assert.ok(!layout.includes('label: "Planning"'));
});

test("de docentnavigatie klopt met de nieuwe indeling", () => {
  const layout = readFileSync(join(WORTEL, "src/app/docent/layout.tsx"), "utf8");
  for (const goed of ["/docent", "/docent/opdrachten", "/docent/mijn", "/docent/meldingen", "/docent/profiel"]) {
    assert.ok(layout.includes(goed), `docentnavigatie mist ${goed}`);
  }
});

/* ---------------- toewijzing en bevestiging ---------------- */

test("een toewijzing is direct definitief, zonder bevestigingsstap", () => {
  const acties = readFileSync(join(WORTEL, "src/lib/planning-acties.ts"), "utf8");
  assert.ok(acties.includes("direct definitief"));
  assert.ok(!acties.includes("bevestigd:"));
  for (const b of BRON) {
    assert.ok(!b.inhoud.includes("opdrachtBevestigen"), `${b.pad} kent nog een bevestigactie`);
  }
});

test("de toewijzing controleert bevoegdheid, documenten en dubbele boeking", () => {
  const acties = readFileSync(join(WORTEL, "src/lib/planning-acties.ts"), "utf8");
  assert.ok(acties.includes("NIET_INZETBAAR"));
  assert.ok(acties.includes("vereisteDocumenten"));
  assert.ok(acties.includes("al een opdracht"));
});

test("het inplanbericht vraagt niet meer om een bevestiging", () => {
  const t = TEMPLATES.GESELECTEERD.tekst;
  assert.ok(t.includes("definitief ingepland"));
  assert.ok(t.includes("Je hoeft niets te bevestigen"));
  assert.ok(!TEMPLATES.OPDRACHT_GEWIJZIGD.onderwerp.includes("bevestig"));
  assert.equal(TEMPLATES.RESERVELIJST, undefined);
});

/* ---------------- zelfbeoordeling en bio ---------------- */

test("een workshopdocent kan zichzelf niet meer beoordelen of koppelen", () => {
  for (const b of BRON) {
    assert.ok(!b.inhoud.includes("workshopKoppelen"), `${b.pad} laat zelf koppelen nog toe`);
    assert.ok(!/skill\.niveau|zelfbeoordeling/.test(b.inhoud), `${b.pad} kent nog een zelfbeoordeling`);
  }
  assert.equal(bestaat("src/app/docent/profiel/WorkshopKiezer.tsx"), false);
  assert.ok(bestaat("src/app/docent/profiel/MijnWorkshops.tsx"));
});

test("alleen een beheerder zet de bevoegdheid", () => {
  const acties = readFileSync(join(WORTEL, "src/lib/opdracht-acties.ts"), "utf8");
  assert.ok(acties.includes("export async function bevoegdheidZetten"));
  const blok = acties.slice(acties.indexOf("export async function bevoegdheidZetten"));
  assert.ok(blok.includes("vereisRol(...BEHEER)"));
});

test("de bio is uit de docentomgeving verwijderd", () => {
  const schema = readFileSync(join(WORTEL, "prisma/schema.prisma"), "utf8");
  assert.ok(!/^\s*bio\s+String/m.test(schema), "schema kent nog een bioveld");
  for (const b of BRON) {
    assert.ok(!/name="bio"|profiel\.bio|teacher\.bio/.test(b.inhoud), `${b.pad} kent nog een bio`);
  }
});

/* ---------------- tarieven ---------------- */

test("een workshopdocent kan zijn eigen tarief niet opslaan", () => {
  const acties = readFileSync(join(WORTEL, "src/lib/docent-acties.ts"), "utf8");
  const blok = acties.slice(acties.indexOf("export async function profielOpslaan"));
  for (const veld of ["uurtarief", "minDagtarief", "kmVergoeding"]) {
    assert.ok(!blok.includes(`${veld}: getal(`), `profielOpslaan zet nog ${veld}`);
  }
});

test("een workshopdocent ziet zijn tarieven wel", () => {
  const formulier = readFileSync(join(WORTEL, "src/app/docent/profiel/ProfielFormulier.tsx"), "utf8");
  assert.ok(formulier.includes("Jouw tarieven"));
  assert.ok(formulier.includes("beheerd door Skool Workshop"));
  assert.ok(!formulier.includes('naam="uurtarief"'));
});

test("een beheerder kan per workshopdocent een tarief zetten en dat wordt gelogd", () => {
  const acties = readFileSync(join(WORTEL, "src/lib/tarief-acties.ts"), "utf8");
  const blok = acties.slice(acties.indexOf("export async function docentTariefOpslaan"));
  assert.ok(blok.includes("vereisRol(...BEHEER)"));
  assert.ok(blok.includes("tariefHistorie.create"));
  assert.ok(blok.includes("logAudit"));
  assert.ok(blok.includes("oudeWaarde"));
  assert.ok(blok.includes("nieuweWaarde"));
});

/* ---------------- doelgroepen ---------------- */

test("de doelgroeplijst bevat alle gevraagde waarden", () => {
  assert.equal(DOELGROEPEN.length, 17);
  for (const w of ["PRIMAIR_ONDERWIJS", "VOORTGEZET_ONDERWIJS", "SPECIAAL_ONDERWIJS", "MBO", "HBO", "UNIVERSITEIT", "BUITENSCHOOLSE_OPVANG", "KINDEROPVANG", "BIBLIOTHEEK", "JEUGDINSTELLING", "ZORGINSTELLING", "GEMEENTE", "BEDRIJF", "PARTICULIER", "VOLWASSENEN", "SENIOREN", "OVERIG"]) {
    assert.ok(isDoelgroep(w), `${w} ontbreekt`);
  }
  assert.equal(doelgroepLabel("BUITENSCHOOLSE_OPVANG"), "Buitenschoolse opvang");
});

test("oude vrije tekst wordt omgezet naar een vaste doelgroep", () => {
  assert.equal(herkenDoelgroep("Bovenbouw PO"), "PRIMAIR_ONDERWIJS");
  assert.equal(herkenDoelgroep("VO"), "VOORTGEZET_ONDERWIJS");
  assert.equal(herkenDoelgroep("vmbo 3"), "VOORTGEZET_ONDERWIJS");
  assert.equal(herkenDoelgroep("BSO"), "BUITENSCHOOLSE_OPVANG");
  assert.equal(herkenDoelgroep("Speciaal onderwijs"), "SPECIAAL_ONDERWIJS");
  assert.equal(herkenDoelgroep("teamuitje"), "BEDRIJF");
  assert.equal(herkenDoelgroep("MBO"), "MBO");
});

test("wat niet herkend wordt komt in een controlelijst", () => {
  const r = herkenDoelgroepen(["VO", "iets heel raars", "", null, "BSO"]);
  assert.deepEqual(r.herkend, ["VOORTGEZET_ONDERWIJS", "BUITENSCHOOLSE_OPVANG"]);
  assert.deepEqual(r.onbekend, ["iets heel raars"]);
});

test("doelgroep is nergens meer een vrij tekstveld", () => {
  for (const b of BRON) {
    assert.ok(!/<input[^>]*name="doelgroep"[^>]*type="text"/.test(b.inhoud), `${b.pad} heeft nog een vrij doelgroepveld`);
  }
});

/* ---------------- workshopfoto's ---------------- */

test("foto's worden opgeslagen en niet gehotlinkt", () => {
  const schema = readFileSync(join(WORTEL, "prisma/schema.prisma"), "utf8");
  assert.ok(schema.includes("model WorkshopAfbeelding"));
  assert.ok(schema.includes("afbeeldingAlt"));
  assert.ok(schema.includes("bronPaginaUrl"));
  assert.ok(schema.includes("bronAfbeeldingUrl"));
  assert.ok(schema.includes("afbeeldingGesyncedOp"));
  assert.ok(bestaat("src/app/api/workshop-foto/[id]/route.ts"));
});

test("de synchronisatie probeert eerst de rest api en daarna og:image", () => {
  const mod = readFileSync(join(WORTEL, "src/lib/afbeeldingen.ts"), "utf8");
  assert.ok(mod.includes("wp-json/wp/v2"));
  assert.ok(mod.includes("og:image"));
  assert.ok(mod.includes("sha256"), "dubbele downloads worden niet herkend");
  assert.ok(mod.includes("afbeeldingControle"), "er is geen controlelijst");
});

test("workshopfoto's hebben een alt-tekst en laden lui", () => {
  const paginas = BRON.filter((b) => b.inhoud.includes("afbeeldingUrl") && b.inhoud.includes("<img"));
  assert.ok(paginas.length >= 3, "te weinig plekken tonen een workshopfoto");
  for (const b of paginas) {
    assert.ok(b.inhoud.includes('loading="lazy"'), `${b.pad} laadt afbeeldingen niet lui`);
    assert.ok(b.inhoud.includes("object-cover"), `${b.pad} kan afbeeldingen uitrekken`);
  }
});

/* ---------------- rollen ---------------- */

test("alle serveracties controleren een rol of zijn bewust publiek", () => {
  const actiebestanden = BRON.filter((b) => b.inhoud.startsWith('"use server"'));
  assert.ok(actiebestanden.length >= 4);
  for (const b of actiebestanden) {
    const stukken = b.inhoud.split(/export async function /);
    for (let i = 1; i < stukken.length; i++) {
      const naam = stukken[i].slice(0, stukken[i].indexOf("("));
      const kop = stukken[i].slice(0, 900);
      // Een actie is afgeschermd, of hij staat er expliciet als publiek bij
      const gemarkeerd = /PUBLIEK:/.test(stukken[i - 1].split("\n").slice(-6).join("\n"));
      const heeftCheck = /vereisRol|vereisGebruiker|vereisPlanner|huidigeGebruiker|mijnProfiel|huidigeLeerling|leerlingSessie|leesCode/.test(kop);
      assert.ok(heeftCheck || gemarkeerd, `${b.pad}: ${naam} controleert geen rol en is niet als publiek gemarkeerd`);
    }
  }
});

test("geen enkele beheeractie is per ongeluk publiek", () => {
  const beheer = ["docentToewijzen", "bevoegdheidZetten", "docentTariefOpslaan", "tarievenOpslaan", "afbeeldingenSynchroniseren", "afbeeldingHandmatig", "klantGegevensOpslaan", "rondesOpslaan"];
  for (const naam of beheer) {
    const bestand = BRON.find((b) => b.inhoud.includes(`export async function ${naam}(`));
    assert.ok(bestand, `${naam} bestaat niet meer`);
    const blok = bestand!.inhoud.slice(bestand!.inhoud.indexOf(`export async function ${naam}(`)).slice(0, 500);
    assert.ok(/vereisRol\(/.test(blok), `${naam} controleert geen rol`);
    assert.ok(!/PUBLIEK:/.test(bestand!.inhoud.slice(0, bestand!.inhoud.indexOf(`export async function ${naam}(`)).slice(-200)), `${naam} staat als publiek gemarkeerd`);
  }
});
