import type { MediaItem } from '../services/mediaService';

// Grado del profilo in base a quanto si è visto (solo titoli già usciti contano)
export type RankTone =
  | 'grey' | 'red' | 'red-bright'
  | 'yellow' | 'yellow-bright'
  | 'sky-1' | 'sky-2' | 'sky-3' | 'sky-4'
  | 'infinity';

export interface Rank {
  title: string;
  tone: RankTone;
  next: { title: string; missing: number; progress: number } | null; // verso il grado successivo
  stats: { mcu: Pool; fan: Pool; god: Pool };
}

interface Pool { seen: number; total: number }

// Tutti i gradi in ordine, con il requisito per ottenerli (per la legenda del badge)
export const RANK_LADDER: { title: string; tone: RankTone; requirement: string }[] = [
  { title: 'Recluta S.H.I.E.L.D.', tone: 'grey', requirement: 'Il punto di partenza' },
  { title: 'Soldato S.H.I.E.L.D.', tone: 'red', requirement: 'Primo film o serie MCU completato' },
  { title: 'Generale S.H.I.E.L.D.', tone: 'red', requirement: "50% dell'MCU" },
  { title: 'Eroe', tone: 'red-bright', requirement: "100% dell'MCU" },
  { title: 'Avenger', tone: 'yellow', requirement: "MCU completato, poi un titolo presente solo in Marvel Fan" },
  { title: 'Avenger OG', tone: 'yellow', requirement: '50% di Marvel Fan' },
  { title: 'Planet Avenger', tone: 'yellow-bright', requirement: '100% di Marvel Fan' },
  { title: 'Solar Avenger', tone: 'sky-1', requirement: 'Marvel Fan completato (MCU compreso), poi un titolo presente solo in Marvel GOD' },
  { title: 'Universe Avenger', tone: 'sky-2', requirement: '25% di Marvel GOD' },
  { title: 'Galaxy Avenger', tone: 'sky-3', requirement: '50% di Marvel GOD' },
  { title: 'Multiverse Avenger', tone: 'sky-4', requirement: '75% di Marvel GOD' },
  { title: 'GOD OF MARVEL', tone: 'infinity', requirement: 'Tutto il mondo Marvel completato' },
];

// Un titolo conta solo se è già uscito: quelli "inArrivo" nel JSON sono ignorati finché il JSON non cambia
export const isReleased = (media: MediaItem) => !media.upcoming;

const pct = (p: Pool) => (p.total === 0 ? 1 : p.seen / p.total);
const done = (p: Pool) => p.seen >= p.total;
const toReach = (p: Pool, ratio: number) => Math.max(0, Math.ceil(p.total * ratio) - p.seen);
const step = (title: string, missing: number, progress: number) => ({ title, missing, progress: Math.max(0, Math.min(1, progress)) });

export const computeRank = (allMedia: MediaItem[], seenIds: Iterable<number>): Rank => {
  const seen = new Set(seenIds);
  const pool = (order: MediaItem['visionOrder']): Pool => {
    const list = allMedia.filter(m => m.visionOrder === order && isReleased(m));
    return { seen: list.filter(m => seen.has(m.id)).length, total: list.length };
  };
  const mcu = pool('MCU'), fan = pool('FAN'), god = pool('GOD');
  const stats = { mcu, fan, god };

  // MARVEL GOD: serve aver completato tutto MARVEL FAN (MCU compreso) e poi visto un titolo solo GOD.
  // Se però esce un nuovo titolo MCU/FAN
  // e MARVEL GOD era già tutto visto, si scende solo di un grado (Multiverse Avenger).
  if (god.seen > 0 && ((done(mcu) && done(fan)) || done(god))) {
    if (done(mcu) && done(fan) && done(god)) return { title: 'GOD OF MARVEL', tone: 'infinity', next: null, stats };
    const g = pct(god);
    const missingAll = (mcu.total - mcu.seen) + (fan.total - fan.seen) + (god.total - god.seen);
    if (g >= 0.75) return { title: 'Multiverse Avenger', tone: 'sky-4', next: step('GOD OF MARVEL', missingAll, g), stats };
    if (g >= 0.5) return { title: 'Galaxy Avenger', tone: 'sky-3', next: step('Multiverse Avenger', toReach(god, 0.75), (g - 0.5) / 0.25), stats };
    if (g >= 0.25) return { title: 'Universe Avenger', tone: 'sky-2', next: step('Galaxy Avenger', toReach(god, 0.5), (g - 0.25) / 0.25), stats };
    return { title: 'Solar Avenger', tone: 'sky-1', next: step('Universe Avenger', toReach(god, 0.25), g / 0.25), stats };
  }

  // MARVEL FAN: serve aver completato l'MCU e poi visto un titolo solo Fan.
  // Finché l'MCU non è completo i titoli Fan visti restano da parte e il grado segue l'MCU.
  if (done(mcu) && fan.seen > 0) {
    const f = pct(fan);
    if (done(fan)) return { title: 'Planet Avenger', tone: 'yellow-bright', next: step('Solar Avenger', 1, 0), stats };
    if (f >= 0.5) return { title: 'Avenger OG', tone: 'yellow', next: step('Planet Avenger', fan.total - fan.seen, (f - 0.5) / 0.5), stats };
    return { title: 'Avenger', tone: 'yellow', next: step('Avenger OG', toReach(fan, 0.5), f / 0.5), stats };
  }

  // MCU
  if (mcu.seen > 0) {
    const m = pct(mcu);
    if (done(mcu)) return { title: 'Eroe', tone: 'red-bright', next: step('Avenger', 1, 0), stats };
    if (m >= 0.5) return { title: 'Generale S.H.I.E.L.D.', tone: 'red', next: step('Eroe', mcu.total - mcu.seen, (m - 0.5) / 0.5), stats };
    return { title: 'Soldato S.H.I.E.L.D.', tone: 'red', next: step('Generale S.H.I.E.L.D.', toReach(mcu, 0.5), m / 0.5), stats };
  }

  return { title: 'Recluta S.H.I.E.L.D.', tone: 'grey', next: step('Soldato S.H.I.E.L.D.', 1, 0), stats };
};
