# Skool Workshop Planningsysteem

Webapplicatie voor het plannen van workshops, docenten en opdrachten. Gebouwd voor Skool Workshop.
Twee omgevingen in één app.

- `/beheer` voor kantoor, ontworpen voor desktop
- `/docent` voor workshopdocenten, ontworpen voor mobiel als PWA

De app bestaat uit twee modules op dezelfde database.

Module A, planning. Voor kantoor en docenten.
Module B, inschrijving. Voor scholen en leerlingen.

## Wat het systeem doet

- Docentenbeheer met profiel, workshops, documenten, beschikbaarheid en goedkeuring
- Workshopcatalogus met categorieën, vergoedingen en verplichte documenten
- Klanten, locaties en contactpersonen
- Projecten met workshopmomenten, rondes en posities
- Opdrachten publiceren, docenten laten aanmelden of persoonlijk uitnodigen
- Matching met score, reisafstand, beschikbaarheid en waarschuwingen. De planner beslist altijd zelf
- Toewijzen met controle op dubbele boekingen
- Kalender voor kantoor en voor de docent
- Werkregistratie met uren, kilometers en onkosten, plus goedkeuring en betaling
- Meldingen in de app, per e-mail en optioneel via WhatsApp
- Rapportages en CSV export
- Auditlog en rolgebaseerde rechten

### Module B, inschrijving

- Inschrijving opzetten op een bestaand project, met rondes, workshops, ruimtes, docenten en capaciteit
- Drie manieren van kiezen: direct kiezen, voorkeuren opgeven, of klassikaal rouleren
- Toegangscodes per school, per klas of per leerling. Leerlingen loggen niet in
- Leerlingenlijst importeren via CSV, of leerlingen voegen zichzelf toe
- Leerling kiest op de telefoon, ziet vrije plekken en krijgt direct het eigen rooster
- Plekken worden vastgelegd in een databasetransactie, dus nooit twee leerlingen op de laatste plek
- Een leerling kan nooit twee workshops in dezelfde ronde krijgen, dat is een databaseregel
- Schoolportaal met voortgangsbalk, wie nog niet klaar is en vulling per workshop
- Automatisch indelen van iedereen die niets heeft gekozen
- Zes lijsten, elk als printbare PDF en als CSV: persoonlijke roosters, presentielijsten, klassenlijsten, dagrooster, docentenrooster en materiaaloverzicht

## Techniek

- Next.js 14 met App Router en TypeScript
- Tailwind CSS
- PostgreSQL met Prisma
- Eigen sessie-authenticatie met JWT in een httpOnly cookie
- Wachtwoorden met bcrypt
- Server actions voor alle schrijfacties

## Installeren

Je hebt Node 20 of hoger nodig en een PostgreSQL database.

```bash
npm install
cp .env.example .env      # vul je eigen waarden in
npm run db:push           # zet het datamodel in de database
npm run db:seed           # vult demodata
npm run dev
```

De app draait dan op http://localhost:3000

## Omgevingsvariabelen

| Variabele | Verplicht | Wat het doet |
| --- | --- | --- |
| `DATABASE_URL` | ja | Verbinding met PostgreSQL |
| `AUTH_SECRET` | ja | Sleutel voor de sessiecookie, minimaal 32 tekens |
| `APP_URL` | ja | Basis-URL, gebruikt in links in e-mails |
| `NOTIFY_MODE` | nee | `dev` logt berichten alleen, `live` verstuurt echt |
| `RESEND_API_KEY` | alleen bij live | API sleutel voor e-mail |
| `EMAIL_FROM` | alleen bij live | Afzender, bijvoorbeeld planning@skoolworkshop.nl |
| `WHATSAPP_PHONE_NUMBER_ID` | optioneel | Meta WhatsApp Cloud API |
| `WHATSAPP_TOKEN` | optioneel | Meta WhatsApp Cloud API |
| `SEED_WACHTWOORD` | nee | Wachtwoord voor de demo accounts |

Genereer een sleutel met:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Demo accounts

Wachtwoord standaard `SkoolDemo2026!`, of wat je in `SEED_WACHTWOORD` zet.

| E-mail | Rol |
| --- | --- |
| superbeheerder@example.com | Superbeheerder |
| planner@example.com | Planner |
| financieel@example.com | Financiële administratie |
| lezer@example.com | Alleen lezen |
| docent1@example.com tot en met docent10@example.com | Workshopdocent |

Alle demogegevens zijn verzonnen. Er staat geen enkel echt persoonsgegeven in.

## Deployen op Vercel

Stap voor stap staat in `DEPLOY.md`. Kort samengevat:

1. Maak een PostgreSQL database aan bij Neon, Supabase of Vercel Postgres
2. Zet de code in een GitHub repository
3. Importeer de repository in Vercel en zet de omgevingsvariabelen
4. Deploy. Het build commando draait `prisma generate` en `prisma db push`, dus de tabellen worden vanzelf aangemaakt
5. Vul de demodata via `/api/seed?token=...` met het token uit `SEED_TOKEN`. Dit loopt in zes stappen, klik telkens door naar de volgende
6. Maak `SEED_TOKEN` daarna leeg

Let op: dit is geen statische site. Zonder database werkt de app niet.

## Rollen en rechten

| Rol | Mag |
| --- | --- |
| Superbeheerder | Alles, inclusief medewerkers en bankgegevens |
| Planner | Docenten, klanten, projecten, opdrachten, toewijzen |
| Financiële administratie | Declaraties, betalingen, bankgegevens |
| Alleen lezen | Alles bekijken, niets wijzigen |
| Workshopdocent | Eigen profiel, opdrachten en werkregistratie |

Bankgegevens en identiteitsdocumenten zijn alleen zichtbaar voor superbeheerder en financiële administratie.
Adres en contactgegevens van een klant worden pas aan een docent getoond nadat hij is toegewezen.

## Meldingen

In `dev` modus wordt er niets verstuurd. Alles komt in de berichtenlog onder Instellingen.
Zet `NOTIFY_MODE=live` en vul de sleutels om echt te versturen. WhatsApp loopt via de officiële
Meta Cloud API, dus geen onofficiële automatisering.

## Testen

```bash
npm test        # eenheidstests, geen database nodig
npm run typecheck
npm run build
```

De handmatige acceptatietests staan in `docs/acceptatie.md`.

## Backup

Maak dagelijks een dump van de database:

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```

Neon en Supabase hebben ingebouwde automatische backups. Zet die aan.

## Documentatie

- `docs/acceptatie.md` handmatige testlijst
- `docs/import.md` importsjabloon voor docenten en klanten
- `docs/privacy.md` wat er wordt opgeslagen en wie het ziet
- `DEPLOY.md` live zetten via GitHub en Vercel, zonder terminal
