import test from "node:test";
import assert from "node:assert/strict";
import {
  STANDAARD_TARIEVEN,
  reiskosten,
  reistijdVergoeding,
  urenVergoeding,
  berekenVergoeding,
  binnenReisafstand,
  type Tarieven,
} from "../src/lib/tarieven";

test("reiskosten worden heen en terug gerekend", () => {
  assert.equal(reiskosten(40), 20); // 40 km x 0,25 x 2
  assert.equal(reiskosten(0), 0);
  assert.equal(reiskosten(null), 0);
});

test("een aangepast kilometertarief werkt door", () => {
  const t: Tarieven = { ...STANDAARD_TARIEVEN, kmTarief: 0.42 };
  assert.equal(reiskosten(40, t), 33.6);
});

test("reistijd onder anderhalf uur levert niets op", () => {
  assert.equal(reistijdVergoeding(60), 0);
  assert.equal(reistijdVergoeding(90), 0);
  assert.equal(reistijdVergoeding(null), 0);
});

test("reistijd boven anderhalf uur geeft het halve uurtarief heen en terug", () => {
  // 120 min enkele reis = 2 uur, half tarief 22,50, maal 2 uur maal 2 richtingen
  assert.equal(reistijdVergoeding(120), 90);
});

test("het dagminimum vult een korte dag aan", () => {
  assert.equal(urenVergoeding(1), 100); // 45 euro wordt 100
  assert.equal(urenVergoeding(2), 100); // 90 euro wordt 100
  assert.equal(urenVergoeding(3), 135); // boven het minimum
});

test("een volledige berekening klopt", () => {
  const v = berekenVergoeding({ uren: 4, kilometers: 60, reistijdMinuten: 100, parkeerkosten: 5 });
  assert.equal(v.uurVergoeding, 180);
  assert.equal(v.minimumToegepast, false);
  assert.equal(v.reiskosten, 30);
  assert.ok(v.reistijdVergoeding > 0);
  assert.equal(v.totaal, 180 + 30 + v.reistijdVergoeding + 5);
});

test("een korte dag dichtbij komt op het dagminimum uit", () => {
  const v = berekenVergoeding({ uren: 1.5, kilometers: 10, reistijdMinuten: 18 });
  assert.equal(v.minimumToegepast, true);
  assert.equal(v.uurVergoeding, 100);
  assert.equal(v.reistijdVergoeding, 0);
  assert.equal(v.totaal, 105);
});

test("maximale reisafstand bepaalt of een opdracht zichtbaar is", () => {
  assert.equal(binnenReisafstand(50, 60), true);
  assert.equal(binnenReisafstand(80, 60), false);
  assert.equal(binnenReisafstand(80, null), true); // geen grens ingesteld
  assert.equal(binnenReisafstand(null, 60), true); // afstand onbekend
});
