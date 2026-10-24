import type { MediaItem } from '../services/mediaService';

const normalize = (text: string) =>
  ` ${text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `;

// "Loki Season 2" -> "loki": nelle notizie le stagioni non compaiono quasi mai
const baseTitle = (title: string) => normalize(title.replace(/\s+(Season|Stagione|S\.)\s*\d+$/i, ''));

// Titolo del catalogo citato nella notizia: vince il nome più lungo ("Avengers: Doomsday" prima di "Avengers"),
// a parità l'uscita più recente. I nomi troppo corti darebbero falsi positivi.
export const findMentionedMedia = (headline: string, catalog: MediaItem[]): MediaItem | null => {
  const text = normalize(headline);
  let best: MediaItem | null = null;
  let bestLength = 0;
  for (const media of catalog) {
    const name = baseTitle(media.title);
    if (name.length < 6 || !text.includes(name)) continue;
    if (name.length > bestLength || (name.length === bestLength && best && media.releaseYear > best.releaseYear)) {
      best = media;
      bestLength = name.length;
    }
  }
  return best;
};

const rtf = new Intl.RelativeTimeFormat('it', { numeric: 'auto' });

// "3 ore fa", "ieri", "5 giorni fa"
export const timeAgo = (iso: string, now = Date.now()) => {
  const minutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (minutes > -60) return rtf.format(Math.min(minutes, -1), 'minute');
  const hours = Math.round(minutes / 60);
  if (hours > -24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
};
