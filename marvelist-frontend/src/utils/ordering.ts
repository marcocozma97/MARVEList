import type { MediaItem } from '../services/mediaService';

export type VisionOrder = 'MCU' | 'FAN' | 'GOD';

export const VISION_ORDER_LABELS: Record<VisionOrder, string> = { MCU: 'MCU', FAN: 'Marvel Fan', GOD: 'Marvel GOD' };

// Livello di visione: MCU = solo MCU, Marvel Fan = MCU + Fan, Marvel GOD = tutto
export const matchesVisionOrder = (media: MediaItem, level: VisionOrder) =>
  level === 'GOD' || (level === 'FAN' ? ['MCU', 'FAN'].includes(media.visionOrder) : media.visionOrder === 'MCU');

// Classici / Origini (-1), Fase 0, Fase 1, Fase 2... e in fondo tutto il resto
export const phaseRank = (phase: string) => {
  if (phase.startsWith('Classici')) return -1;
  const match = phase.match(/^Fase (\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

// Ordine di visione esplicito: fase, poi posizione nel marvel_data.json, poi anno e ID come riserva
export const sortByViewingOrder = (list: MediaItem[]) =>
  [...list].sort((a, b) =>
    phaseRank(a.phase || '') - phaseRank(b.phase || '') ||
    (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity) ||
    a.releaseYear - b.releaseYear ||
    a.id - b.id
  );

// Raggruppa per fase mantenendo l'ordine (le fasi escono già ordinate)
export const groupByPhase = (list: MediaItem[]) => {
  const groups = new Map<string, MediaItem[]>();
  sortByViewingOrder(list).forEach(media => {
    const phase = media.phase || 'Sconosciuta';
    if (!groups.has(phase)) groups.set(phase, []);
    groups.get(phase)!.push(media);
  });
  return groups;
};
