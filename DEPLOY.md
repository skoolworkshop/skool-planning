# Live zetten via GitHub en Vercel

Je hebt hier geen terminal voor nodig. Alles kan in de browser.

## 1. Database aanmaken bij Neon

1. Ga naar neon.com en maak een gratis account
2. Klik op New project, naam bijvoorbeeld `skool-planning`, regio Frankfurt of Amsterdam
3. Kopieer de connection string. Die begint met `postgresql://`
4. Zorg dat er `?sslmode=require` achter staat. Neon geeft die meestal al zo

Bewaar die string even, je hebt hem straks nodig.

## 2. Sleutel maken voor de sessies

Je hebt een lange geheime tekst nodig voor `AUTH_SECRET`. Minimaal 32 tekens.
Verzin er zelf een van bijvoorbeeld 50 willekeurige tekens, of gebruik een
wachtwoordgenerator. Deel hem met niemand.

## 3. Code naar GitHub

1. Pak de zip uit op je computer
2. Ga naar github.com en klik op New repository
3. Naam bijvoorbeeld `skool-planning`, zet hem op Private, klik Create
4. Klik op uploading an existing file
5. Sleep de inhoud van de map erin, dus `src`, `prisma`, `public`, `docs`,
   `package.json`, `package-lock.json` en de rest
6. Sleep niet de map `node_modules` of `.next` mee. Die zitten ook niet in de zip
7. Klik onderaan op Commit changes

GitHub kan maximaal 100 bestanden per keer. Doe het in twee rondes als het klaagt.
Upload dan eerst alles behalve `src`, en daarna `src` los.

## 4. Vercel

1. Ga naar vercel.com en log in met je GitHub account
2. Klik op Add New, dan Project
3. Kies je repository `skool-planning` en klik Import
4. Klap Environment Variables open en zet deze erin

| Naam | Waarde |
| --- | --- |
| `DATABASE_URL` | je connection string van Neon |
| `AUTH_SECRET` | je lange geheime tekst |
| `APP_URL` | laat leeg, vul je zo in |
| `NOTIFY_MODE` | `dev` |
| `SEED_TOKEN` | verzin een woord, bijvoorbeeld `skool-start-2026` |

5. Klik op Deploy en wacht een paar minuten

Tijdens het bouwen maakt Vercel automatisch alle tabellen in je database aan.

## 5. APP_URL invullen

Na de deploy krijg je een adres, bijvoorbeeld `https://skool-planning.vercel.app`.

1. Ga in Vercel naar Settings, dan Environment Variables
2. Zet `APP_URL` op dat adres
3. Ga naar Deployments en klik bij de bovenste op Redeploy

## 6. Demodata inladen

Open in je browser:

```
https://jouw-adres.vercel.app/api/seed?token=skool-start-2026
```

Gebruik het token dat je zelf hebt ingevuld. Je krijgt een melding terug met het aantal
docenten, klanten en opdrachten dat is aangemaakt.

Let op: dit gooit eerst alles weg wat er staat. Doe dit alleen aan het begin.

## 7. Inloggen

Ga naar `https://jouw-adres.vercel.app/login`

Wachtwoord `SkoolDemo2026!`

- `planner@example.com` voor de beheerkant
- `docent1@example.com` voor de docentkant op je telefoon

## 8. Meteen daarna doen

1. Ga in Vercel naar Environment Variables en maak `SEED_TOKEN` leeg
2. Klik op Redeploy
3. Log in als `superbeheerder@example.com`, ga naar Instellingen en maak je eigen account aan
4. Zet daarna de demo accounts op inactief

## Op je telefoon zetten

Open het adres in Safari of Chrome op je telefoon, kies Delen en dan
Zet op beginscherm. De docentkant werkt dan als een echte app.

## Later een wijziging doorvoeren

Upload het gewijzigde bestand opnieuw in GitHub. Vercel bouwt automatisch een
nieuwe versie. Je hoeft verder niets te doen.

## Als er iets misgaat

- Build faalt op `prisma db push`: je `DATABASE_URL` klopt niet of mist `?sslmode=require`
- Inloggen werkt niet: `AUTH_SECRET` is korter dan 32 tekens
- Links in e-mails kloppen niet: `APP_URL` staat nog leeg of verkeerd
- `/api/seed` geeft 403: `SEED_TOKEN` staat leeg of het token in de link klopt niet
