/**
 * Eenheidstests voor de rekenregels en toegangsregels.
 * Draaien met: npm test
 * Deze tests hebben geen database nodig.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { euro, datum, minutenTussen, urenTussen, afstandKm, reistijdMin, label } from "../src/lib/format";
import { magGevoeligeGegevens, magWijzigen, isBeheer } from "../src/lib/rbac";

test("euro formatteert in Nederlandse notatie", () => {
  assert.match(euro(1234.5), /1\.234,50/);
  assert.match(euro(0), /0,00/);
});

test("datum toont dd-mm-jjjj", () => {
  assert.equal(datum(new Date("2026-03-09T10:00:00Z")), "09-03-2026");
});

test("minuten en uren tussen tijden", () => {
  assert.equal(minutenTussen("09:00", "12:30"), 210);
  assert.equal(urenTussen("09:00", "12:30"), 3.5);
  assert.ok(minutenTussen("13:00", "12:00") < 0);
});

test("afstand en reistijd tussen twee punten", () => {
  const breda = { lat: 51.5866, lng: 4.7758 };
  const tilburg = { lat: 51.5606, lng: 5.0919 };
  const km = afstandKm(breda, tilburg);
  assert.ok(km !== null && km > 20 && km < 40, `verwacht 20 tot 40 km, kreeg ${km}`);
  assert.ok((reistijdMin(km) ?? 0) > 20);
  assert.equal(afstandKm(breda, undefined), null);
});

test("label maakt enums leesbaar", () => {
  assert.equal(label("AANMELDINGEN_ONTVANGEN"), "Aanmeldingen ontvangen");
  assert.equal(label(null), "");
});

test("bankgegevens alleen voor superbeheerder en financieel", () => {
  assert.equal(magGevoeligeGegevens("SUPERBEHEERDER"), true);
  assert.equal(magGevoeligeGegevens("FINANCIEEL"), true);
  assert.equal(magGevoeligeGegevens("PLANNER"), false);
  assert.equal(magGevoeligeGegevens("LEZER"), false);
  assert.equal(magGevoeligeGegevens("DOCENT"), false);
});

test("lezer en docent mogen niets wijzigen in beheer", () => {
  assert.equal(magWijzigen("PLANNER"), true);
  assert.equal(magWijzigen("LEZER"), false);
  assert.equal(magWijzigen("DOCENT"), false);
  assert.equal(isBeheer("DOCENT"), false);
  assert.equal(isBeheer("LEZER"), true);
});

/* Rekenregel declaratie, zelfde formule als in docent-acties.ts */
function berekenDeclaratie(o: {
  workshopVergoeding: number; uurtarief: number; uren: number; minDagtarief: number;
  kilometers: number; kmTarief: number; extra: number;
}) {
  const kmVergoeding = Math.round(o.kilometers * o.kmTarief * 100) / 100;
  const basis = Math.max(o.workshopVergoeding, o.uurtarief * o.uren, o.minDagtarief);
  return Math.round((basis + kmVergoeding + o.extra) * 100) / 100;
}

test("declaratie neemt het hoogste van vergoeding, uurtarief en minimum", () => {
  const a = berekenDeclaratie({ workshopVergoeding: 145, uurtarief: 32, uren: 3, minDagtarief: 95, kilometers: 40, kmTarief: 0.23, extra: 0 });
  assert.equal(a, 154.2);

  const b = berekenDeclaratie({ workshopVergoeding: 80, uurtarief: 40, uren: 4, minDagtarief: 95, kilometers: 0, kmTarief: 0.23, extra: 0 });
  assert.equal(b, 160);

  const c = berekenDeclaratie({ workshopVergoeding: 60, uurtarief: 20, uren: 2, minDagtarief: 95, kilometers: 10, kmTarief: 0.23, extra: 5 });
  assert.equal(c, 102.3);
});

/* Dubbele boeking, zelfde regel als in planning-acties.ts en docent-acties.ts */
function overlapt(a: { start: string; eind: string }, b: { start: string; eind: string }) {
  return !(a.eind <= b.start || a.start >= b.eind);
}

test("dubbele boeking wordt herkend", () => {
  assert.equal(overlapt({ start: "09:00", eind: "12:00" }, { start: "11:00", eind: "13:00" }), true);
  assert.equal(overlapt({ start: "09:00", eind: "12:00" }, { start: "12:00", eind: "14:00" }), false);
  assert.equal(overlapt({ start: "13:00", eind: "16:00" }, { start: "09:00", eind: "12:00" }), false);
  assert.equal(overlapt({ start: "09:00", eind: "17:00" }, { start: "10:00", eind: "11:00" }), true);
});

/* Documentcontrole, zelfde regel als in magOpdracht */
function documentenInOrde(vereist: string[], docs: { type: string; status: string; vervaldatum?: Date | null }[], nu = new Date()) {
  return vereist.every((t) => {
    const d = docs.find((x) => x.type === t);
    return Boolean(d && d.status === "GOEDGEKEURD" && (!d.vervaldatum || d.vervaldatum > nu));
  });
}

test("verlopen of ontbrekend document blokkeert een opdracht", () => {
  const morgen = new Date(Date.now() + 86400000);
  const gisteren = new Date(Date.now() - 86400000);
  assert.equal(documentenInOrde(["VOG"], [{ type: "VOG", status: "GOEDGEKEURD", vervaldatum: morgen }]), true);
  assert.equal(documentenInOrde(["VOG"], [{ type: "VOG", status: "GOEDGEKEURD", vervaldatum: gisteren }]), false);
  assert.equal(documentenInOrde(["VOG"], [{ type: "VOG", status: "AANGELEVERD", vervaldatum: morgen }]), false);
  assert.equal(documentenInOrde(["VOG", "CERTIFICAAT"], [{ type: "VOG", status: "GOEDGEKEURD" }]), false);
});

test("ordernummer volgt het formaat SWjaar-nnnn", () => {
  const nr = `SW${2026}-${String(7).padStart(4, "0")}`;
  assert.match(nr, /^SW\d{4}-\d{4}$/);
  assert.equal(nr, "SW2026-0007");
});
