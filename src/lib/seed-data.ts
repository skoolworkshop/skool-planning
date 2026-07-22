/**
 * Demodata voor het planningsysteem van Skool Workshop.
 * Alle namen, adressen en gegevens zijn verzonnen. Geen echte persoonsgegevens.
 * Wordt gebruikt door prisma/seed.ts en door de eenmalige seed-route.
 *
 * Het vullen is opgesplitst in stappen. Elke stap is klein genoeg om binnen
 * de tijdslimiet van een serverless functie af te ronden.
 */
import type { PrismaClient, DocType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { maakCodes } from "./inschrijving";

const WACHTWOORD = process.env.SEED_WACHTWOORD ?? "SkoolDemo2026!";

function dagen(n: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

function kies<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

/* ======================= Brondata ======================= */

const MEDEWERKERS = [
  { email: "superbeheerder@example.com", role: "SUPERBEHEERDER" as const },
  { email: "planner@example.com", role: "PLANNER" as const },
  { email: "financieel@example.com", role: "FINANCIEEL" as const },
  { email: "lezer@example.com", role: "LEZER" as const },
];

const CATEGORIEEN = [
  { naam: "Muziek", kleur: "#f47c20", volgorde: 1 },
  { naam: "Dans", kleur: "#7c3aed", volgorde: 2 },
  { naam: "Media en techniek", kleur: "#0ea5e9", volgorde: 3 },
  { naam: "Kunst en creatief", kleur: "#10b981", volgorde: 4 },
  { naam: "Sport en spel", kleur: "#ef4444", volgorde: 5 },
];

const WORKSHOPS_DATA: {
  naam: string; cat: string; duur: number; vergoeding: number; docs: DocType[];
  doelgroepen: string[]; materialen: string; maxGroep: number;
}[] = [
  { naam: "DJ Workshop", cat: "Muziek", duur: 90, vergoeding: 145, docs: ["VOG"], doelgroepen: ["Bovenbouw PO", "VO"], materialen: "DJ set, speakers", maxGroep: 30 },
  { naam: "Rap en Songwriting", cat: "Muziek", duur: 90, vergoeding: 140, docs: ["VOG"], doelgroepen: ["VO", "MBO"], materialen: "Microfoons, laptop", maxGroep: 25 },
  { naam: "Djembé en Percussie", cat: "Muziek", duur: 60, vergoeding: 130, docs: ["VOG"], doelgroepen: ["Onderbouw PO", "Bovenbouw PO"], materialen: "Djembés", maxGroep: 30 },
  { naam: "Streetdance", cat: "Dans", duur: 60, vergoeding: 125, docs: ["VOG"], doelgroepen: ["Bovenbouw PO", "VO"], materialen: "Speaker", maxGroep: 30 },
  { naam: "Breakdance", cat: "Dans", duur: 60, vergoeding: 135, docs: ["VOG"], doelgroepen: ["Bovenbouw PO", "VO"], materialen: "Dansvloer, speaker", maxGroep: 24 },
  { naam: "TikTok Dance", cat: "Dans", duur: 60, vergoeding: 120, docs: ["VOG"], doelgroepen: ["VO"], materialen: "Speaker, telefoonstatief", maxGroep: 30 },
  { naam: "Vlog en Videoproductie", cat: "Media en techniek", duur: 120, vergoeding: 165, docs: ["VOG"], doelgroepen: ["VO", "MBO"], materialen: "Camera's, statieven", maxGroep: 20 },
  { naam: "Podcast maken", cat: "Media en techniek", duur: 120, vergoeding: 160, docs: ["VOG"], doelgroepen: ["VO", "MBO", "HBO"], materialen: "Opnameset", maxGroep: 16 },
  { naam: "Virtual Reality Beleving", cat: "Media en techniek", duur: 90, vergoeding: 175, docs: ["VOG"], doelgroepen: ["Bovenbouw PO", "VO"], materialen: "VR brillen", maxGroep: 20 },
  { naam: "Robotica en Programmeren", cat: "Media en techniek", duur: 90, vergoeding: 170, docs: ["VOG", "CERTIFICAAT"], doelgroepen: ["Bovenbouw PO", "VO"], materialen: "Robots, tablets", maxGroep: 24 },
  { naam: "Graffiti en Streetart", cat: "Kunst en creatief", duur: 120, vergoeding: 155, docs: ["VOG"], doelgroepen: ["Bovenbouw PO", "VO"], materialen: "Spuitbussen, doeken", maxGroep: 20 },
  { naam: "Sieraden maken", cat: "Kunst en creatief", duur: 60, vergoeding: 110, docs: ["VOG"], doelgroepen: ["Onderbouw PO", "BSO"], materialen: "Kralen, koord", maxGroep: 25 },
  { naam: "Kookworkshop Wereldkeuken", cat: "Kunst en creatief", duur: 150, vergoeding: 180, docs: ["VOG", "CERTIFICAAT"], doelgroepen: ["VO", "Volwassenen"], materialen: "Ingrediënten, kookspullen", maxGroep: 16 },
  { naam: "Bubbelvoetbal", cat: "Sport en spel", duur: 90, vergoeding: 150, docs: ["VOG"], doelgroepen: ["VO", "MBO", "Volwassenen"], materialen: "Bubbelballen, pomp", maxGroep: 20 },
  { naam: "Levend Stratego", cat: "Sport en spel", duur: 120, vergoeding: 140, docs: ["VOG"], doelgroepen: ["Bovenbouw PO", "VO"], materialen: "Spelmateriaal, hesjes", maxGroep: 40 },
];

const DOCENTEN_DATA = [
  { v: "Milan", a: "de Wit", plaats: "Breda", pc: "4811 AA", lat: 51.5866, lng: 4.7758, ws: [0, 1, 3] },
  { v: "Sanne", a: "Vermeulen", plaats: "Tilburg", pc: "5011 BB", lat: 51.5606, lng: 5.0919, ws: [3, 4, 5] },
  { v: "Youssef", a: "El Amrani", plaats: "Rotterdam", pc: "3011 CC", lat: 51.9244, lng: 4.4777, ws: [0, 1, 10] },
  { v: "Fleur", a: "Jansen", plaats: "Eindhoven", pc: "5611 DD", lat: 51.4416, lng: 5.4697, ws: [6, 7, 8] },
  { v: "Daan", a: "Kuipers", plaats: "Den Bosch", pc: "5211 EE", lat: 51.6978, lng: 5.3037, ws: [9, 8, 6] },
  { v: "Noor", a: "Bakker", plaats: "Breda", pc: "4813 FF", lat: 51.5719, lng: 4.7683, ws: [11, 10, 12] },
  { v: "Ravi", a: "Doekhie", plaats: "Utrecht", pc: "3511 GG", lat: 52.0907, lng: 5.1214, ws: [13, 14, 4] },
  { v: "Lotte", a: "van Dijk", plaats: "Amsterdam", pc: "1011 HH", lat: 52.3676, lng: 4.9041, ws: [2, 11, 5] },
  { v: "Sem", a: "Hoogland", plaats: "Roosendaal", pc: "4701 JJ", lat: 51.5308, lng: 4.4653, ws: [13, 14] },
  { v: "Amira", a: "Yildiz", plaats: "Tilburg", pc: "5038 KK", lat: 51.5555, lng: 5.0913, ws: [12, 11, 1] },
];

const KLANTEN_DATA = [
  { naam: "Basisschool De Regenboog", type: "BASISSCHOOL", plaats: "Breda", lat: 51.5912, lng: 4.7761 },
  { naam: "Basisschool Het Kompas", type: "BASISSCHOOL", plaats: "Tilburg", lat: 51.5555, lng: 5.0913 },
  { naam: "Sint Janslyceum", type: "VOORTGEZET_ONDERWIJS", plaats: "Den Bosch", lat: 51.6906, lng: 5.3040 },
  { naam: "Newmancollege", type: "VOORTGEZET_ONDERWIJS", plaats: "Breda", lat: 51.5754, lng: 4.7910 },
  { naam: "ROC Zuid", type: "MBO", plaats: "Eindhoven", lat: 51.4416, lng: 5.4697 },
  { naam: "Avans Hogeschool", type: "HBO", plaats: "Breda", lat: 51.5866, lng: 4.7930 },
  { naam: "BSO De Speelboom", type: "BSO", plaats: "Roosendaal", lat: 51.5308, lng: 4.4653 },
  { naam: "Bibliotheek Nieuwe Veste", type: "BIBLIOTHEEK", plaats: "Breda", lat: 51.5889, lng: 4.7752 },
  { naam: "Gemeente Etten-Leur", type: "GEMEENTE", plaats: "Etten-Leur", lat: 51.5714, lng: 4.6386 },
  { naam: "Techniekbedrijf Vandertol", type: "BEDRIJF", plaats: "Oosterhout", lat: 51.6450, lng: 4.8600 },
];

const KLASSEN = ["2A", "2B", "2C"];
const AANTAL_OPDRACHTEN = 20;

/* ======================= Terugleeshulpjes ======================= */

async function leesWorkshops(db: PrismaClient) {
  const rijen = await db.workshop.findMany();
  const perNaam = new Map(rijen.map((w) => [w.naam, w]));
  return WORKSHOPS_DATA.map((w) => perNaam.get(w.naam)!);
}

async function leesDocenten(db: PrismaClient) {
  const rijen = await db.teacherProfile.findMany({ include: { user: true } });
  const nummer = (email: string) => Number(email.replace(/\D/g, "")) || 0;
  return rijen.sort((a, b) => nummer(a.user.email) - nummer(b.user.email));
}

async function leesKlanten(db: PrismaClient) {
  const rijen = await db.client.findMany({ include: { locations: true, contacts: true } });
  const perNaam = new Map(rijen.map((k) => [k.naam, k]));
  return KLANTEN_DATA.map((k) => perNaam.get(k.naam)!);
}

/* ======================= Stap 1: leegmaken ======================= */

export async function stapLeegmaken(db: PrismaClient) {
  await db.choice.deleteMany();
  await db.preference.deleteMany();
  await db.accessCode.deleteMany();
  await db.participant.deleteMany();
  await db.enrollmentSlot.deleteMany();
  await db.enrollmentRound.deleteMany();
  await db.enrollment.deleteMany();
  await db.auditLog.deleteMany();
  await db.messageLog.deleteMany();
  await db.notification.deleteMany();
  await db.notificationTemplate.deleteMany();
  await db.workRegistration.deleteMany();
  await db.assignment.deleteMany();
  await db.application.deleteMany();
  await db.staffingPosition.deleteMany();
  await db.workshopRound.deleteMany();
  await db.workshopSession.deleteMany();
  await db.project.deleteMany();
  await db.clientContact.deleteMany();
  await db.clientLocation.deleteMany();
  await db.client.deleteMany();
  await db.availability.deleteMany();
  await db.teacherDocument.deleteMany();
  await db.teacherWorkshopSkill.deleteMany();
  await db.teacherProfile.deleteMany();
  await db.workshop.deleteMany();
  await db.workshopCategory.deleteMany();
  await db.user.deleteMany();
  return { leeggemaakt: true };
}

/* ======================= Stap 2: basis ======================= */

export async function stapBasis(db: PrismaClient) {
  const hash = await bcrypt.hash(WACHTWOORD, 12);

  await db.user.createMany({
    data: MEDEWERKERS.map((m) => ({
      email: m.email,
      role: m.role,
      passwordHash: hash,
      emailVerified: new Date(),
    })),
  });

  await db.workshopCategory.createMany({ data: CATEGORIEEN });
  const catRijen = await db.workshopCategory.findMany();
  const cats: Record<string, string> = {};
  for (const c of catRijen) cats[c.naam] = c.id;

  await db.workshop.createMany({
    data: WORKSHOPS_DATA.map((w) => ({
      naam: w.naam,
      categoryId: cats[w.cat],
      korteOmschrijving: `${w.naam} van Skool Workshop, actief en op maat voor de groep.`,
      omschrijving: `In deze workshop gaan deelnemers direct zelf aan de slag. De docent past het niveau aan op de groep en sluit af met een presentatie of gezamenlijk moment.`,
      standaardDuur: w.duur,
      maxGroep: w.maxGroep,
      standaardVergoeding: w.vergoeding,
      minVergoeding: Math.round(w.vergoeding * 0.8),
      voorbereidingstijd: 30,
      materialen: w.materialen,
      materialenDoor: "Skool Workshop",
      doelgroepen: w.doelgroepen,
      vereisteDocumenten: w.docs,
      docentInstructie: "Wees een half uur voor aanvang aanwezig en meld je bij de contactpersoon.",
    })),
  });

  const sjablonen = [
    { sleutel: "NIEUWE_OPDRACHT", onderwerp: "Nieuwe opdracht die bij je past" },
    { sleutel: "GESELECTEERD", onderwerp: "Je bent ingepland" },
    { sleutel: "HERINNERING_OPDRACHT", onderwerp: "Herinnering: opdracht binnenkort" },
    { sleutel: "WERKREGISTRATIE_VERZOEK", onderwerp: "Rond je opdracht af" },
  ];
  await db.notificationTemplate.createMany({
    data: sjablonen.map((s) => ({
      sleutel: s.sleutel,
      kanaal: "EMAIL" as const,
      onderwerp: s.onderwerp,
      inhoud: "Standaardtekst uit de code, hier aan te passen.",
      actief: true,
    })),
  });

  return { medewerkers: MEDEWERKERS.length, categorieen: CATEGORIEEN.length, workshops: WORKSHOPS_DATA.length };
}

/* ======================= Stap 3: docenten ======================= */

export async function stapDocenten(db: PrismaClient) {
  const hash = await bcrypt.hash(WACHTWOORD, 12);
  const workshops = await leesWorkshops(db);

  await db.user.createMany({
    data: DOCENTEN_DATA.map((_, i) => ({
      email: `docent${i + 1}@example.com`,
      role: "DOCENT" as const,
      passwordHash: hash,
      emailVerified: new Date(),
    })),
  });

  const users = await db.user.findMany({ where: { role: "DOCENT" } });
  const perEmail = new Map(users.map((u) => [u.email, u.id]));

  await db.teacherProfile.createMany({
    data: DOCENTEN_DATA.map((d, i) => {
      const status = i === 8 ? "TER_BEOORDELING" : i === 9 ? "AANVULLING_NODIG" : "GOEDGEKEURD";
      return {
        userId: perEmail.get(`docent${i + 1}@example.com`)!,
        voornaam: d.v,
        achternaam: d.a,
        telefoon: `06 1234 56${String(i).padStart(2, "0")}`,
        geboortedatum: new Date(1990 + i, (i * 3) % 12, ((i * 5) % 27) + 1),
        bio: `${d.v} geeft met veel energie workshops en werkt graag met jongeren.`,
        straat: "Voorbeeldstraat",
        huisnummer: String(10 + i),
        postcode: d.pc,
        plaats: d.plaats,
        lat: d.lat,
        lng: d.lng,
        samenwerking: (i % 3 === 0 ? "LOONDIENST" : "ZZP") as never,
        kvk: i % 3 === 0 ? null : `${60000000 + i}`,
        iban: `NL91ABNA04170${String(10000 + i).slice(-5)}`,
        rekeninghouder: `${d.v} ${d.a}`,
        uurtarief: 32 + (i % 4) * 2,
        minDagtarief: 95,
        kmVergoeding: 0.23,
        maxReisAfstand: 60 + (i % 3) * 25,
        eigenVervoer: i % 4 !== 0,
        rijbewijs: i % 4 !== 0,
        ovMogelijk: true,
        talen: i % 3 === 0 ? ["Nederlands", "Engels"] : ["Nederlands"],
        doelgroepen: ["Bovenbouw PO", "VO"],
        status: status as never,
        goedgekeurdOp: status === "GOEDGEKEURD" ? dagen(-120 + i) : null,
      };
    }),
  });

  const docenten = await leesDocenten(db);

  const skills: { teacherId: string; workshopId: string; niveau: number }[] = [];
  const documenten: Record<string, unknown>[] = [];
  const beschikbaar: { teacherId: string; weekdag: number; beschikbaar: boolean }[] = [];

  for (let i = 0; i < DOCENTEN_DATA.length; i++) {
    const d = DOCENTEN_DATA[i];
    const t = docenten[i];

    for (const w of d.ws) {
      skills.push({ teacherId: t.id, workshopId: workshops[w].id, niveau: ((i + w) % 3) + 1 });
    }

    documenten.push({
      teacherId: t.id,
      type: "VOG",
      bestandsnaam: "vog.pdf",
      uploadedAt: dagen(-200),
      vervaldatum: i === 3 ? dagen(-14) : dagen(400 + i),
      status: i === 3 ? "VERLOPEN" : i === 8 ? "IN_BEHANDELING" : "GOEDGEKEURD",
      verplicht: true,
    });
    if (i !== 5) {
      documenten.push({
        teacherId: t.id,
        type: "IDENTITEITSBEWIJS",
        bestandsnaam: "id.pdf",
        uploadedAt: dagen(-200),
        vervaldatum: dagen(900),
        status: i === 8 ? "AANGELEVERD" : "GOEDGEKEURD",
        verplicht: true,
      });
    }
    if (i % 3 !== 0) {
      documenten.push({ teacherId: t.id, type: "KVK", bestandsnaam: "kvk.pdf", uploadedAt: dagen(-180), status: "GOEDGEKEURD" });
    }
    if (d.ws.includes(9) || d.ws.includes(12)) {
      documenten.push({ teacherId: t.id, type: "CERTIFICAAT", bestandsnaam: "certificaat.pdf", uploadedAt: dagen(-100), status: "GOEDGEKEURD" });
    }

    for (const dag of [1, 2, 3, 4, 5].filter((x) => (x + i) % 5 !== 0)) {
      beschikbaar.push({ teacherId: t.id, weekdag: dag, beschikbaar: true });
    }
  }

  await db.teacherWorkshopSkill.createMany({ data: skills });
  await db.teacherDocument.createMany({ data: documenten as never });
  await db.availability.createMany({ data: beschikbaar });

  return { docenten: DOCENTEN_DATA.length };
}

/* ======================= Stap 4: klanten ======================= */

export async function stapKlanten(db: PrismaClient) {
  for (let i = 0; i < KLANTEN_DATA.length; i++) {
    const k = KLANTEN_DATA[i];
    await db.client.create({
      data: {
        klantnummer: `KL-${String(1001 + i)}`,
        naam: k.naam,
        type: k.type as never,
        factuurEmail: `administratie${i + 1}@example.com`,
        factuurAdres: `Postbus ${100 + i}, ${k.plaats}`,
        betaaltermijn: 30,
        locations: {
          create: {
            naam: `${k.naam} hoofdlocatie`,
            straat: "Schoollaan",
            huisnummer: String(1 + i * 2),
            postcode: `4${800 + i} ZZ`,
            plaats: k.plaats,
            lat: k.lat,
            lng: k.lng,
            parkeren: i % 2 === 0 ? "Gratis parkeren op eigen terrein" : "Betaald parkeren in de straat",
            route: "Meld je bij de hoofdingang, je wordt daar opgehaald.",
            toegankelijkheid: "Begane grond, rolstoeltoegankelijk",
            materialenAanwezig: "Beamer en geluidsinstallatie aanwezig",
          },
        },
        contacts: {
          create: [
            {
              naam: kies(["Karin Smits", "Peter de Groot", "Hanne Willems", "Bas Kramer", "Ilse Verhoeven"], i),
              functie: "Coördinator",
              email: `contact${i + 1}@example.com`,
              telefoon: `076 123 45${String(10 + i)}`,
              mobiel: `06 2233 44${String(10 + i)}`,
              primair: true,
              opDeDag: true,
            },
          ],
        },
      },
    });
  }
  return { klanten: KLANTEN_DATA.length };
}

/* ======================= Stap 5: opdrachten ======================= */

export async function stapOpdrachten(db: PrismaClient) {
  const workshops = await leesWorkshops(db);
  const docenten = await leesDocenten(db);
  const klanten = await leesKlanten(db);
  const jaar = new Date().getFullYear();

  // Projecten in een keer wegschrijven
  const projectRijen = [];
  for (let i = 0; i < AANTAL_OPDRACHTEN; i++) {
    const klant = klanten[i % klanten.length];
    const workshop = workshops[i % workshops.length];
    const dagenVooruit = i < 3 ? -21 + i * 5 : (i - 2) * 6;
    const datum = dagen(dagenVooruit);
    projectRijen.push({
      ordernummer: `SW${jaar}-${String(i + 1).padStart(4, "0")}`,
      clientId: klant.id,
      locationId: klant.locations[0].id,
      naam: `${workshop.naam} bij ${klant.naam}`,
      status: (dagenVooruit < 0 ? "UITGEVOERD" : i % 5 === 0 ? "BEVESTIGD" : "PLANNING_GESTART") as never,
      startDatum: datum,
      eindDatum: datum,
      omzet: Number(workshop.standaardVergoeding) * 2.4,
      materiaalkosten: 35,
    });
  }
  await db.project.createMany({ data: projectRijen });
  const projecten = (await db.project.findMany({ orderBy: { ordernummer: "asc" } })).slice(0, AANTAL_OPDRACHTEN);

  // Sessies in een keer wegschrijven
  const sessieRijen = [];
  for (let i = 0; i < AANTAL_OPDRACHTEN; i++) {
    const klant = klanten[i % klanten.length];
    const workshop = workshops[i % workshops.length];
    const dagenVooruit = i < 3 ? -21 + i * 5 : (i - 2) * 6;
    const start = ["09:00", "10:00", "13:00", "13:30"][i % 4];
    const eind = ["12:00", "13:00", "16:00", "16:30"][i % 4];
    sessieRijen.push({
      projectId: projecten[i].id,
      workshopId: workshop.id,
      locationId: klant.locations[0].id,
      contactId: klant.contacts[0].id,
      datum: dagen(dagenVooruit),
      startTijd: start,
      eindTijd: eind,
      aanwezigVanaf: start === "09:00" ? "08:30" : "12:45",
      deelnemers: 20 + (i % 4) * 5,
      leeftijd: kies(["8 tot 10 jaar", "10 tot 12 jaar", "12 tot 15 jaar", "15 tot 18 jaar"], i),
      doelgroep: kies(["Bovenbouw PO", "VO", "MBO"], i),
      aantalRondes: (i % 3) + 1,
      tijdPerRonde: workshop.standaardDuur,
      ruimte: kies(["Gymzaal", "Aula", "Lokaal 2.14", "Speellokaal"], i),
      kleding: "Makkelijk zittende kleding en sportschoenen",
      benodigdheden: "Skool Workshop neemt alle materialen mee",
      bijzonderheden: i % 4 === 0 ? "Er is een leerling met gehoorapparaat in de groep." : null,
      telefoonOpDeDag: klant.contacts[0].mobiel,
      vergoeding: workshop.standaardVergoeding,
      status: "NIET_GEPUBLICEERD" as never,
    });
  }
  await db.workshopSession.createMany({ data: sessieRijen });
  const sessieLijst = await db.workshopSession.findMany();
  const sessiePerProject = new Map(sessieLijst.map((s) => [s.projectId, s]));
  const sessies = projecten.map((p) => sessiePerProject.get(p.id)!);

  // Rondes
  const rondeRijen = [];
  for (let i = 0; i < AANTAL_OPDRACHTEN; i++) {
    const aantalRondes = (i % 3) + 1;
    const start = ["09:00", "10:00", "13:00", "13:30"][i % 4];
    const eind = ["12:00", "13:00", "16:00", "16:30"][i % 4];
    for (let r = 1; r <= aantalRondes; r++) {
      rondeRijen.push({
        sessionId: sessies[i].id,
        nummer: r,
        startTijd: start,
        eindTijd: eind,
        groep: `Groep ${r}`,
        deelnemers: Math.round((20 + (i % 4) * 5) / aantalRondes),
      });
    }
  }
  await db.workshopRound.createMany({ data: rondeRijen });

  // Posities
  const positieRijen = [];
  for (let i = 0; i < AANTAL_OPDRACHTEN; i++) {
    const workshop = workshops[i % workshops.length];
    positieRijen.push({
      sessionId: sessies[i].id,
      rol: "WORKSHOPDOCENT" as never,
      aantal: i % 6 === 0 ? 2 : 1,
      vergoeding: workshop.standaardVergoeding,
      vereisteDocumenten: workshop.vereisteDocumenten,
      gepubliceerd: i % 7 !== 3,
      gesloten: false,
    });
  }
  await db.staffingPosition.createMany({ data: positieRijen });
  const positieLijst = await db.staffingPosition.findMany();
  const positiePerSessie = new Map(positieLijst.map((p) => [p.sessionId, p]));
  const posities = sessies.map((s) => positiePerSessie.get(s.id)!);

  // Bezetting varieren
  const toewijzingen: { positionId: string; teacherId: string; bevestigd: boolean; bevestigdOp: Date | null }[] = [];
  const aanmeldingen: Record<string, unknown>[] = [];
  const teSluiten: string[] = [];
  const sessieUpdates: { id: string; data: Record<string, unknown> }[] = [];
  const werkRegels: { i: number; positionId: string; teacherId: string }[] = [];

  for (let i = 0; i < AANTAL_OPDRACHTEN; i++) {
    const dagenVooruit = i < 3 ? -21 + i * 5 : (i - 2) * 6;
    const verleden = dagenVooruit < 0;
    const positie = posities[i];
    const aantalDocenten = i % 6 === 0 ? 2 : 1;

    const geschikt = docenten.filter((_, idx) => DOCENTEN_DATA[idx].ws.includes(i % workshops.length));
    const kandidaten = geschikt.length > 0 ? geschikt : docenten.slice(0, 3);

    if (verleden) {
      const doc = kandidaten[0];
      toewijzingen.push({ positionId: positie.id, teacherId: doc.id, bevestigd: true, bevestigdOp: dagen(dagenVooruit - 5) });
      aanmeldingen.push({ positionId: positie.id, teacherId: doc.id, soort: "AANMELDING", status: "BEVESTIGD", gereageerdOp: dagen(dagenVooruit - 7) });
      teSluiten.push(positie.id);
      sessieUpdates.push({ id: sessies[i].id, data: { status: "UITGEVOERD" } });
      werkRegels.push({ i, positionId: positie.id, teacherId: doc.id });
    } else if (i % 4 === 1) {
      for (let k = 0; k < aantalDocenten && k < kandidaten.length; k++) {
        toewijzingen.push({ positionId: positie.id, teacherId: kandidaten[k].id, bevestigd: k === 0, bevestigdOp: null });
        aanmeldingen.push({ positionId: positie.id, teacherId: kandidaten[k].id, soort: "AANMELDING", status: "GESELECTEERD", gereageerdOp: dagen(-3) });
      }
      teSluiten.push(positie.id);
      sessieUpdates.push({ id: sessies[i].id, data: { status: "VOLLEDIG_BEZET" } });
    } else if (i % 4 === 2) {
      for (let k = 0; k < Math.min(3, kandidaten.length); k++) {
        aanmeldingen.push({
          positionId: positie.id,
          teacherId: kandidaten[k].id,
          soort: "AANMELDING",
          status: "AANGEMELD",
          motivatie: k === 0 ? "Ik ken deze school en werk graag met deze leeftijd." : null,
          gereageerdOp: dagen(-2),
        });
      }
      sessieUpdates.push({
        id: sessies[i].id,
        data: { status: "AANMELDINGEN_ONTVANGEN", publicatieDatum: dagen(-5), aanmeldDeadline: dagen(Math.max(1, dagenVooruit - 5)) },
      });
    } else if (i % 4 === 3) {
      aanmeldingen.push({
        positionId: positie.id,
        teacherId: kandidaten[0].id,
        soort: "UITNODIGING",
        status: "UITGENODIGD",
        reactieDeadline: dagen(3),
      });
      sessieUpdates.push({ id: sessies[i].id, data: { status: "DOCENTEN_GEZOCHT", publicatieDatum: dagen(-1) } });
    } else {
      sessieUpdates.push({
        id: sessies[i].id,
        data: {
          status: positie.gepubliceerd ? "DOCENTEN_GEZOCHT" : "NIET_GEPUBLICEERD",
          publicatieDatum: positie.gepubliceerd ? dagen(-1) : null,
          aanmeldDeadline: dagen(Math.max(1, dagenVooruit - 3)),
        },
      });
    }
  }

  await db.assignment.createMany({ data: toewijzingen });
  await db.application.createMany({ data: aanmeldingen as never });
  if (teSluiten.length > 0) {
    await db.staffingPosition.updateMany({ where: { id: { in: teSluiten } }, data: { gesloten: true } });
  }

  // Werkregistraties voor de uitgevoerde opdrachten
  if (werkRegels.length > 0) {
    const toew = await db.assignment.findMany({ where: { positionId: { in: werkRegels.map((w) => w.positionId) } } });
    const perSleutel = new Map(toew.map((t) => [`${t.positionId}|${t.teacherId}`, t.id]));
    const regels = werkRegels.map((w) => {
      const i = w.i;
      const dagenVooruit = i < 3 ? -21 + i * 5 : (i - 2) * 6;
      const workshop = workshops[i % workshops.length];
      const start = ["09:00", "10:00", "13:00", "13:30"][i % 4];
      const eind = ["12:00", "13:00", "16:00", "16:30"][i % 4];
      const km = 24 + i * 3;
      const kmVerg = Math.round(km * 0.23 * 100) / 100;
      const basis = Number(workshop.standaardVergoeding);
      const parkeer = i % 2 === 0 ? 4.5 : 0;
      return {
        assignmentId: perSleutel.get(`${w.positionId}|${w.teacherId}`)!,
        teacherId: w.teacherId,
        startTijd: start,
        eindTijd: eind,
        uren: 3,
        kilometers: km,
        parkeerkosten: parkeer,
        workshopVergoeding: basis,
        kmVergoeding: kmVerg,
        totaal: Math.round((basis + kmVerg + parkeer) * 100) / 100,
        status: (i === 0 ? "BETAALD" : i === 1 ? "GOEDGEKEURD" : "INGEDIEND") as never,
        goedgekeurdOp: i <= 1 ? dagen(dagenVooruit + 3) : null,
        betaaldOp: i === 0 ? dagen(dagenVooruit + 10) : null,
        opmerking: i === 2 ? "Groep was groter dan afgesproken, extra ronde gedraaid." : null,
      };
    });
    await db.workRegistration.createMany({ data: regels });
  }

  for (const u of sessieUpdates) {
    await db.workshopSession.update({ where: { id: u.id }, data: u.data as never });
  }

  // Een geannuleerde opdracht voor de volledigheid
  await db.workshopSession.update({
    where: { id: sessies[AANTAL_OPDRACHTEN - 1].id },
    data: { status: "GEANNULEERD", bijzonderheden: "Geannuleerd door de klant wegens ziekte van de groep." },
  });

  return { opdrachten: AANTAL_OPDRACHTEN };
}

/* ======================= Stap 6: inschrijving ======================= */

export async function stapInschrijving(db: PrismaClient) {
  const workshops = await leesWorkshops(db);
  const docenten = await leesDocenten(db);
  const klanten = await leesKlanten(db);
  const jaar = new Date().getFullYear();

  const cultuurKlant = klanten[3]; // Newmancollege
  const cultuurProject = await db.project.create({
    data: {
      ordernummer: `SW${jaar}-${String(AANTAL_OPDRACHTEN + 1).padStart(4, "0")}`,
      clientId: cultuurKlant.id,
      locationId: cultuurKlant.locations[0].id,
      naam: `Cultuurdag ${jaar} bij ${cultuurKlant.naam}`,
      status: "BEVESTIGD",
      startDatum: dagen(45),
      eindDatum: dagen(45),
      omzet: 4250,
      materiaalkosten: 320,
    },
  });

  const inschrijving = await db.enrollment.create({
    data: {
      projectId: cultuurProject.id,
      titel: `Cultuurdag ${jaar}`,
      status: "OPEN",
      modus: "DIRECTE_KEUZE",
      codeScope: "KLAS",
      sluitingsdatum: dagen(30),
      welkomtekst: "Kies per ronde één workshop. Vol is vol, dus wacht niet te lang.",
      toonVrijePlekken: true,
      wijzigenToegestaan: true,
    },
  });

  const rondeTijden = [
    { nummer: 1, naam: "Ochtendronde", start: "09:15", eind: "10:30" },
    { nummer: 2, naam: "Middagronde", start: "10:45", eind: "12:00" },
    { nummer: 3, naam: "Afsluitronde", start: "12:45", eind: "14:00" },
  ];
  const ruimtes = ["Gymzaal", "Aula", "Lokaal 1.12", "Lokaal 1.14", "Techniekplein", "Buiten"];
  const gekozenWorkshops = [0, 3, 4, 6, 10, 13];

  await db.enrollmentRound.createMany({
    data: rondeTijden.map((rt) => ({
      enrollmentId: inschrijving.id,
      nummer: rt.nummer,
      naam: rt.naam,
      startTijd: rt.start,
      eindTijd: rt.eind,
    })),
  });
  const rondes = await db.enrollmentRound.findMany({ where: { enrollmentId: inschrijving.id }, orderBy: { nummer: "asc" } });

  const slotRijen = [];
  for (const ronde of rondes) {
    for (let w = 0; w < gekozenWorkshops.length; w++) {
      slotRijen.push({
        roundId: ronde.id,
        workshopId: workshops[gekozenWorkshops[w]].id,
        ruimte: ruimtes[w],
        capaciteit: w === 0 ? 24 : 20,
        teacherId: docenten[(w + ronde.nummer) % docenten.length].id,
      });
    }
  }
  await db.enrollmentSlot.createMany({ data: slotRijen });
  const alleSlots = await db.enrollmentSlot.findMany({ where: { roundId: { in: rondes.map((r) => r.id) } } });

  const voornamen = ["Sem", "Noa", "Liam", "Mila", "Luuk", "Saar", "Finn", "Tess", "Jesse", "Evi",
    "Bram", "Nora", "Lars", "Fenna", "Ties", "Julia", "Cas", "Roos", "Mees", "Anne"];
  const achternamen = ["Jansen", "Peters", "Visser", "Bakker", "Meijer"];

  await db.participant.createMany({
    data: Array.from({ length: 60 }, (_, i) => ({
      enrollmentId: inschrijving.id,
      voornaam: kies(voornamen, i),
      achternaam: kies(achternamen, i + 2),
      klas: KLASSEN[i % KLASSEN.length],
    })),
  });
  const leerlingen = await db.participant.findMany({ where: { enrollmentId: inschrijving.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });

  // Ongeveer twee derde heeft al gekozen, de rest nog niet
  const rondeIds = rondes.map((r) => r.id);
  const bezetting = new Map<string, number>();
  const keuzes: { participantId: string; slotId: string; roundId: string }[] = [];
  const compleetIds: string[] = [];

  for (let i = 0; i < 40 && i < leerlingen.length; i++) {
    const l = leerlingen[i];
    let compleet = true;
    for (const roundId of rondeIds) {
      const opties = alleSlots.filter((s) => s.roundId === roundId);
      const vrij = opties.filter((s) => (bezetting.get(s.id) ?? 0) < s.capaciteit);
      if (vrij.length === 0) { compleet = false; continue; }
      const slot = vrij[(i * 3 + rondeIds.indexOf(roundId)) % vrij.length];
      keuzes.push({ participantId: l.id, slotId: slot.id, roundId });
      bezetting.set(slot.id, (bezetting.get(slot.id) ?? 0) + 1);
    }
    if (compleet) compleetIds.push(l.id);
  }

  await db.choice.createMany({ data: keuzes });
  if (compleetIds.length > 0) {
    await db.participant.updateMany({ where: { id: { in: compleetIds } }, data: { ingeschrevenOp: dagen(-2) } });
  }

  // Toegangscodes per klas plus een code voor het schoolportaal
  const klasCodes = maakCodes(KLASSEN.length, 6);
  const schoolCode = maakCodes(1, 8)[0];
  await db.accessCode.createMany({
    data: [
      ...KLASSEN.map((klas, i) => ({
        enrollmentId: inschrijving.id,
        code: klasCodes[i],
        scope: "KLAS" as never,
        klas,
      })),
      { enrollmentId: inschrijving.id, code: schoolCode, scope: "EVENEMENT" as never, schoolPortaal: true },
    ],
  });

  return {
    wachtwoord: WACHTWOORD,
    accounts: [
      "superbeheerder@example.com",
      "planner@example.com",
      "financieel@example.com",
      "lezer@example.com",
      "docent1@example.com tot en met docent10@example.com",
    ],
    inschrijving: {
      titel: inschrijving.titel,
      leerlingen: leerlingen.length,
      klasCodes: KLASSEN.map((k, i) => `${k}: ${klasCodes[i]}`),
      schoolCode,
    },
  };
}

/* ======================= Stappen bundelen ======================= */

export const SEED_STAPPEN = [
  { sleutel: "leegmaken", titel: "Database leegmaken", fn: stapLeegmaken },
  { sleutel: "basis", titel: "Accounts en workshopcatalogus", fn: stapBasis },
  { sleutel: "docenten", titel: "Docenten", fn: stapDocenten },
  { sleutel: "klanten", titel: "Klanten en locaties", fn: stapKlanten },
  { sleutel: "opdrachten", titel: "Opdrachten en planning", fn: stapOpdrachten },
  { sleutel: "inschrijving", titel: "Demo-cultuurdag met inschrijving", fn: stapInschrijving },
] as const;

export type SeedResultaat = Record<string, unknown>;

/** Voert alle stappen achter elkaar uit. Gebruikt door prisma/seed.ts. */
export async function vulDemodata(db: PrismaClient): Promise<SeedResultaat> {
  let totaal: SeedResultaat = {};
  for (const stap of SEED_STAPPEN) {
    const r = await stap.fn(db);
    totaal = { ...totaal, ...r };
  }
  return totaal;
}
