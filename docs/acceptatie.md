# Acceptatietests

Loop deze lijst door na installatie of na een grote wijziging. Log steeds in met het
genoemde account. Wachtwoord staat in de README.

## Inloggen en accounts

1. Inloggen met een geldig account leidt naar `/beheer` of `/docent`, afhankelijk van de rol.
2. Inloggen met een fout wachtwoord geeft dezelfde melding als een onbekend e-mailadres.
3. Na acht foute pogingen is het account een kwartier geblokkeerd.
4. Wachtwoord vergeten geeft altijd dezelfde bevestiging, ook bij een onbekend adres.
5. Een uitnodigingslink laat een nieuw wachtwoord instellen. De docent staat daarna op Registratie gestart.
6. Uitloggen overal maakt bestaande sessies op andere apparaten ongeldig.

## Registratie en profiel

7. Via `/registreren` kan iemand zelf een account aanmaken. Status wordt Registratie gestart.
8. Registreren met een bestaand e-mailadres geeft een nette melding.
9. Een docent kan zijn profiel opslaan en de gegevens staan er na verversen nog steeds.
10. Profiel indienen lukt niet zonder telefoonnummer, woonplaats, IBAN en minimaal één workshop.
11. Na indienen staat de docent op Ter beoordeling en ziet de planner hem in de wachtrij.
12. De planner keurt goed. De docent krijgt een melding en de status wordt Goedgekeurd.
13. De docent koppelt en ontkoppelt een workshop. De lijst met open opdrachten verandert mee.

## Klanten en projecten

14. Een planner maakt een klant aan met locatie en contactpersoon.
15. De projectwizard maakt een project met ordernummer in de vorm SW2026-0001.
16. Bij meerdere rondes worden de rondes automatisch aangemaakt.
17. Het project toont omzet, docentkosten en marge.

## Opdrachten en toewijzing

18. Een niet gepubliceerde positie is niet zichtbaar voor docenten.
19. Publiceren zet de status op Docenten gezocht en verstuurt een melding naar passende docenten.
20. Een docent zonder de juiste workshop in zijn profiel ziet de opdracht niet.
21. Een docent met een verlopen verplicht document kan zich niet aanmelden.
22. Aanmelden lukt één keer. Een tweede poging geeft een melding.
23. Aanmelden lukt niet als de docent op dat tijdstip al een opdracht heeft.
24. De matchinglijst toont score, afstand, reistijd en waarschuwingen. Niemand wordt automatisch uitgesloten.
25. Toewijzen bij een dubbele boeking vraagt om een reden voordat het doorgaat.
26. Als de laatste plek is gevuld sluit de positie en worden de overige aanmeldingen afgewezen.
27. Een directe uitnodiging kan de docent accepteren of weigeren. Na de deadline is hij verlopen.
28. Adres en telefoonnummer van de contactpersoon zijn pas zichtbaar na toewijzing.
29. Annuleren van een opdracht stuurt één melding naar de toegewezen docenten.
30. Een docent op uitgevallen zetten maakt de plek weer vrij en heropent de positie.

## Kalender en beschikbaarheid

31. De weekkalender in beheer toont alle opdrachten met kleur per status.
32. De docentkalender toont zijn eigen opdrachten.
33. Een dag markeren als niet beschikbaar blijft na verversen bewaard.
34. Vaste weekdagen zijn in te stellen in het profiel.

## Werkregistratie en financiën

35. Na afloop kan de docent uren, kilometers en onkosten indienen.
36. Het totaal is het hoogste van workshopvergoeding, uurtarief maal uren en het minimum, plus onkosten.
37. Een eindtijd voor de starttijd wordt geweigerd.
38. Financieel ziet de declaratie en kan goedkeuren, afkeuren of om aanvulling vragen.
39. Een bedrag wijzigen kan alleen met een reden. De reden staat in het auditlog.
40. Bij goedkeuren krijgt de docent een melding.
41. De betaal-export bevat alleen declaraties die klaar staan voor betaling.

## Rechten

42. Een docent die `/beheer` opent wordt teruggestuurd naar zijn eigen omgeving.
43. Een gebruiker met Alleen lezen ziet geen knoppen die iets wijzigen.
44. Een planner ziet geen IBAN of identiteitsdocument.
45. Een docent kan de ICS van een opdracht van iemand anders niet downloaden.
46. Zonder sessie leidt elke pagina naar de inlogpagina.

## Meldingen

47. In dev modus staat elk bericht in de berichtenlog onder Instellingen en gaat er niets echt uit.
48. Eenzelfde melding gaat nooit twee keer, ook niet als je de actie herhaalt.
49. De docent ziet ongelezen meldingen met een teller in de balk onderin.
50. Alles gelezen zet de teller op nul.

## Module B, inschrijving

51. Een planner zet een inschrijving op een bestaand project. Twee inschrijvingen op hetzelfde project kan niet.
52. Rondes toevoegen lukt. Een ronde met workshops erin kan niet zomaar weg.
53. Dezelfde workshop twee keer in dezelfde ronde in dezelfde ruimte wordt geweigerd.
54. Een CSV met leerlingen importeert. Dubbele namen in dezelfde klas worden overgeslagen.
55. Codes genereren zonder leerlingen geeft een nette melding.
56. Openzetten lukt niet zonder rondes, zonder workshops of zonder codes.
57. Een leerling vult de klascode in en ziet de namenlijst van de eigen klas.
58. Staat de naam er niet bij, dan kan de leerling zichzelf toevoegen.
59. Een volle workshop is zichtbaar maar niet aanklikbaar.
60. Twee leerlingen die tegelijk de laatste plek pakken: één krijgt hem, de ander een melding.
61. Een leerling kan niet twee workshops in dezelfde ronde krijgen.
62. Dezelfde workshop in twee rondes wordt geweigerd, tenzij herhaling aanstaat.
63. Na de laatste ronde ziet de leerling meteen het eigen rooster.
64. Wijzigen kan tot de sluitingsdatum, mits dat aanstaat.
65. Na de sluitingsdatum werkt de code niet meer voor inschrijven.
66. De schoolcode opent het portaal, niet het keuzescherm.
67. Het schoolportaal toont de juiste voortgang en de lijst met leerlingen die nog niets kozen.
68. Rest automatisch indelen plaatst iedereen zonder keuze in een vrije plek.
69. Alle zes de lijsten openen en zijn printbaar. De presentielijst heeft afvinkvakjes.
70. De CSV van elke lijst opent netjes in Excel, met puntkomma als scheidingsteken.
