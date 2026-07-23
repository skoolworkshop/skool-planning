/**
 * Hulpjes voor het werken met een maand in de schermen.
 * De sleutel is altijd jjjj-mm, zodat hij netjes in de URL past.
 */

const MAANDEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export type Maand = {
  sleutel: string;
  label: string;
  start: Date;
  eind: Date;
  vorige: string;
  volgende: string;
  isHuidige: boolean;
};

export function maandSleutel(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Leest een sleutel uit de URL. Klopt hij niet, dan pakken we de huidige maand. */
export function leesMaand(sleutel?: string | null): Maand {
  const nu = new Date();
  let jaar = nu.getFullYear();
  let maand = nu.getMonth();

  const m = sleutel ? /^(\d{4})-(\d{2})$/.exec(sleutel) : null;
  if (m) {
    const j = Number(m[1]);
    const mm = Number(m[2]) - 1;
    if (j >= 2000 && j <= 2100 && mm >= 0 && mm <= 11) {
      jaar = j;
      maand = mm;
    }
  }

  const start = new Date(jaar, maand, 1, 0, 0, 0, 0);
  const eind = new Date(jaar, maand + 1, 0, 23, 59, 59, 999);

  return {
    sleutel: maandSleutel(start),
    label: `${MAANDEN[maand]} ${jaar}`,
    start,
    eind,
    vorige: maandSleutel(new Date(jaar, maand - 1, 1)),
    volgende: maandSleutel(new Date(jaar, maand + 1, 1)),
    isHuidige: jaar === nu.getFullYear() && maand === nu.getMonth(),
  };
}

/** Lijst met maanden om uit te kiezen, standaard een jaar terug en een jaar vooruit. */
export function maandOpties(rondom: Date = new Date(), terug = 12, vooruit = 12) {
  const uit: { waarde: string; label: string }[] = [];
  for (let i = -terug; i <= vooruit; i++) {
    const d = new Date(rondom.getFullYear(), rondom.getMonth() + i, 1);
    uit.push({ waarde: maandSleutel(d), label: `${MAANDEN[d.getMonth()]} ${d.getFullYear()}` });
  }
  return uit;
}
