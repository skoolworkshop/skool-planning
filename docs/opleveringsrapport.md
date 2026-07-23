# Opleveringsrapport opschoning juli 2026

Alle wijzigingen zijn doorgevoerd in de bestaande codebase. Er is niets opnieuw gebouwd.
Build slaagt, 85 tests slagen, geen TypeScript- of lintfouten.

---

## 1. Samenvatting

| Onderdeel | Wat er is gebeurd |
| --- | --- |
| Dashboard | Documenten eruit, standaard de huidige maand met maandnavigatie |
| VOG | Geen verloopdatum, geen verlopen-status, geen waarschuwingen meer |
| Projecten en opdrachten | Samengevoegd tot één omgeving onder Opdrachten |
| Planning | Volledig verwijderd, datum en tijd blijven bestaan |
| Reservelijst | Volledig verwijderd |
| Toewijzing | Direct definitief, geen bevestiging door de workshopdocent |
| Zelfbeoordeling | Vervangen door een beheerstatus per workshop |
| Bio | Verwijderd uit profiel, schema en schermen |
| Tarieven | Per workshopdocent instelbaar met historie, workshopdocent kan alleen kijken |
| Workshopinformatie | Algemeen en opdrachtspecifiek gescheiden |
| Doelgroep | Vaste lijst van zeventien waarden, met migratie en controlelijst |
| Workshopfoto's | Opgehaald van de site en opgeslagen in de app, niet gehotlinkt |
| Interface | Warme crème basis, witte kaarten, Skool-oranje als accent |

---

## 2. Nieuwe bestanden

| Pad | Wat het doet |
| --- | --- |
| `src/lib/doelgroepen.ts` | De enige doelgroeplijst, met labels en herkenning van oude vrije tekst |
| `src/lib/documenten.ts` | Alle regels rond documentgeldigheid. Hier staat dat een VOG niet verloopt |
| `src/lib/maand.ts` | Rekent met maanden voor het dashboard en het opdrachtenoverzicht |
| `src/lib/afbeeldingen.ts` | Haalt workshopfoto's op via de WordPress API of og:image en slaat ze op |
| `src/lib/migratie-acties.ts` | Zet oude doelgroepteksten om en levert een controlelijst |
| `src/components/Maandkiezer.tsx` | Vorige, volgende, maandkeuze en terug naar nu |
| `src/app/api/workshop-foto/[id]/route.ts` | Serveert de opgeslagen foto uit de database |
| `src/app/beheer/docenten/[id]/Bevoegdheden.tsx` | Beheerder zet per workshop wat een workshopdocent mag |
| `src/app/beheer/docenten/[id]/Tarief.tsx` | Tarief, ingangsdatum, notitie en historie |
| `src/app/beheer/instellingen/Tarieven.tsx` | Standaardtarieven voor iedereen |
| `src/app/beheer/instellingen/Migratie.tsx` | Knop voor de eenmalige doelgroepomzetting |
| `src/app/beheer/workshops/Koppeling.tsx` | Handmatig een workshop aan de juiste pagina koppelen |
| `src/app/docent/profiel/MijnWorkshops.tsx` | Alleen bekijken waarvoor je bent goedgekeurd |
| `prisma/migraties/001-opschonen.sql` | Datamigratie met back-upadvies en rollbackplan |
| `tests/opschoning.test.ts` | 35 tests op alle acceptatiecriteria |

## 3. Verwijderde bestanden en routes

| Pad | Reden |
| --- | --- |
| `src/app/beheer/planning/` | Planningmodule vervalt |
| `src/app/docent/kalender/` | Kalenderweergave vervalt |
| `src/app/beheer/projecten/` | Samengevoegd met opdrachten |
| `src/app/beheer/projecten/nieuw/Wizard.tsx` | Vervangen door de snelle planner |
| `src/app/docent/profiel/WorkshopKiezer.tsx` | Workshopdocent koppelt zichzelf niet meer |

Verwijderde routes: `/beheer/planning`, `/beheer/projecten`, `/beheer/projecten/nieuw`,
`/beheer/projecten/[id]`, `/docent/kalender`. Er staan geen links meer naar deze paden;
een test controleert dat.

Verwijderde serveracties: `opdrachtBevestigen`, `workshopKoppelen`, en de reserveroute
binnen `docentToewijzen` en `aanmeldingStatus`.

## 4. Belangrijkste gewijzigde bestanden

| Pad | Wijziging |
| --- | --- |
| `prisma/schema.prisma` | Enums `Doelgroep` en `Bevoegdheid` toegevoegd, `RESERVELIJST` en `BEVESTIGD` vervangen door `TOEGEWEZEN`, `bio` weg, reserve- en bevestigingsvelden weg uit `Assignment`, `niveau` en `zelfstandig` vervangen door `bevoegdheid`, tariefvelden en afbeeldingsvelden erbij, modellen `TariefHistorie` en `WorkshopAfbeelding` erbij |
| `src/lib/planning-acties.ts` | `docentToewijzen` is direct definitief en controleert nu bevoegdheid, verplichte documenten en dubbele boeking. `herberekenStatus` afgeschermd |
| `src/lib/docent-acties.ts` | Tarieven niet meer zelf op te slaan, bio weg, `magOpdracht` leest de workshopdocent uit de sessie in plaats van uit een meegegeven id |
| `src/lib/tarief-acties.ts` | `docentTariefOpslaan` met historie, reden en auditlog |
| `src/lib/opdracht-acties.ts` | `bevoegdheidZetten` erbij, klantgegevens met vaste doelgroepen |
| `src/lib/matching.ts` | Scoort op bevoegdheid in plaats van op zelfbeoordeeld niveau |
| `src/lib/berichten.ts` | Inplanbericht is definitief, reservetekst weg, geen bevestigingsverzoeken |
| `src/lib/seed-data.ts` | Echte catalogus, bevoegdheden, VOG zonder vervaldatum, vaste doelgroepen |
| `src/app/beheer/page.tsx` | Volledig herschreven: maandweergave, geen documenten |
| `src/app/beheer/opdrachten/page.tsx` | Nieuw samengevoegd overzicht met maand, zoeken en filters |
| `src/app/beheer/layout.tsx` | Nieuwe navigatie zonder Planning en Projecten |
| `src/app/docent/layout.tsx` | Home, Open opdrachten, Mijn opdrachten, Meldingen, Profiel |
| `src/components/ui.tsx` | Rustiger kaarten, zachte badges met dunne rand |
| `tailwind.config.ts` | Skool-oranje `#F49700`, warme crème schaal |
| `src/app/globals.css` | Crème achtergrond, ruimere velden, rondere hoeken |

## 5. Database en migraties

**Nieuwe modellen.** `TariefHistorie` en `WorkshopAfbeelding`.

**Nieuwe enums.** `Doelgroep` met zeventien waarden, `Bevoegdheid` met drie waarden.
`DocStatus` uitgebreid met `AANVULLING_NODIG`.

**Gewijzigde velden.**

| Model | Verwijderd | Toegevoegd |
| --- | --- | --- |
| `TeacherProfile` | `bio` | `tariefVanaf`, `tariefNotitie`, `tariefDoor`, `tariefOp`; `doelgroepen` van `String[]` naar `Doelgroep[]` |
| `TeacherWorkshopSkill` | `niveau`, `zelfstandig` | `bevoegdheid`, `gezetDoor`, `gezetOp` |
| `Assignment` | `reserve`, `bevestigd`, `bevestigdOp` | `toegewezenDoor`, `toegewezenOp` |
| `ApplicationStatus` | `RESERVELIJST`, `BEVESTIGD` | `TOEGEWEZEN` |
| `Client` | `doelgroep` als tekst | `doelgroepen`, `doelgroepToelichting`, `cjpNummer` |
| `WorkshopSession` | `doelgroep` als tekst | `doelgroep` als enum, `doelgroepToelichting`, `afbouwTot` |
| `Workshop` | | `afbeeldingAlt`, `bronPaginaUrl`, `bronAfbeeldingUrl`, `afbeeldingGesyncedOp`, `afbeeldingControle` |
| `WorkshopRound` | | `afdeling`, `aantalGroepen` |

**Volgorde van uitvoeren.**

1. Maak een back-up. Bij Neon kan dat met een branch of `pg_dump`.
2. Draai `prisma/migraties/001-opschonen.sql` op de database. Dit zet reservestatussen om,
   verwijdert reservetoewijzingen en maakt de vervaldatum van elke VOG leeg.
3. Deploy de nieuwe code. De build draait `prisma db push --accept-data-loss`, waarmee de
   kolomwijzigingen worden doorgevoerd.
4. Draai in de app onder Instellingen de knop **Doelgroepen omzetten**. Die zet de oude vrije
   tekst om en toont wat je zelf moet nalopen.
5. Draai onder Workshops de knop **Foto's ophalen van de site**.

**Rollback.** De verwijderde kolommen zijn niet terug te rekenen. Zet in dat geval de back-up
van stap 1 terug. Historische opdrachtgegevens blijven bij een normale uitvoering behouden.

## 6. Rechten

**Beheerder.** Opdrachten beheren, workshopdocenten uitnodigen en toewijzen, klanten en
workshops beheren, tarieven per workshopdocent aanpassen, bevoegdheden aanpassen,
aanmeldingen beoordelen, rapportages bekijken.

**Workshopdocent.** Eigen profiel bekijken en de toegestane velden aanpassen, eigen tarieven
bekijken maar niet wijzigen, open opdrachten bekijken binnen de eigen maximale reisafstand,
aanmelden, eigen aanmeldingen en toegewezen opdrachten bekijken, meldingen bekijken,
documenten uploaden, bekijken voor welke workshops hij is goedgekeurd.

**Wijzigingen in de afscherming.**

- `profielOpslaan` schrijft `uurtarief`, `minDagtarief` en `kmVergoeding` niet meer weg.
  Een API-call helpt dus niet, de velden worden genegeerd.
- `magOpdracht` haalt de workshopdocent uit de sessie. Voorheen kon je een ander id meegeven.
- `bevoegdheidZetten` en `docentTariefOpslaan` eisen `vereisRol(...BEHEER)`.
- `herberekenStatus` eist een ingelogde gebruiker.
- Elke serveractie die bewust publiek is, staat gemarkeerd met `// PUBLIEK:` en een reden.
  Een test controleert dat er geen enkele ongemarkeerde en ongecontroleerde actie bestaat,
  en dat geen beheeractie per ongeluk publiek staat.

## 7. Tarieven per workshopdocent

Op `/beheer/docenten/[id]` staat het blok **Tarief en vervoer**. Daar zet je het uurtarief,
het minimum per dag, de kilometervergoeding, de ingangsdatum, een interne notitie en de
maximale reisafstand. Laat je een veld leeg, dan geldt het standaardtarief uit Instellingen.

Elke wijziging schrijft een regel in `TariefHistorie` met het veld, de oude waarde, de nieuwe
waarde, de reden, wie en wanneer. Datzelfde gaat naar de auditlog. De historie staat
uitklapbaar onder de tariefkaart.

De berekening zelf staat in `src/lib/tarieven.ts`: uren maal uurtarief met het dagminimum
eroverheen, kilometers maal het kilometertarief maal twee, en bij meer dan anderhalf uur
enkele reis het halve uurtarief als reistijdvergoeding, ook maal twee.

## 8. Workshopfoto's

De synchronisatie probeert eerst `https://skoolworkshop.nl/wp-json/wp/v2/workshops?slug=...`
met `_embed=wp:featuredmedia`. Lukt dat niet, dan leest hij de `og:image` uit de
workshoppagina. De koppeling loopt via `siteSlug`, dus op de exacte pagina van die workshop.

De afbeelding wordt gedownload, gecontroleerd op type en grootte, en met een sha256-hash
opgeslagen in `WorkshopAfbeelding`. Is de hash gelijk aan wat er al ligt, dan wordt er niets
opnieuw weggeschreven. De app serveert de foto via `/api/workshop-foto/[id]` met een lange
cachetijd en een etag. Er wordt dus niet permanent gehotlinkt.

Per workshop worden `bronPaginaUrl`, `bronAfbeeldingUrl`, `afbeeldingAlt` en
`afbeeldingGesyncedOp` bewaard.

Lukt het niet betrouwbaar, dan wordt er niets gegokt. De workshop krijgt
`afbeeldingControle = true`, verschijnt in de controlelijst na het synchroniseren en toont een
oranje label **Controleren** op de kaart. Met de knop **Foto koppelen** wijs je zelf de juiste
pagina aan.

Foto's zijn zichtbaar op de workshopkaarten, in het opdrachtenoverzicht, op het dashboard, in
het keuzeraster van de planner en in het profiel van de workshopdocent. Overal met vaste
beeldverhouding, `object-cover`, `loading="lazy"` en een alt-tekst.

## 9. Doelgroepen

De zeventien waarden staan in `src/lib/doelgroepen.ts`. Nergens anders staat nog een lijstje.
Vrije tekstvelden zijn vervangen door selectielijsten en aankruisvakjes. Bij **Overig**
verschijnt een toelichtingsveld, dat de gekozen waarde niet vervangt.

De omzetting herkent onder meer PO, VO, VMBO, HAVO, VWO, MBO, HBO, BSO, speciaal onderwijs,
teamuitje en kinderfeestje. Wat niet zeker is wordt niet gegokt maar in de controlelijst
gezet, met vermelding van waar het staat en wat de oude waarde was.

## 10. Tests

`npm test` draait 85 tests, allemaal groen.

| Bestand | Wat het dekt |
| --- | --- |
| `tests/opschoning.test.ts` | 35 tests op alle acceptatiecriteria van deze opdracht |
| `tests/bevestiging.test.ts` | 16 tests op het tijdschema en de bevestigingsmail |
| `tests/tarieven.test.ts` | 8 tests op uurtarief, dagminimum, reiskosten en reistijd |
| `tests/inschrijving.test.ts` | 12 tests op codes, capaciteit, voorkeuren en CSV |
| `tests/eenheid.test.ts` | Declaratieformule, dubbele boeking, documentgeldigheid |
| `tests/notificaties.test.ts` | Berichtsjablonen |

De opschoningstests lezen de broncode zelf, zodat verwijderde functies ook echt weg blijven.
Ze controleren onder meer dat het dashboard geen documentwoorden meer bevat, dat er nergens
nog naar `/beheer/planning` of `/beheer/projecten` wordt verwezen, dat `RESERVELIJST` niet
meer voorkomt, dat geen enkel bestand nog een VOG aan een vervaldatum koppelt, en dat elke
serveractie een rolcontrole heeft of expliciet als publiek is gemarkeerd.

**Uitgevoerd.** TypeScript zonder fouten, `next lint` zonder fouten (één waarschuwing over een
hook-afhankelijkheid in de planner, bewust zo gelaten omdat de afdelingenlijst al via
`afdelingen` in de lijst staat), 85 unit- en integratietests, productiebuild geslaagd met 39
routes.

## 11. Bekende beperkingen

- Afbeeldingen worden als bytes in Postgres bewaard. Dat werkt prima bij deze omvang, maar bij
  honderden workshops is een aparte opslagdienst zoals Vercel Blob netter.
- Er zijn geen echte end-to-endtests met een browser. De tests werken op de broncode en op de
  losse rekenmodules. Voor een browsertest is een testdatabase nodig.
- `prisma db push` in de buildstap is prettig voor nu, maar bij een groeiend team is een
  echte migratiegeschiedenis met `prisma migrate` beter.
- De reistijd wordt geschat uit de afstand in kilometers. Voor exacte reistijd is een
  routedienst nodig.
- Meldingen staan nog in `NOTIFY_MODE=dev`. Ze worden opgeslagen maar niet verstuurd.

## 12. Aanbevolen vervolgstappen

1. Zet `NOTIFY_MODE` op productie zodra de mailafzender is ingericht.
2. Regel een verwerkersovereenkomst met de scholen voordat er echte leerlinggegevens in staan.
3. Neem het betaalde Neon-pakket voor een langere hersteltermijn.
4. Draai de doelgroepmigratie en loop de controlelijst na.
5. Overweeg Vercel Blob voor de afbeeldingen als de catalogus groeit.
