/**
 * De echte workshopcatalogus van Skool Workshop, overgenomen van skoolworkshop.nl.
 * De siteSlug wordt gebruikt om automatisch de juiste foto van de site op te halen.
 *
 * Prijzen per workshop van 60 minuten. Starttarief en materiaalkosten staan los.
 */

export type CatalogusItem = {
  naam: string;
  categorie: "Beeldende kunst" | "Dans" | "Media" | "Muziek" | "Sport" | "Theater";
  duur: number;
  prijs: number;
  minLeeftijd: number;
  siteSlug: string;
  ruimte: string;
  materialen: string;
  klantBenodigdheden?: string;
};

export const STARTTARIEF = 45;
export const MATERIAAL_PER_DEELNEMER = 9.5;
export const EXTRA_DEELNEMER = 7.5;
export const KM_VERGOEDING = 0.42;
export const MAX_DEELNEMERS = 25;

export const CATEGORIE_KLEUR: Record<CatalogusItem["categorie"], string> = {
  "Beeldende kunst": "#2F9E6B",
  Dans: "#3B6DDB",
  Media: "#8A7C6E",
  Muziek: "#FF8A1E",
  Sport: "#E0A100",
  Theater: "#C2410C",
};

export const CATALOGUS: CatalogusItem[] = [
  // Beeldende kunst
  { naam: "Workshop Graffiti", categorie: "Beeldende kunst", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-graffiti", ruimte: "Buiten of goed geventileerde ruimte", materialen: "Spuitbussen, houten panelen 60x60, beschermende kleding, zeilen",
    klantBenodigdheden: "De opdrachtgever zorgt voor de vuilniszakken en afvalbakken en een buitenlocatie. Werkt het weer niet mee, dan hebben we een overkapping of een overdekte ruimte nodig. Zorg voor voldoende frisse lucht en ventilatie." },
  { naam: "Workshop Light Graffiti", categorie: "Beeldende kunst", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-light-graffiti", ruimte: "Volledig verduisterde ruimte", materialen: "Camera, statief, lampjes",
    klantBenodigdheden: "De opdrachtgever zorgt voor een donkere ruimte, zodat het effect van de lampjes goed tot zijn recht komt. Zonneschermen zijn niet voldoende. Het beste werkt een ruimte zonder ramen, met verduisterende gordijnen of afgeplakt met verduisteringsfolie." },
  { naam: "Workshop Stop Motion", categorie: "Beeldende kunst", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-stop-motion", ruimte: "Lokaal met tafels", materialen: "Tablets, statieven, decormateriaal" },
  { naam: "Workshop T-shirt Ontwerpen", categorie: "Beeldende kunst", duur: 60, prijs: 195, minLeeftijd: 4, siteSlug: "workshop-t-shirt-ontwerpen", ruimte: "Lokaal met tafels", materialen: "T-shirts, textielverf, sjablonen" },
  { naam: "Workshop 3D Printerpen", categorie: "Beeldende kunst", duur: 60, prijs: 195, minLeeftijd: 7, siteSlug: "workshop-3D-Printerpen", ruimte: "Lokaal met stroom", materialen: "3D pennen, filament, verlengsnoeren" },

  // Dans
  { naam: "Workshop Breakdance", categorie: "Dans", duur: 60, prijs: 195, minLeeftijd: 6, siteSlug: "workshop-breakdance", ruimte: "Gymzaal of aula met vlakke vloer", materialen: "Dansvloer, geluidsinstallatie",
    klantBenodigdheden: "De opdrachtgever zorgt voor een gymzaal of aula met een vlakke vloer. Deelnemers dragen makkelijk zittende kleding en schone binnenschoenen." },
  { naam: "Workshop Streetdance", categorie: "Dans", duur: 60, prijs: 195, minLeeftijd: 4, siteSlug: "workshop-streetdance", ruimte: "Ruimte met gladde vloer", materialen: "Geluidsinstallatie",
    klantBenodigdheden: "De opdrachtgever zorgt voor een ruime, open ruimte met een gladde vloer. Tafels en stoelen graag vooraf aan de kant, zodat er volop plek is om te bewegen." },
  { naam: "Workshop Hiphop", categorie: "Dans", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-hiphop", ruimte: "Ruimte met gladde vloer", materialen: "Geluidsinstallatie" },
  { naam: "Workshop Stepping", categorie: "Dans", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-stepping", ruimte: "Ruimte met harde vloer", materialen: "Geluidsinstallatie" },
  { naam: "Workshop Flashmob", categorie: "Dans", duur: 60, prijs: 195, minLeeftijd: 6, siteSlug: "workshop-flashmob", ruimte: "Aula of grote hal", materialen: "Geluidsinstallatie" },
  { naam: "Workshop Moderne Dans", categorie: "Dans", duur: 60, prijs: 195, minLeeftijd: 6, siteSlug: "workshop-moderne-dans", ruimte: "Ruimte met gladde vloer", materialen: "Geluidsinstallatie" },

  // Media
  { naam: "Workshop Vloggen", categorie: "Media", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-vloggen", ruimte: "Lokaal plus een rustige hoek", materialen: "Camera's, statieven, laptops" },
  { naam: "Workshop Podcast Maken", categorie: "Media", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-podcast-maken", ruimte: "Rustige ruimte", materialen: "Opnameset, microfoons, koptelefoons" },
  { naam: "Workshop Videoclip maken", categorie: "Media", duur: 90, prijs: 292.5, minLeeftijd: 8, siteSlug: "workshop-videoclip-maken", ruimte: "Grote ruimte plus stroom", materialen: "Camera's, licht, geluid, laptops" },
  { naam: "Workshop Korte Film Maken", categorie: "Media", duur: 90, prijs: 292.5, minLeeftijd: 8, siteSlug: "workshop-korte-film-maken", ruimte: "Meerdere ruimtes handig", materialen: "Camera's, statieven, montage laptops" },
  { naam: "Workshop Smartphone Fotografie", categorie: "Media", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-smartphone-fotografie", ruimte: "Binnen of buiten", materialen: "Statieven, clip-on lenzen" },

  // Muziek
  { naam: "Workshop Caribbean Drums", categorie: "Muziek", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-caribbean-drums", ruimte: "Ruimte op de begane grond", materialen: "Drums, stokken",
    klantBenodigdheden: "De opdrachtgever regelt een geschikte ruimte op de begane grond, waar de tafels aan de kant kunnen worden geschoven. Zet stoelen zonder armleuningen klaar in rijen van ongeveer vijf naast elkaar. Let op: het kan er lekker luid aan toe gaan, dat hoort bij de energie van de workshop." },
  { naam: "Workshop Ghetto Drums", categorie: "Muziek", duur: 60, prijs: 195, minLeeftijd: 4, siteSlug: "workshop-ghetto-drums", ruimte: "Grote ruimte op de begane grond", materialen: "Emmers, stokken",
    klantBenodigdheden: "De opdrachtgever regelt een grote ruimte op de begane grond, waar volop plek is voor beweging en interactie. Tafels aan de kant en graag stoelen zonder armleuningen in een kringopstelling. Let op: het kan er lekker luid aan toe gaan." },
  { naam: "Workshop Rap", categorie: "Muziek", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-rap", ruimte: "Rustige ruimte met stroom", materialen: "Microfoons, speaker, laptop",
    klantBenodigdheden: "De opdrachtgever zorgt voor een rustige ruimte met stroom, waar de groep in een kring kan zitten. Een tweede kleine ruimte om op te nemen is fijn maar niet verplicht." },
  { naam: "Workshop DJ Skills", categorie: "Muziek", duur: 90, prijs: 292.5, minLeeftijd: 8, siteSlug: "workshop-dj-skills", ruimte: "Ruimte met stroom", materialen: "DJ set, speakers, koptelefoons",
    klantBenodigdheden: "De opdrachtgever zorgt voor een ruimte met stroom en voldoende stopcontacten. Tafels aan de zijkant, zodat de DJ-set centraal kan staan." },
  { naam: "Workshop Live Looping", categorie: "Muziek", duur: 60, prijs: 195, minLeeftijd: 10, siteSlug: "workshop-live-looping", ruimte: "Rustige ruimte met stroom", materialen: "Loopstation, microfoons, speaker" },
  { naam: "Workshop Popstar", categorie: "Muziek", duur: 60, prijs: 195, minLeeftijd: 6, siteSlug: "workshop-popstar", ruimte: "Ruimte met stroom", materialen: "Microfoons, geluidsinstallatie" },

  // Sport
  { naam: "Workshop Kickboksen", categorie: "Sport", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-kickboksen", ruimte: "Gymzaal of aula", materialen: "Stootkussens, handschoenen",
    klantBenodigdheden: "De opdrachtgever zorgt voor een gymzaal, aula of andere ruime locatie, zodat er volop bewogen kan worden. Deelnemers dragen makkelijk zittende kleding en schoenen waarin ze vrij kunnen bewegen." },
  { naam: "Workshop Pannavoetbal", categorie: "Sport", duur: 60, prijs: 195, minLeeftijd: 6, siteSlug: "workshop-pannavoetbal", ruimte: "Gymzaal, plein of veld", materialen: "Pannakooi, ballen, hesjes" },
  { naam: "Workshop Freerunning", categorie: "Sport", duur: 60, prijs: 195, minLeeftijd: 10, siteSlug: "workshop-freerunning", ruimte: "Gymzaal met toestellen", materialen: "Matten, obstakels" },
  { naam: "Workshop Bootcamp", categorie: "Sport", duur: 60, prijs: 195, minLeeftijd: 12, siteSlug: "workshop-bootcamp", ruimte: "Buiten of gymzaal", materialen: "Sportmateriaal, pionnen" },
  { naam: "Workshop Zelfverdediging", categorie: "Sport", duur: 60, prijs: 195, minLeeftijd: 10, siteSlug: "workshop-zelfverdediging", ruimte: "Gymzaal met matten", materialen: "Matten, stootkussens" },

  // Theater
  { naam: "Workshop Theatersport", categorie: "Theater", duur: 60, prijs: 195, minLeeftijd: 12, siteSlug: "workshop-theatersport", ruimte: "Ruime open ruimte met stoelen", materialen: "Geluidsinstallatie",
    klantBenodigdheden: "De opdrachtgever zorgt voor een ruime, open ruimte met stoelen. De tafels worden vooraf aan de kant gezet, of nog beter, buiten de ruimte geplaatst, zodat er volop ruimte is voor een energieke en dynamische ervaring." },
  { naam: "Workshop Soap Acteren", categorie: "Theater", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-soap-acteren", ruimte: "Lokaal of aula", materialen: "Camera, statief" },
  { naam: "Workshop Stage Fighting", categorie: "Theater", duur: 60, prijs: 195, minLeeftijd: 8, siteSlug: "workshop-stage-fighting", ruimte: "Gymzaal of aula met matten", materialen: "Matten" },
];

/** Berekent de prijs van een workshopronde op basis van duur. */
export function rondePrijs(duurMinuten: number, basisPrijs60 = 195): number {
  return Math.round((basisPrijs60 / 60) * duurMinuten * 100) / 100;
}

/** De volledige dagprijs voor een aantal rondes, inclusief starttarief. */
export function dagPrijs(rondes: number, duurMinuten: number, basisPrijs60 = 195): number {
  return Math.round((STARTTARIEF + rondes * rondePrijs(duurMinuten, basisPrijs60)) * 100) / 100;
}
