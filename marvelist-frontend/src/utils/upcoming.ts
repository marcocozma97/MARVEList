import type { MediaItem } from '../services/mediaService';

export const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// Titolo "in arrivo": segnato inArrivo = true nel catalogo, finché non arriva la data di uscita di TMDB
export const isUpcoming = (media: Pick<MediaItem, 'upcoming'> & Partial<Pick<MediaItem, 'releaseDate'>>, today = todayIso()) =>
  media.upcoming === true && !(media.releaseDate && media.releaseDate <= today);

type EpisodeMedia = Pick<MediaItem, 'upcoming' | 'episodes'> & Partial<Pick<MediaItem, 'releaseDate' | 'episodeAirDates'>>;

const airDates = (media: EpisodeMedia) =>
  media.episodeAirDates ? media.episodeAirDates.split(',').map(d => d.trim() || null) : [];

export const episodeAirDate = (media: EpisodeMedia, episode: number) => airDates(media)[episode - 1] ?? null;

export const isEpisodeOut = (media: EpisodeMedia, episode: number, today = todayIso()) => {
  if (isUpcoming(media, today)) return false;
  const dates = airDates(media);
  if (dates.length === 0) return true;
  const date = dates[episode - 1] ?? null;
  if (date) return date <= today;
  return !dates.some(d => d !== null && d > today);
};

export const isFullyOut = (media: EpisodeMedia, today = todayIso()) => {
  if (isUpcoming(media, today)) return false;
  if (!media.episodes) return true;
  return Array.from({ length: media.episodes }, (_, i) => i + 1).every(ep => isEpisodeOut(media, ep, today));
};

export const formatDay = (iso: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', options);
};

// Giorno da cui si potrà vedere (yyyy-mm-dd): la data TMDB se c'è, altrimenti il 31/12 dell'anno
export const availableFrom = (media: Pick<MediaItem, 'upcoming' | 'releaseDate' | 'releaseYear'>) =>
  !isUpcoming(media) ? null : media.releaseDate ?? `${media.releaseYear}-12-31`;

// Etichetta della data di uscita: giorno preciso se noto, altrimenti solo l'anno
export const releaseLabel = (media: Pick<MediaItem, 'releaseDate' | 'releaseYear'>) => {
  if (!media.releaseDate) return String(media.releaseYear);
  const [y, m, d] = media.releaseDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
};
