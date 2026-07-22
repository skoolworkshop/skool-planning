/**
 * Demodata voor het planningsysteem van Skool Workshop.
 * Alle namen, adressen en gegevens zijn verzonnen. Geen echte persoonsgegevens.
 * Wordt gebruikt door prisma/seed.ts en door de eenmalige seed-route.
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

export async function vulDemodata(db: PrismaClient) {
    // Alles leeghalen in de juiste volgorde
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

  const hash = await bcrypt.hash(WACHTWOORD, 12);

  /* ---------------- Medewerkers ---------------- */
  const medewerkers = [
    { email: "superbeheerder@example.com", role: "SUPERBEHEERDER" as const },
    { email: "planner@example.com", role: "PLANNER" as const },
    { email: "financieel@example.com", role: "FINANCIEEL" as const },
    { email: "lezer@example.com", role: "LEZER" as const },
  ];
  for (const m of medewerkers) {
    await db.user.create({
      data: { email: m.email, role: m.role, passwordHash: hash, emailVerified: new Date() },
    });
  }

  /* ---------------- Workshopcatalogus ---------------- */
  const categorieen = [
    { naam: "Muziek", kleur: "#f47c20", volgorde: 1 },
    { naam: "Dans", kleur: "#7c3aed", volgorde: 2 },
    { naam: "Media en techniek", kleur: "#0ea5e9", volgorde: 3 },
    { naam: "Kunst en creatief", kleur: "#10b981", volgorde: 4 },
    { naam: "Sport en spel", kleur: "#ef4444", volgorde: 5 },
  ];
  const cats: Record<string, string> = {};
  for (const c of categorieen) {
    const r = await db.workshopCategory.create({ data: c });
    cats[c.naam] = r.id;
  }

  const workshopsData: {
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

  const workshops = [];
  for (const w of workshopsData) {
    workshops.push(
      await db.workshop.create({
        data: {
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
        },
      })
    );
  }

  /* ---------------- Docenten ---------------- */
  const docentenData = [
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

  const docenten = [];
  for (let i = 0; i < docentenData.length; i++) {
    const d = docentenData[i];
    const status =
      i === 8 ? "TER_BEOORDELING" :
      i === 9 ? "AANVULLING_NODIG" :
      "GOEDGEKEURD";

    const user = await db.user.create({
      data: {
        email: `docent${i + 1}@example.com`,
        role: "DOCENT",
        passwordHash: hash,
        emailVerified: new Date(),
        teacher: {
          create: {
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
            samenwerking: i % 3 === 0 ? "LOONDIENST" : "ZZP",
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
          },
        },
      },
      include: { teacher: true },
    });

    const t = user.teacher!;
    docenten.push(t);

    for (const w of d.ws) {
      await db.teacherWorkshopSkill.create({
        data: { teacherId: t.id, workshopId: workshops[w].id, niveau: ((i + w) % 3) + 1 },
      });
    }

    // Documenten. Docent 3 heeft een verlopen VOG, docent 5 mist er een.
    await db.teacherDocument.create({
      data: {
        teacherId: t.id,
        type: "VOG",
        bestandsnaam: "vog.pdf",
        uploadedAt: dagen(-200),
        vervaldatum: i === 3 ? dagen(-14) : dagen(400 + i),
        status: i === 3 ? "VERLOPEN" : i === 8 ? "IN_BEHANDELING" : "GOEDGEKEURD",
        verplicht: true,
      },
    });
    if (i !== 5) {
      await db.teacherDocument.create({
        data: {
          teacherId: t.id,
          type: "IDENTITEITSBEWIJS",
          bestandsnaam: "id.pdf",
          uploadedAt: dagen(-200),
          vervaldatum: dagen(900),
          status: i === 8 ? "AANGELEVERD" : "GOEDGEKEURD",
          verplicht: true,
        },
      });
    }
    if (i % 3 !== 0) {
      await db.teacherDocument.create({
        data: { teacherId: t.id, type: "KVK", bestandsnaam: "kvk.pdf", uploadedAt: dagen(-180), status: "GOEDGEKEURD" },
      });
    }
    if (d.ws.includes(9) || d.ws.includes(12)) {
      await db.teacherDocument.create({
        data: { teacherId: t.id, type: "CERTIFICAAT", bestandsnaam: "certificaat.pdf", uploadedAt: dagen(-100), status: "GOEDGEKEURD" },
      });
    }

    // Vaste beschikbaarheid
    for (const dag of [1, 2, 3, 4, 5].filter((x) => (x + i) % 5 !== 0)) {
      await db.availability.create({ data: { teacherId: t.id, weekdag: dag, beschikbaar: true } });
    }
  }

  /* ---------------- Klanten ---------------- */
  const klantenData = [
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

  const klanten = [];
  for (let i = 0; i < klantenData.length; i++) {
    const k = klantenData[i];
    const client = await db.client.create({
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
      include: { locations: true, contacts: true },
    });
    klanten.push(client);
  }

  /* ---------------- Projecten en opdrachten ---------------- */
  const jaar = new Date().getFullYear();
  let volgnummer = 1;
  const alleSessies: { id: string; posities: string[] }[] = [];

  for (let i = 0; i < 20; i++) {
    const klant = klanten[i % klanten.length];
    const loc = klant.locations[0];
    const contact = klant.contacts[0];
    const workshop = workshops[i % workshops.length];
    const dagenVooruit = i < 3 ? -21 + i * 5 : (i - 2) * 6;
    const datum = dagen(dagenVooruit);
    const verleden = dagenVooruit < 0;

    const project = await db.project.create({
      data: {
        ordernummer: `SW${jaar}-${String(volgnummer++).padStart(4, "0")}`,
        clientId: klant.id,
        locationId: loc.id,
        naam: `${workshop.naam} bij ${klant.naam}`,
        status: verleden ? "UITGEVOERD" : i % 5 === 0 ? "BEVESTIGD" : "PLANNING_GESTART",
        startDatum: datum,
        eindDatum: datum,
        omzet: Number(workshop.standaardVergoeding) * 2.4,
        materiaalkosten: 35,
      },
    });

    const start = ["09:00", "10:00", "13:00", "13:30"][i % 4];
    const eind = ["12:00", "13:00", "16:00", "16:30"][i % 4];
    const aantalRondes = (i % 3) + 1;

    const sessie = await db.workshopSession.create({
      data: {
        projectId: project.id,
        workshopId: workshop.id,
        locationId: loc.id,
        contactId: contact.id,
        datum,
        startTijd: start,
        eindTijd: eind,
        aanwezigVanaf: start === "09:00" ? "08:30" : "12:45",
        deelnemers: 20 + (i % 4) * 5,
        leeftijd: kies(["8 tot 10 jaar", "10 tot 12 jaar", "12 tot 15 jaar", "15 tot 18 jaar"], i),
        doelgroep: kies(["Bovenbouw PO", "VO", "MBO"], i),
        aantalRondes,
        tijdPerRonde: workshop.standaardDuur,
        ruimte: kies(["Gymzaal", "Aula", "Lokaal 2.14", "Speellokaal"], i),
        kleding: "Makkelijk zittende kleding en sportschoenen",
        benodigdheden: "Skool Workshop neemt alle materialen mee",
        bijzonderheden: i % 4 === 0 ? "Er is een leerling met gehoorapparaat in de groep." : null,
        telefoonOpDeDag: contact.mobiel,
        vergoeding: workshop.standaardVergoeding,
        status: "NIET_GEPUBLICEERD",
      },
    });

    for (let r = 1; r <= aantalRondes; r++) {
      await db.workshopRound.create({
        data: {
          sessionId: sessie.id,
          nummer: r,
          startTijd: start,
          eindTijd: eind,
          groep: `Groep ${r}`,
          deelnemers: Math.round((20 + (i % 4) * 5) / aantalRondes),
        },
      });
    }

    const aantalDocenten = i % 6 === 0 ? 2 : 1;
    const positie = await db.staffingPosition.create({
      data: {
        sessionId: sessie.id,
        rol: "WORKSHOPDOCENT",
        aantal: aantalDocenten,
        vergoeding: workshop.standaardVergoeding,
        vereisteDocumenten: workshop.vereisteDocumenten,
        gepubliceerd: i % 7 !== 3,
        gesloten: false,
      },
    });

    alleSessies.push({ id: sessie.id, posities: [positie.id] });

    // Bezetting varieren
    const geschikt = docenten.filter((_, idx) => docentenData[idx].ws.includes(i % workshops.length));
    const kandidaten = geschikt.length > 0 ? geschikt : docenten.slice(0, 3);

    if (verleden) {
      const doc = kandidaten[0];
      const toew = await db.assignment.create({
        data: { positionId: positie.id, teacherId: doc.id, bevestigd: true, bevestigdOp: dagen(dagenVooruit - 5) },
      });
      await db.application.create({
        data: { positionId: positie.id, teacherId: doc.id, soort: "AANMELDING", status: "BEVESTIGD", gereageerdOp: dagen(dagenVooruit - 7) },
      });
      await db.staffingPosition.update({ where: { id: positie.id }, data: { gesloten: true } });
      await db.workshopSession.update({ where: { id: sessie.id }, data: { status: "UITGEVOERD" } });

      const uren = 3;
      const km = 24 + i * 3;
      const kmVerg = Math.round(km * 0.23 * 100) / 100;
      const basis = Number(workshop.standaardVergoeding);
      await db.workRegistration.create({
        data: {
          assignmentId: toew.id,
          teacherId: doc.id,
          startTijd: start,
          eindTijd: eind,
          uren,
          kilometers: km,
          parkeerkosten: i % 2 === 0 ? 4.5 : 0,
          workshopVergoeding: basis,
          kmVergoeding: kmVerg,
          totaal: Math.round((basis + kmVerg + (i % 2 === 0 ? 4.5 : 0)) * 100) / 100,
          status: i === 0 ? "BETAALD" : i === 1 ? "GOEDGEKEURD" : "INGEDIEND",
          goedgekeurdOp: i <= 1 ? dagen(dagenVooruit + 3) : null,
          betaaldOp: i === 0 ? dagen(dagenVooruit + 10) : null,
          opmerking: i === 2 ? "Groep was groter dan afgesproken, extra ronde gedraaid." : null,
        },
      });
    } else if (i % 4 === 1) {
      // Volledig bezet
      for (let k = 0; k < aantalDocenten && k < kandidaten.length; k++) {
        await db.assignment.create({
          data: { positionId: positie.id, teacherId: kandidaten[k].id, bevestigd: k === 0 },
        });
        await db.application.create({
          data: { positionId: positie.id, teacherId: kandidaten[k].id, soort: "AANMELDING", status: "GESELECTEERD", gereageerdOp: dagen(-3) },
        });
      }
      await db.staffingPosition.update({ where: { id: positie.id }, data: { gesloten: true } });
      await db.workshopSession.update({ where: { id: sessie.id }, data: { status: "VOLLEDIG_BEZET" } });
    } else if (i % 4 === 2) {
      // Aanmeldingen ontvangen, nog niemand gekozen
      for (let k = 0; k < Math.min(3, kandidaten.length); k++) {
        await db.application.create({
          data: {
            positionId: positie.id,
            teacherId: kandidaten[k].id,
            soort: "AANMELDING",
            status: "AANGEMELD",
            motivatie: k === 0 ? "Ik ken deze school en werk graag met deze leeftijd." : null,
            gereageerdOp: dagen(-2),
          },
        });
      }
      await db.workshopSession.update({ where: { id: sessie.id }, data: { status: "AANMELDINGEN_ONTVANGEN", publicatieDatum: dagen(-5), aanmeldDeadline: dagen(Math.max(1, dagenVooruit - 5)) } });
    } else if (i % 4 === 3) {
      // Directe uitnodiging die nog open staat
      const doc = kandidaten[0];
      await db.application.create({
        data: {
          positionId: positie.id,
          teacherId: doc.id,
          soort: "UITNODIGING",
          status: "UITGENODIGD",
          reactieDeadline: dagen(3),
        },
      });
      await db.workshopSession.update({ where: { id: sessie.id }, data: { status: "DOCENTEN_GEZOCHT", publicatieDatum: dagen(-1) } });
    } else {
      // Open, nog geen reacties
      await db.workshopSession.update({
        where: { id: sessie.id },
        data: { status: positie.gepubliceerd ? "DOCENTEN_GEZOCHT" : "NIET_GEPUBLICEERD", publicatieDatum: positie.gepubliceerd ? dagen(-1) : null, aanmeldDeadline: dagen(Math.max(1, dagenVooruit - 3)) },
      });
    }
  }

  // Een geannuleerde opdracht voor de volledigheid
  const laatste = alleSessies[alleSessies.length - 1];
  await db.workshopSession.update({ where: { id: laatste.id }, data: { status: "GEANNULEERD", bijzonderheden: "Geannuleerd door de klant wegens ziekte van de groep." } });

  /* ---------------- Module B: demo-inschrijving ---------------- */
  // Een cultuurdag met drie rondes, zes workshops en 60 leerlingen.
  const cultuurKlant = klanten[3]; // Newmancollege
  const cultuurProject = await db.project.create({
    data: {
      ordernummer: `SW${jaar}-${String(volgnummer++).padStart(4, "0")}`,
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

  const alleSlots: { id: string; roundId: string; capaciteit: number }[] = [];
  for (const rt of rondeTijden) {
    const ronde = await db.enrollmentRound.create({
      data: {
        enrollmentId: inschrijving.id,
        nummer: rt.nummer,
        naam: rt.naam,
        startTijd: rt.start,
        eindTijd: rt.eind,
      },
    });
    for (let w = 0; w < gekozenWorkshops.length; w++) {
      const slot = await db.enrollmentSlot.create({
        data: {
          roundId: ronde.id,
          workshopId: workshops[gekozenWorkshops[w]].id,
          ruimte: ruimtes[w],
          capaciteit: w === 0 ? 24 : 20,
          teacherId: docenten[(w + rt.nummer) % docenten.length].id,
        },
      });
      alleSlots.push({ id: slot.id, roundId: ronde.id, capaciteit: slot.capaciteit });
    }
  }

  const voornamen = ["Sem", "Noa", "Liam", "Mila", "Luuk", "Saar", "Finn", "Tess", "Jesse", "Evi",
    "Bram", "Nora", "Lars", "Fenna", "Ties", "Julia", "Cas", "Roos", "Mees", "Anne"];
  const achternamen = ["Jansen", "Peters", "Visser", "Bakker", "Meijer"];
  const klassen = ["2A", "2B", "2C"];

  const leerlingen = [];
  for (let i = 0; i < 60; i++) {
    leerlingen.push(
      await db.participant.create({
        data: {
          enrollmentId: inschrijving.id,
          voornaam: kies(voornamen, i),
          achternaam: kies(achternamen, i + 2),
          klas: klassen[i % klassen.length],
        },
      })
    );
  }

  // Ongeveer twee derde heeft al gekozen, de rest nog niet
  const rondeIds = [...new Set(alleSlots.map((s) => s.roundId))];
  const bezetting = new Map<string, number>();
  for (let i = 0; i < 40; i++) {
    const l = leerlingen[i];
    let compleet = true;
    for (const roundId of rondeIds) {
      const opties = alleSlots.filter((s) => s.roundId === roundId);
      const vrij = opties.filter((s) => (bezetting.get(s.id) ?? 0) < s.capaciteit);
      if (vrij.length === 0) { compleet = false; continue; }
      const slot = vrij[(i * 3 + rondeIds.indexOf(roundId)) % vrij.length];
      await db.choice.create({ data: { participantId: l.id, slotId: slot.id, roundId } });
      bezetting.set(slot.id, (bezetting.get(slot.id) ?? 0) + 1);
    }
    if (compleet) {
      await db.participant.update({ where: { id: l.id }, data: { ingeschrevenOp: dagen(-2) } });
    }
  }

  // Toegangscodes per klas plus een code voor het schoolportaal
  const klasCodes = maakCodes(klassen.length, 6);
  for (let i = 0; i < klassen.length; i++) {
    await db.accessCode.create({
      data: { enrollmentId: inschrijving.id, code: klasCodes[i], scope: "KLAS", klas: klassen[i] },
    });
  }
  const schoolCode = maakCodes(1, 8)[0];
  await db.accessCode.create({
    data: { enrollmentId: inschrijving.id, code: schoolCode, scope: "EVENEMENT", schoolPortaal: true },
  });

  /* ---------------- Berichtsjablonen ---------------- */
  const sjablonen = [
    { sleutel: "NIEUWE_OPDRACHT", onderwerp: "Nieuwe opdracht die bij je past" },
    { sleutel: "GESELECTEERD", onderwerp: "Je bent ingepland" },
    { sleutel: "HERINNERING_OPDRACHT", onderwerp: "Herinnering: opdracht binnenkort" },
    { sleutel: "WERKREGISTRATIE_VERZOEK", onderwerp: "Rond je opdracht af" },
  ];
  for (const s of sjablonen) {
    await db.notificationTemplate.create({
      data: { sleutel: s.sleutel, kanaal: "EMAIL", onderwerp: s.onderwerp, inhoud: "Standaardtekst uit de code, hier aan te passen.", actief: true },
    });
  }

  return {
    wachtwoord: WACHTWOORD,
    accounts: [
      "superbeheerder@example.com",
      "planner@example.com",
      "financieel@example.com",
      "lezer@example.com",
      "docent1@example.com tot en met docent10@example.com",
    ],
    workshops: workshops.length,
    docenten: docenten.length,
    klanten: klanten.length,
    opdrachten: alleSessies.length,
    inschrijving: {
      titel: inschrijving.titel,
      leerlingen: leerlingen.length,
      klasCodes: klassen.map((k, i) => `${k}: ${klasCodes[i]}`),
      schoolCode,
    },
  };
}

