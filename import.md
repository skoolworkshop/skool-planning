# Privacy en beveiliging

## Wat wordt opgeslagen

Van docenten: naam, e-mailadres, telefoonnummer, geboortedatum, adres, bankgegevens, KVK en btw,
tarieven, beschikbaarheid, workshops, documenten en de opdrachten die ze hebben gedaan.

Van klanten: organisatienaam, locaties, contactpersonen en hun zakelijke contactgegevens.

Van gebruik: een auditlog van wie wat wanneer heeft gewijzigd, en een berichtenlog van verstuurde
meldingen.

## Wie ziet wat

| Gegeven | Superbeheerder | Planner | Financieel | Lezer | Docent |
| --- | --- | --- | --- | --- | --- |
| Contactgegevens docent | ja | ja | ja | ja | eigen |
| IBAN en rekeninghouder | ja | nee | ja | nee | eigen |
| Identiteitsbewijs en VOG bestand | ja | status | ja | status | eigen |
| Interne notitie over docent | ja | ja | nee | nee | nee |
| Adres en contactpersoon klant | ja | ja | ja | ja | pas na toewijzing |
| Tarieven en marge project | ja | ja | ja | ja | nee |

## Maatregelen

- Wachtwoorden met bcrypt, kostenfactor 12
- Sessie in een httpOnly cookie, secure en sameSite lax
- Sessie ongeldig maken op alle apparaten via een teller op het account
- Blokkade na acht mislukte inlogpogingen
- Snelheidslimiet op inloggen, wachtwoord vergeten en registreren
- Elke schrijfactie controleert opnieuw de rol van de gebruiker aan de serverkant
- Auditlog op alle gevoelige acties, inclusief het wijzigen van bedragen
- Documenten worden alleen als verwijzing opgeslagen, niet als inhoud in de database

## Bewaartermijnen

Advies: docentdossiers bewaren zolang de samenwerking loopt en daarna twee jaar.
Financiële gegevens zeven jaar, dat is de fiscale bewaarplicht. Auditlog één jaar.
Zet dit vast in je eigen verwerkingsregister.

## Rechten van betrokkenen

Een docent kan zijn eigen gegevens inzien en aanpassen in zijn profiel. Voor verwijdering geldt
dat afgeronde opdrachten en declaraties bewaard moeten blijven voor de administratie. Anonimiseer
in dat geval de persoonsgegevens in plaats van het record te verwijderen.
