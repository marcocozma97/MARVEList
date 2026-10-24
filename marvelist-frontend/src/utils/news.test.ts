import { describe, expect, it } from 'vitest';
import type { MediaItem } from '../services/mediaService';
import { findMentionedMedia, timeAgo } from './news';

let nextId = 1;
const media = (title: string, releaseYear = 2020): MediaItem => ({
  id: nextId++, tmdbId: 0, title, type: 'SERIE_TV', phase: 'Fase 6', visionOrder: 'MCU', posterPath: '',
  releaseYear, sortOrder: null, episodes: null, runtime: null, upcoming: false, releaseDate: null, doomsday: null, tags: null,
});

describe('titolo del catalogo citato nella notizia', () => {
  const catalog = [
    media('Avengers: Endgame', 2019),
    media('Avengers: Doomsday', 2026),
    media('Marvel Zombies Season 1', 2025),
    media('X-Men', 2000),
    media('X-Men', 2028),
    media('Loki Season 2', 2023),
  ];

  it('vince il nome più lungo', () => {
    expect(findMentionedMedia('Avengers: Doomsday, svelato un poster su Fatalis', catalog)?.title).toBe('Avengers: Doomsday');
  });
  it('ignora la stagione nel titolo del catalogo', () => {
    expect(findMentionedMedia('Marvel Zombies: i Vendicatori contro i non morti', catalog)?.title).toBe('Marvel Zombies Season 1');
  });
  it('a parità di nome sceglie l\'uscita più recente', () => {
    expect(findMentionedMedia('X-Men, iniziano le riprese del reboot', catalog)?.releaseYear).toBe(2028);
  });
  it('confronta parole intere, non pezzi di parola', () => {
    expect(findMentionedMedia('Un blocco di lokis giganti', catalog)).toBeNull();
  });
  it('nessun titolo citato', () => {
    expect(findMentionedMedia('Lucca Comics 2026: tutti gli ospiti', catalog)).toBeNull();
  });
});

describe('tempo trascorso', () => {
  const now = new Date('2026-10-23T12:00:00Z').getTime();
  it('ore e giorni', () => {
    expect(timeAgo('2026-10-23T09:00:00Z', now)).toBe('3 ore fa');
    expect(timeAgo('2026-10-20T12:00:00Z', now)).toBe('3 giorni fa');
  });
  it('una notizia appena uscita non risulta nel futuro', () => {
    expect(timeAgo('2026-10-23T12:00:30Z', now)).toBe('1 minuto fa');
  });
});
