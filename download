/**
 * Test op de berichtsjablonen. Geen database nodig.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { TEMPLATES, vul } from "../src/lib/berichten";

test("elk sjabloon heeft een onderwerp en tekst", () => {
  for (const [sleutel, tpl] of Object.entries(TEMPLATES)) {
    assert.ok(tpl.onderwerp.length > 3, `${sleutel} mist een onderwerp`);
    assert.ok(tpl.tekst.length > 10, `${sleutel} mist tekst`);
  }
});

test("variabelen worden ingevuld en onbekende velden blijven leeg", () => {
  const t = TEMPLATES.GESELECTEERD;
  const uit = vul(t.tekst, { voornaam: "Milan", workshop: "DJ Workshop", datum: "09-03-2026" });
  assert.match(uit, /Milan/);
  assert.match(uit, /DJ Workshop/);
  assert.ok(!uit.includes("{{"), "er staan nog placeholders in de tekst");
});

test("sjablonen voor de belangrijkste momenten bestaan", () => {
  for (const sleutel of [
    "UITNODIGING_ACCOUNT", "REGISTRATIE_ONTVANGEN", "PROFIEL_GOEDGEKEURD",
    "NIEUWE_OPDRACHT", "DIRECTE_UITNODIGING", "GESELECTEERD", "AFGEWEZEN",
    "OPDRACHT_GEANNULEERD", "WERKREGISTRATIE_VERZOEK", "DECLARATIE_GOEDGEKEURD",
    "DOCUMENT_VERLOOPT",
  ]) {
    assert.ok(TEMPLATES[sleutel], `sjabloon ${sleutel} ontbreekt`);
  }
});
