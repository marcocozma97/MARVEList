import { describe, expect, it } from 'vitest';
import { seasonNumber, seriesTitle, timeAgo } from './community';

describe('stagioni', () => {
  it('ricava il numero della stagione dal titolo', () => {
    expect(seasonNumber('Loki Season 2')).toBe(2);
    expect(seasonNumber("Your Friendly Neighborhood Spider-Man S.2")).toBe(2);
    expect(seasonNumber('WandaVision')).toBe(1);
  });

  it('toglie la stagione dal titolo della serie', () => {
    expect(seriesTitle('Agents of S.H.I.E.L.D. Season 4')).toBe('Agents of S.H.I.E.L.D.');
    expect(seriesTitle('Hawkeye')).toBe('Hawkeye');
  });
});

describe('data dei commenti', () => {
  const now = new Date('2026-11-08T12:00:00Z').getTime();

  it('mostra "adesso" per meno di un minuto', () => {
    expect(timeAgo('2026-11-08T11:59:30Z', now)).toBe('adesso');
  });

  it('usa minuti, ore e giorni', () => {
    expect(timeAgo('2026-11-08T11:55:00Z', now)).toBe('5 minuti fa');
    expect(timeAgo('2026-11-08T09:00:00Z', now)).toBe('3 ore fa');
    expect(timeAgo('2026-11-07T12:00:00Z', now)).toBe('ieri');
  });
});
