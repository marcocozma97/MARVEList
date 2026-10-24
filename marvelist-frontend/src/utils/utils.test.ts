import { describe, expect, it } from 'vitest';
import type { MediaItem } from '../services/mediaService';
import { formatWatchTime } from './watchTime';
import { isValidEmail, isValidPassword } from './validation';
import { groupByPhase, matchesVisionOrder, phaseRank } from './ordering';
import { computeRank } from './rank';
import { getProgressPercent, shortenOverview } from './progress';
import { availableFrom } from './upcoming';

let nextId = 1;
const media = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: nextId++,
  tmdbId: 0,
  title: 'Titolo',
  type: 'FILM',
  phase: 'Fase 1',
  visionOrder: 'MCU',
  posterPath: '',
  releaseYear: 2010,
  sortOrder: null,
  episodes: null,
  runtime: 120,
  upcoming: false,
  releaseDate: null,
  doomsday: null,
  tags: null,
  ...overrides,
});

describe('formatWatchTime', () => {
  it('mostra ore e minuti sotto le 24 ore', () => {
    expect(formatWatchTime(125)).toBe('2 h 5 min');
  });
  it('esattamente 24 ore restano ore', () => {
    expect(formatWatchTime(24 * 60)).toBe('24 h');
  });
  it('oltre le 24 ore passa ai giorni', () => {
    expect(formatWatchTime(25 * 60)).toBe('1 giorno 1 h');
  });
  it('zero minuti', () => {
    expect(formatWatchTime(0)).toBe('0 min');
  });
});

describe('validazione registrazione', () => {
  it('email con dominio ed estensione', () => {
    expect(isValidEmail('tony@stark.it')).toBe(true);
    expect(isValidEmail('tony@stark')).toBe(false);
  });
  it('password di almeno 6 caratteri con un carattere speciale', () => {
    expect(isValidPassword('jarvis!')).toBe(true);
    expect(isValidPassword('jarvis1')).toBe(false);
    expect(isValidPassword('j!')).toBe(false);
  });
});

describe('ordine di visione', () => {
  it('Marvel Fan include MCU ma non GOD', () => {
    expect(matchesVisionOrder(media({ visionOrder: 'MCU' }), 'FAN')).toBe(true);
    expect(matchesVisionOrder(media({ visionOrder: 'GOD' }), 'FAN')).toBe(false);
    expect(matchesVisionOrder(media({ visionOrder: 'GOD' }), 'GOD')).toBe(true);
  });
  it('i Classici vengono prima della Fase 0 e le fasi sconosciute in fondo', () => {
    expect(phaseRank('Classici / Origini')).toBeLessThan(phaseRank('Fase 0'));
    expect(phaseRank('Fase 10')).toBeGreaterThan(phaseRank('Fase 2'));
    expect(phaseRank('Altro')).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('raggruppa per fase rispettando sortOrder', () => {
    const groups = groupByPhase([
      media({ title: 'B', phase: 'Fase 2', sortOrder: 2 }),
      media({ title: 'A', phase: 'Fase 2', sortOrder: 1 }),
      media({ title: 'C', phase: 'Fase 1', sortOrder: 9 }),
    ]);
    expect([...groups.keys()]).toEqual(['Fase 1', 'Fase 2']);
    expect(groups.get('Fase 2')!.map(m => m.title)).toEqual(['A', 'B']);
  });
});

describe('grado del profilo', () => {
  it('senza titoli visti si parte da Recluta', () => {
    expect(computeRank([media()], []).title).toBe('Recluta S.H.I.E.L.D.');
  });
  it("tutto l'MCU visto rende Eroe", () => {
    const list = [media(), media()];
    expect(computeRank(list, list.map(m => m.id)).title).toBe('Eroe');
  });
  it('i titoli in arrivo non contano', () => {
    const released = media();
    const list = [released, media({ upcoming: true })];
    expect(computeRank(list, [released.id]).title).toBe('Eroe');
  });

  const mcu1 = media(), mcu2 = media();
  const fan1 = media({ visionOrder: 'FAN' }), fan2 = media({ visionOrder: 'FAN' });
  const god1 = media({ visionOrder: 'GOD' }), god2 = media({ visionOrder: 'GOD' });
  const all = [mcu1, mcu2, fan1, fan2, god1, god2];

  it('un titolo Marvel Fan senza MCU completo non rende Avenger', () => {
    // Metà MCU vista: il titolo Fan non conta finché l'MCU non è completo
    expect(computeRank(all, [mcu1.id, fan1.id]).title).toBe('Generale S.H.I.E.L.D.');
  });
  it('MCU completo e un titolo solo Marvel Fan rendono Avenger', () => {
    const moreFan = [1, 2, 3].map(() => media({ visionOrder: 'FAN' })); // 1 Fan visto su 5 = 20%
    expect(computeRank([...all, ...moreFan], [mcu1.id, mcu2.id, fan1.id]).title).toBe('Avenger');
  });
  it('un titolo Marvel GOD senza Marvel Fan completo non rende Solar Avenger', () => {
    expect(computeRank(all, [mcu1.id, mcu2.id, fan1.id, god1.id]).title).toBe('Avenger OG');
  });
  it('Marvel Fan completo e un titolo solo Marvel GOD rendono Solar Avenger', () => {
    const moreGod = [1, 2, 3].map(() => media({ visionOrder: 'GOD' })); // 1 GOD visto su 5 = 20%
    expect(computeRank([...all, ...moreGod], [mcu1.id, mcu2.id, fan1.id, fan2.id, god1.id]).title).toBe('Solar Avenger');
  });
  it('Marvel Fan completo senza titoli GOD resta Planet Avenger', () => {
    expect(computeRank(all, [mcu1.id, mcu2.id, fan1.id, fan2.id]).title).toBe('Planet Avenger');
  });
});

describe('avanzamento e trama', () => {
  it('percentuale di un film dai minuti visti', () => {
    const film = media({ runtime: 200 });
    expect(getProgressPercent(film, { mediaId: film.id, seen: false, favorite: false, inWatchlist: false, watchLater: false, rating: null, minutesWatched: 50, watchedEpisodes: [] })).toBe(25);
  });
  it('percentuale di una serie dagli episodi visti', () => {
    const serie = media({ type: 'SERIE_TV', episodes: 4, runtime: null });
    expect(getProgressPercent(serie, { mediaId: serie.id, seen: false, favorite: false, inWatchlist: false, watchLater: false, rating: null, minutesWatched: 0, watchedEpisodes: [1, 2, 3] })).toBe(75);
  });
  it('la trama breve si ferma a fine frase', () => {
    expect(shortenOverview('Prima frase. Seconda frase molto lunga.', 20)).toBe('Prima frase.');
  });
});

describe('titoli in arrivo', () => {
  it('senza data TMDB si assume il 31 dicembre', () => {
    expect(availableFrom(media({ upcoming: true, releaseYear: 2028 }))).toBe('2028-12-31');
    expect(availableFrom(media({ upcoming: false }))).toBeNull();
  });
});
