import type { MediaItem, MediaProgress } from '../services/mediaService';

// Percentuale di visione di un titolo (minuti per i film, episodi per le serie)
export const getProgressPercent = (media: MediaItem, progress?: MediaProgress | null): number => {
  if (!progress) return 0;
  if (progress.seen) return 100;
  if (media.type === 'FILM') {
    return media.runtime ? Math.min(100, Math.round((progress.minutesWatched / media.runtime) * 100)) : 0;
  }
  return media.episodes ? Math.min(100, Math.round((progress.watchedEpisodes.length / media.episodes) * 100)) : 0;
};

// Trama breve: le prime frasi intere che stanno nel limite, altrimenti taglio sulla parola
export const shortenOverview = (text: string, max = 200): string => {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = '';
  for (const sentence of sentences) {
    if ((out + sentence).length > max) break;
    out += sentence;
  }
  return out.trim() || `${clean.slice(0, max).replace(/\s+\S*$/, '')}…`;
};
