# Import van bestaande gegevens

Voor de eerste vulling kun je docenten en klanten importeren. Lever de bestanden aan als CSV
met puntkomma als scheidingsteken en UTF-8 als tekencodering.

## Docenten

Bestandsnaam `docenten.csv`

```
voornaam;tussenvoegsel;achternaam;email;telefoon;straat;huisnummer;postcode;plaats;samenwerking;kvk;btwnummer;iban;rekeninghouder;uurtarief;min_dagtarief;km_vergoeding;max_reisafstand;workshops
Milan;de;Wit;milan@example.com;06 12345678;Voorbeeldstraat;10;4811 AA;Breda;ZZP;60000001;NL001234567B01;NL91ABNA0417164300;M de Wit;34;95;0,23;60;DJ Workshop|Streetdance
```

- `samenwerking` is `ZZP`, `LOONDIENST` of `VRIJWILLIGER`
- `workshops` is een lijst gescheiden door een verticale streep, de namen moeten exact overeenkomen met de catalogus
- Bedragen met een komma
- Docenten komen binnen met status Uitgenodigd. Ze krijgen pas een uitnodiging als jij die verstuurt

## Klanten

Bestandsnaam `klanten.csv`

```
naam;type;factuuremail;factuuradres;betaaltermijn;locatienaam;straat;huisnummer;postcode;plaats;contactnaam;contactfunctie;contactemail;contacttelefoon
Basisschool De Regenboog;BASISSCHOOL;administratie@example.com;Postbus 100 Breda;30;Hoofdlocatie;Schoollaan;1;4811 ZZ;Breda;Karin Smits;Coördinator;karin@example.com;076 1234567
```

- `type` is een van BASISSCHOOL, VOORTGEZET_ONDERWIJS, MBO, HBO, UNIVERSITEIT, BSO, BIBLIOTHEEK, GEMEENTE, BEDRIJF, ZORGINSTELLING, JEUGDINSTELLING, PARTICULIER, OVERIG
- Klantnummers worden automatisch toegekend

## Workshops

Bestandsnaam `workshops.csv`

```
naam;categorie;korte_omschrijving;standaard_duur;max_groep;standaard_vergoeding;min_vergoeding;materialen;doelgroepen;vereiste_documenten
DJ Workshop;Muziek;Draaien op een echte DJ set;90;30;145;120;DJ set en speakers;Bovenbouw PO|VO;VOG
```

## Werkwijze

1. Lever de bestanden aan bij de beheerder
2. Controleer eerst een testbestand met vijf regels
3. Draai de import op een kopie van de database
4. Controleer een paar records handmatig
5. Draai daarna pas de volledige import

Een importscript hoort altijd idempotent te zijn. Match op e-mailadres bij docenten en op naam
plus plaats bij klanten, zodat je een import kunt herhalen zonder dubbele records.
