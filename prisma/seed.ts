/**
 * Demodata laden vanaf de commandoregel.
 * Draaien met: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { vulDemodata } from "../src/lib/seed-data";

const db = new PrismaClient();

type Uitvoer = {
  workshops: number; docenten: number; klanten: number; opdrachten: number;
  wachtwoord: string; accounts: string[];
  inschrijving: { titel: string; leerlingen: number; klasCodes: string[]; schoolCode: string };
};

vulDemodata(db)
  .then((res) => {
    const r = res as unknown as Uitvoer;
    console.log("Klaar.");
    console.log("");
    console.log(`${r.workshops} workshops, ${r.docenten} docenten, ${r.klanten} klanten, ${r.opdrachten} opdrachten.`);
    console.log("");
    console.log("Demo accounts, wachtwoord: " + r.wachtwoord);
    for (const a of r.accounts) console.log("  " + a);
    console.log("");
    console.log(`Demo-inschrijving: ${r.inschrijving.titel}, ${r.inschrijving.leerlingen} leerlingen.`);
    console.log("Toegangscodes voor leerlingen op /inschrijven");
    for (const c of r.inschrijving.klasCodes) console.log("  " + c);
    console.log("Code voor het schoolportaal: " + r.inschrijving.schoolCode);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
