import test from "node:test";
import assert from "node:assert/strict";
import {
  naarMinuten,
  naarTijd,
  afdelingen,
  bouwTijdschema,
  bouwAlleTijdschemas,
  aantalRondes,
  eersteTijdstip,
  bouwBevestiging,
  samenvatting,
  type BevSessie,
} from "../src/lib/bevestiging";

/* ---------------- tijd ---------------- */

test("tijd omrekenen werkt heen en terug", () => {
  assert.equal(naarMinuten("09:30"), 570);
  assert.equal(naarTijd(570), "09:30");
  assert.equal(naarTijd(naarMinuten("14:45")), "14:45");
});

/* ---------------- eenvoudige dag ---------------- */

const theatersport: BevSessie[] = [
  {
    workshopNaam: "Theatersport",
    aanwezigVanaf: "11:30",
    afbouwTot: "14:45",
    rondes: [
      { nummer: 1, startTijd: "12:00", eindTijd: "13:00", aantalGroepen: 2 },
      { nummer: 2, startTijd: "13:30", eindTijd: "14:30", aantalGroepen: 2 },
    ],
  },
];

test("een workshop met twee rondes geeft aankomst, voorbereiding, pauze en afbouw", () => {
  const regels = bouwTijdschema(theatersport);
  assert.deepEqual(regels, [
    "11:30u Aankomst workshopdocent",
    "11:30u-12:00u Voorbereiding workshopruimte",
    "12:00u-13:00u Workshopronde 1 (2x Theatersport)",
    "13:00u-13:30u Pauze",
    "13:30u-14:30u Workshopronde 2 (2x Theatersport)",
    "14:30u-14:45u Afbouw / vertrek workshopdocent",
  ]);
});

/* ---------------- cultuurdag met vier workshops ---------------- */

function cultuurdag(): BevSessie[] {
  const maak = (naam: string, groepenPerRonde: number[]): BevSessie => ({
    workshopNaam: naam,
    aanwezigVanaf: "09:30",
    afbouwTot: "14:45",
    rondes: [
      { nummer: 1, startTijd: "10:00", eindTijd: "11:00", aantalGroepen: groepenPerRonde[0] },
      { nummer: 2, startTijd: "11:00", eindTijd: "12:00", aantalGroepen: groepenPerRonde[1] },
      { nummer: 3, startTijd: "12:30", eindTijd: "13:30", aantalGroepen: groepenPerRonde[2] },
      { nummer: 4, startTijd: "13:30", eindTijd: "14:30", aantalGroepen: groepenPerRonde[3] },
    ].filter((r) => r.aantalGroepen > 0),
  });
  return [
    maak("Ghetto Drums", [1, 1, 1, 0]),
    maak("Caribbean Drums", [1, 1, 1, 1]),
    maak("Light Graffiti", [1, 1, 1, 2]),
    maak("Kickboksen", [1, 2, 1, 1]),
  ];
}

test("meerdere workshops in één ronde komen samen op één regel", () => {
  const regels = bouwTijdschema(cultuurdag());
  assert.ok(regels.includes("10:00u-11:00u Workshopronde 1 (1x Ghetto Drums, 1x Caribbean Drums, 1x Light Graffiti, 1x Kickboksen)"));
  assert.ok(regels.includes("11:00u-12:00u Workshopronde 2 (1x Ghetto Drums, 1x Caribbean Drums, 1x Light Graffiti, 2x Kickboksen)"));
  assert.ok(regels.includes("13:30u-14:30u Workshopronde 4 (1x Caribbean Drums, 2x Light Graffiti, 1x Kickboksen)"));
});

test("een pauze tussen twee rondes wordt herkend", () => {
  const regels = bouwTijdschema(cultuurdag());
  assert.ok(regels.includes("12:00u-12:30u Pauze"));
});

test("een workshop die eerder stopt krijgt een eigen vertrekregel", () => {
  const regels = bouwTijdschema(cultuurdag());
  assert.ok(regels.some((r) => r.startsWith("13:30u-") && r.includes("Ghetto Drums")));
  assert.ok(regels.some((r) => r.startsWith("14:30u-14:45u Afbouw")));
});

/* ---------------- afdelingen ---------------- */

function metAfdelingen(): BevSessie[] {
  return [
    {
      workshopNaam: "Theatersport",
      aanwezigVanaf: "09:30",
      rondes: [
        { nummer: 1, startTijd: "10:00", eindTijd: "11:00", afdeling: "4VWO", aantalGroepen: 4 },
        { nummer: 1, startTijd: "11:00", eindTijd: "12:00", afdeling: "4HAVO", aantalGroepen: 4 },
      ],
    },
    {
      workshopNaam: "Rap",
      aanwezigVanaf: "10:45",
      rondes: [
        { nummer: 2, startTijd: "11:15", eindTijd: "12:15", afdeling: "4VWO", aantalGroepen: 2 },
        { nummer: 2, startTijd: "12:15", eindTijd: "13:15", afdeling: "4HAVO", aantalGroepen: 2 },
      ],
    },
  ];
}

test("afdelingen worden gevonden en krijgen elk een eigen tijdschema", () => {
  assert.deepEqual(afdelingen(metAfdelingen()), ["4HAVO", "4VWO"]);
  const schemas = bouwAlleTijdschemas(metAfdelingen());
  assert.equal(schemas.length, 2);
  assert.ok(schemas.every((s) => s.regels.length > 0));
});

test("elk afdelingsschema gebruikt alleen de eigen tijden", () => {
  const vwo = bouwTijdschema(metAfdelingen(), "4VWO");
  assert.ok(vwo.includes("10:00u-11:00u Workshopronde 1 (4x Theatersport)"));
  assert.ok(vwo.includes("11:15u-12:15u Workshopronde 2 (2x Rap)"));
  assert.ok(!vwo.some((r) => r.includes("12:15u-13:15u")));
});

test("bij verschillende aankomsttijden wordt de workshop erbij genoemd", () => {
  const vwo = bouwTijdschema(metAfdelingen(), "4VWO");
  assert.ok(vwo.some((r) => r.startsWith("09:30u Aankomst") && r.includes("Theatersport")));
  assert.ok(vwo.some((r) => r.startsWith("10:45u Aankomst") && r.includes("Rap")));
});

/* ---------------- hulpwaarden ---------------- */

test("aantal rondes en eerste tijdstip kloppen", () => {
  assert.equal(aantalRondes(cultuurdag()), 4);
  assert.equal(eersteTijdstip(cultuurdag()), "10:00");
  assert.equal(aantalRondes([]), 0);
});

test("samenvatting telt workshops, rondes en groepen", () => {
  assert.equal(samenvatting(theatersport), "1 workshop, 2 rondes, 4 groepen");
});

/* ---------------- volledige tekst ---------------- */

test("de bevestigingstekst bevat alle vaste blokken", () => {
  const tekst = bouwBevestiging({
    aanhef: "Lisabeth",
    klantNaam: "De Goudse Waarden",
    datumTekst: "01-09-2026",
    locatieNaam: "De Goudse Waarden",
    adresregels: ["Heemskerkstraat 105", "2805 SN Gouda"],
    contactNaam: "Lisabeth Keizer",
    contactTelefoon: "0647980153",
    aantalPersonenTekst: "Maximaal 25 per workshop",
    afzender: "Anne Bakker",
    sessies: cultuurdag(),
  });

  assert.ok(tekst.startsWith("Beste Lisabeth,"));
  assert.ok(tekst.includes("Naam workshop(s): Ghetto Drums, Caribbean Drums, Light Graffiti, Kickboksen"));
  assert.ok(tekst.includes("Tijdstip workshop: 10:00 uur"));
  assert.ok(tekst.includes("Aantal workshoprondes: 4"));
  assert.ok(tekst.includes("Aantal personen: Maximaal 25 per workshop"));
  assert.ok(tekst.includes("Heemskerkstraat 105"));
  assert.ok(tekst.includes("Opdrachtgever: Lisabeth Keizer, 0647980153"));
  assert.ok(tekst.includes("Skool Workshop: 085-0653923"));
  assert.ok(tekst.includes("Tijdschema"));
  assert.ok(tekst.includes("De factuur wordt zeven dagen voor aanvang van de workshop verstuurd."));
  assert.ok(tekst.includes("Anne Bakker"));
});

test("benodigdheden per workshop krijgen een eigen kop met de workshopnaam", () => {
  const sessies = cultuurdag();
  sessies[0].klantBenodigdheden = "Grote ruimte op de begane grond.";
  sessies[1].klantBenodigdheden = "Stoelen zonder armleuningen.";
  sessies[1].voorbeeldLink = "https://voorbeeld.example/opstelling";
  const tekst = bouwBevestiging({
    klantNaam: "De Goudse Waarden",
    datumTekst: "01-09-2026",
    sessies,
  });
  assert.ok(tekst.includes("Benodigdheden Ghetto Drums"));
  assert.ok(tekst.includes("Benodigdheden Caribbean Drums"));
  assert.ok(tekst.includes("Klik hier voor een voorbeeld: https://voorbeeld.example/opstelling"));
});

test("bij één workshop staat er geen naam achter Benodigdheden", () => {
  const sessies = [{ ...theatersport[0], klantBenodigdheden: "Ruime open ruimte met stoelen." }];
  const tekst = bouwBevestiging({ klantNaam: "Veurs Lyceum", datumTekst: "01-09-2026", sessies });
  assert.ok(tekst.includes("\nBenodigdheden\n"));
  assert.ok(!tekst.includes("Benodigdheden Theatersport"));
});

test("een workshop die pas in ronde 2 start, staat niet in ronde 1", () => {
  const sessies: BevSessie[] = [
    {
      workshopNaam: "Theatersport",
      aanwezigVanaf: "09:30",
      rondes: [
        { nummer: 1, startTijd: "10:00", eindTijd: "11:00", aantalGroepen: 3 },
        { nummer: 2, startTijd: "11:00", eindTijd: "12:00", aantalGroepen: 3 },
        { nummer: 3, startTijd: "12:00", eindTijd: "13:00", aantalGroepen: 3 },
      ],
    },
    {
      workshopNaam: "Rap",
      aanwezigVanaf: "10:30",
      rondes: [
        { nummer: 2, startTijd: "11:00", eindTijd: "12:00", aantalGroepen: 1 },
        { nummer: 3, startTijd: "12:00", eindTijd: "13:00", aantalGroepen: 1 },
        { nummer: 4, startTijd: "13:00", eindTijd: "14:00", aantalGroepen: 1 },
      ],
    },
  ];
  const regels = bouwTijdschema(sessies);
  assert.ok(regels.includes("10:00u-11:00u Workshopronde 1 (3x Theatersport)"));
  assert.ok(regels.includes("11:00u-12:00u Workshopronde 2 (3x Theatersport, 1x Rap)"));
  assert.ok(regels.includes("13:00u-14:00u Workshopronde 4 (1x Rap)"));
  // Theatersport vertrekt eerder dan Rap en krijgt een eigen regel
  assert.ok(regels.some((r) => r.startsWith("13:00u-") && r.includes("Afbouw") && r.includes("Theatersport")));
  assert.ok(regels.some((r) => r.startsWith("14:00u-") && r.includes("Afbouw")));
});

test("de aankomsttijd van een latere workshop staat apart in het schema", () => {
  const sessies: BevSessie[] = [
    { workshopNaam: "Graffiti", aanwezigVanaf: "09:30", rondes: [{ nummer: 1, startTijd: "10:00", eindTijd: "11:00", aantalGroepen: 2 }] },
    { workshopNaam: "Kickboksen", aanwezigVanaf: "10:30", rondes: [{ nummer: 2, startTijd: "11:00", eindTijd: "12:00", aantalGroepen: 1 }] },
  ];
  const regels = bouwTijdschema(sessies);
  assert.ok(regels.some((r) => r.startsWith("09:30u Aankomst") && r.includes("Graffiti")));
  assert.ok(regels.some((r) => r.startsWith("10:30u Aankomst") && r.includes("Kickboksen")));
});

test("twee workshopdocenten op dezelfde workshop met verschillende rondes", () => {
  // Docent 1 draait alle vier de rondes, docent 2 alleen ronde 2 en 3
  const sessies: BevSessie[] = [
    {
      workshopNaam: "Caribbean Drums",
      aanwezigVanaf: "09:30",
      afbouwTot: "14:45",
      rondes: [
        { nummer: 1, startTijd: "10:00", eindTijd: "11:00", aantalGroepen: 1 },
        { nummer: 2, startTijd: "11:00", eindTijd: "12:00", aantalGroepen: 2 },
        { nummer: 3, startTijd: "12:30", eindTijd: "13:30", aantalGroepen: 2 },
        { nummer: 4, startTijd: "13:30", eindTijd: "14:30", aantalGroepen: 1 },
      ],
    },
  ];
  const regels = bouwTijdschema(sessies);
  assert.ok(regels.includes("10:00u-11:00u Workshopronde 1 (1x Caribbean Drums)"));
  assert.ok(regels.includes("11:00u-12:00u Workshopronde 2 (2x Caribbean Drums)"));
  assert.ok(regels.includes("12:30u-13:30u Workshopronde 3 (2x Caribbean Drums)"));
  assert.ok(regels.includes("13:30u-14:30u Workshopronde 4 (1x Caribbean Drums)"));
  assert.equal(aantalRondes(sessies), 4);
});
