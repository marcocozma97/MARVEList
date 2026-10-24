import type { MediaItem } from '../services/mediaService';

// Titolo "in arrivo": segnato inArrivo = true nel marvel_data.json del backend
export const isUpcoming = (media: Pick<MediaItem, 'upcoming'>) => media.upcoming === true;

// Giorno da cui si potrà vedere (yyyy-mm-dd): la data TMDB se c'è, altrimenti il 31/12 dell'anno
export const availableFrom = (media: Pick<MediaItem, 'upcoming' | 'releaseDate' | 'releaseYear'>) =>
  !isUpcoming(media) ? null : media.releaseDate ?? `${media.releaseYear}-12-31`;

// Etichetta della data di uscita: giorno preciso se noto, altrimenti solo l'anno
export const releaseLabel = (media: Pick<MediaItem, 'releaseDate' | 'releaseYear'>) => {
  if (!media.releaseDate) return String(media.releaseYear);
  const [y, m, d] = media.releaseDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
};
