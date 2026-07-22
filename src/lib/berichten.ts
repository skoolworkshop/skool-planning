/**
 * Alle berichtteksten op één plek, zonder afhankelijkheden.
 * Zo kun je ze los testen en later vanuit de database overschrijven.
 */
export const TEMPLATES: Record<string, { onderwerp: string; tekst: string }> = {
  UITNODIGING_ACCOUNT: {
    onderwerp: "Welkom bij Skool Workshop",
    tekst:
      "Hi {{voornaam}}, je bent uitgenodigd voor het planningsysteem van Skool Workshop.\n\n" +
      "Activeer je account via deze link:\n{{link}}\n\nDe link is 14 dagen geldig.",
  },
  REGISTRATIE_ONTVANGEN: {
    onderwerp: "Welkom bij Skool Workshop",
    tekst:
      "Hi {{voornaam}}, je account is aangemaakt. Vul je profiel aan, kies je workshops en dien het in.\n{{link}}",
  },
  PROFIEL_AANVULLING: {
    onderwerp: "We hebben nog wat van je nodig",
    tekst: "Hi {{voornaam}}, we missen nog iets in je profiel. Bekijk de opmerking en vul het aan.\n{{link}}",
  },
  WACHTWOORD_RESET: {
    onderwerp: "Wachtwoord opnieuw instellen",
    tekst: "Hi {{voornaam}}, stel je wachtwoord opnieuw in via deze link:\n{{link}}\n\nDe link is 1 uur geldig.",
  },
  PROFIEL_GOEDGEKEURD: {
    onderwerp: "Je profiel is goedgekeurd",
    tekst: "Hi {{voornaam}}, je profiel is goedgekeurd. Je kunt nu opdrachten bekijken en aannemen.\n{{link}}",
  },
  NIEUWE_OPDRACHT: {
    onderwerp: "Nieuwe opdracht die bij je past",
    tekst:
      "Hi {{voornaam}}, er staat een nieuwe opdracht voor je klaar:\n\n" +
      "{{workshop}}\n{{datum}} van {{starttijd}} tot {{eindtijd}}\nPlaats: {{plaats}}\nVergoeding: {{vergoeding}}\n\n" +
      "Bekijk de opdracht en reageer voor {{reactiedeadline}}:\n{{link}}",
  },
  DIRECTE_UITNODIGING: {
    onderwerp: "Persoonlijke uitnodiging voor een opdracht",
    tekst:
      "Hi {{voornaam}}, we nodigen je persoonlijk uit voor:\n\n" +
      "{{workshop}}\n{{datum}} van {{starttijd}} tot {{eindtijd}}\nPlaats: {{plaats}}\nVergoeding: {{vergoeding}}\n\n" +
      "Laat voor {{reactiedeadline}} weten of je kunt:\n{{link}}",
  },
  AANMELDING_ONTVANGEN: {
    onderwerp: "We hebben je aanmelding ontvangen",
    tekst: "Hi {{voornaam}}, je aanmelding voor {{workshop}} op {{datum}} is ontvangen. Je hoort snel van ons.",
  },
  GESELECTEERD: {
    onderwerp: "Je bent ingepland",
    tekst:
      "Hi {{voornaam}}, goed nieuws. Je bent ingepland voor:\n\n" +
      "{{workshop}}\n{{datum}} van {{starttijd}} tot {{eindtijd}}\nPlaats: {{plaats}}\nVergoeding: {{vergoeding}}\n\n" +
      "Alle details staan hier:\n{{link}}",
  },
  AFGEWEZEN: {
    onderwerp: "Update over je aanmelding",
    tekst: "Hi {{voornaam}}, voor {{workshop}} op {{datum}} hebben we iemand anders ingepland. Bedankt voor je aanmelding.",
  },
  RESERVELIJST: {
    onderwerp: "Je staat op de reservelijst",
    tekst: "Hi {{voornaam}}, je staat op de reservelijst voor {{workshop}} op {{datum}}. We laten het weten als er iets vrijkomt.",
  },
  OPDRACHT_GEANNULEERD: {
    onderwerp: "Opdracht geannuleerd",
    tekst: "Hi {{voornaam}}, {{workshop}} op {{datum}} is helaas geannuleerd.",
  },
  OPDRACHT_GEWIJZIGD: {
    onderwerp: "Opdracht gewijzigd, graag opnieuw bevestigen",
    tekst: "Hi {{voornaam}}, er is iets gewijzigd aan {{workshop}} op {{datum}}. Bekijk en bevestig opnieuw:\n{{link}}",
  },
  HERINNERING_OPDRACHT: {
    onderwerp: "Herinnering: opdracht binnenkort",
    tekst: "Hi {{voornaam}}, denk je aan {{workshop}} op {{datum}} om {{starttijd}} in {{plaats}}?\n{{link}}",
  },
  WERKREGISTRATIE_VERZOEK: {
    onderwerp: "Rond je opdracht af",
    tekst: "Hi {{voornaam}}, wil je {{workshop}} van {{datum}} afronden en je uren en kilometers doorgeven?\n{{link}}",
  },
  DECLARATIE_GOEDGEKEURD: {
    onderwerp: "Je declaratie is goedgekeurd",
    tekst: "Hi {{voornaam}}, je declaratie voor {{workshop}} op {{datum}} is goedgekeurd. Totaal: {{bedrag}}.",
  },
  DOCUMENT_VERLOOPT: {
    onderwerp: "Een document verloopt binnenkort",
    tekst: "Hi {{voornaam}}, je {{document}} verloopt op {{datum}}. Upload een nieuwe versie in je profiel.\n{{link}}",
  },
};


export function vul(tekst: string, vars: Record<string, string | undefined>) {
  return tekst.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}
