/**
 * Tests voor het inschrijfsysteem. Geen database nodig.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  maakCode, maakCodes, normaliseerCode, vrijePlekken,
  verdeelVoorkeuren, maakRotatie, leesLeerlingenCsv,
} from "../src/lib/inschrijving";

test("toegangscode heeft geen verwarrende tekens", () => {
  for (let i = 0; i < 200; i++) {
    const c = maakCode(6);
    assert.equal(c.length, 6);
    assert.ok(!/[01IOL]/.test(c), `code ${c} bevat een verwarrend teken`);
  }
});

test("codes zijn uniek binnen een reeks", () => {
  const codes = maakCodes(300, 6);
  assert.equal(new Set(codes).size, codes.length);
});

test("code invoer wordt netjes opgeschoond", () => {
  assert.equal(normaliseerCode(" ab-c 12 3 "), "ABC123");
  assert.equal(normaliseerCode("abc123"), "ABC123");
});

test("vrije plekken worden nooit negatief", () => {
  assert.equal(vrijePlekken(20, 5), 15);
  assert.equal(vrijePlekken(20, 20), 0);
  assert.equal(vrijePlekken(20, 25), 0);
});

test("voorkeuren worden zo eerlijk mogelijk verdeeld", () => {
  const slots = [
    { id: "a", capaciteit: 2, bezet: 0 },
    { id: "b", capaciteit: 2, bezet: 0 },
    { id: "c", capaciteit: 2, bezet: 0 },
  ];
  const leerlingen = [
    { id: "1", voorkeuren: ["a", "b", "c"] },
    { id: "2", voorkeuren: ["a", "b", "c"] },
    { id: "3", voorkeuren: ["a", "c", "b"] },
    { id: "4", voorkeuren: ["b", "a", "c"] },
    { id: "5", voorkeuren: ["b", "c", "a"] },
    { id: "6", voorkeuren: ["c", "a", "b"] },
  ];
  const { toewijzing, nietGeplaatst } = verdeelVoorkeuren(leerlingen, slots);
  assert.equal(toewijzing.size, 6);
  assert.equal(nietGeplaatst.length, 0);

  // Niemand zit in een volle workshop
  const telling = new Map<string, number>();
  for (const s of toewijzing.values()) telling.set(s, (telling.get(s) ?? 0) + 1);
  for (const [slot, n] of telling) {
    const cap = slots.find((s) => s.id === slot)!.capaciteit;
    assert.ok(n <= cap, `${slot} zit over de capaciteit`);
  }
});

test("wie nergens meer past komt in de restlijst", () => {
  const slots = [{ id: "a", capaciteit: 1, bezet: 0 }];
  const leerlingen = [
    { id: "1", voorkeuren: ["a"] },
    { id: "2", voorkeuren: ["a"] },
  ];
  const { toewijzing, nietGeplaatst } = verdeelVoorkeuren(leerlingen, slots);
  assert.equal(toewijzing.size, 1);
  assert.equal(nietGeplaatst.length, 1);
});

test("al bezette plekken tellen mee", () => {
  const slots = [{ id: "a", capaciteit: 3, bezet: 3 }, { id: "b", capaciteit: 3, bezet: 0 }];
  const leerlingen = [{ id: "1", voorkeuren: ["a", "b"] }];
  const { toewijzing } = verdeelVoorkeuren(leerlingen, slots);
  assert.equal(toewijzing.get("1"), "b");
});

test("klassikale rotatie geeft elke klas elke ronde een andere workshop", () => {
  const klassen = ["1A", "1B", "1C"];
  const slots = [["w1", "w2", "w3"], ["w1", "w2", "w3"], ["w1", "w2", "w3"]];
  const schema = maakRotatie(klassen, slots);
  assert.equal(schema.length, 9);
  for (const klas of klassen) {
    const eigen = schema.filter((s) => s.klas === klas).map((s) => s.slotId);
    assert.equal(new Set(eigen).size, 3, `${klas} krijgt een workshop dubbel`);
  }
  for (let ronde = 1; ronde <= 3; ronde++) {
    const inRonde = schema.filter((s) => s.ronde === ronde).map((s) => s.slotId);
    assert.equal(new Set(inRonde).size, 3, `in ronde ${ronde} botsen klassen`);
  }
});

test("csv met puntkomma en koprij wordt gelezen", () => {
  const csv = "voornaam;achternaam;klas;email\nSem;Jansen;2A;sem@example.com\nNoa;Peters;2B;";
  const { leerlingen, fouten } = leesLeerlingenCsv(csv);
  assert.equal(leerlingen.length, 2);
  assert.equal(fouten.length, 0);
  assert.equal(leerlingen[0].voornaam, "Sem");
  assert.equal(leerlingen[1].klas, "2B");
});

test("csv met komma en zonder koprij werkt ook", () => {
  const csv = "Sem,Jansen,2A\nNoa,Peters,2B";
  const { leerlingen } = leesLeerlingenCsv(csv);
  assert.equal(leerlingen.length, 2);
  assert.equal(leerlingen[0].klas, "2A");
});

test("regels zonder naam of klas worden gemeld en overgeslagen", () => {
  const csv = "voornaam;achternaam;klas\n;Jansen;2A\nNoa;Peters;\nSem;Visser;2C";
  const { leerlingen, fouten } = leesLeerlingenCsv(csv);
  assert.equal(leerlingen.length, 1);
  assert.equal(fouten.length, 2);
});

test("aanhalingstekens rond velden worden weggehaald", () => {
  const csv = '"Sem";"de Jong";"2A"';
  const { leerlingen } = leesLeerlingenCsv(csv);
  assert.equal(leerlingen[0].achternaam, "de Jong");
});
