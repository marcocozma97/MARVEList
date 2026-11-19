import { isAxiosError } from 'axios';
import { getPosterUrl } from './poster';

// Sfondo di una maratona: immagine caricata (data URL), URL completo o locandina TMDB
export const getBackgroundUrl = (background: string | null | undefined) => {
  if (!background) return null;
  if (background.startsWith('data:')) return background;
  return getPosterUrl(background, 'w780');
};

// Date "yyyy-mm-dd" lette come giorno locale (new Date("2026-10-21") sarebbe UTC e può slittare di un giorno)
export const parseDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const toIsoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const addDays = (iso: string, days: number) => {
  const date = parseDay(iso);
  date.setDate(date.getDate() + days);
  return toIsoDay(date);
};

export const formatDay = (iso: string) => parseDay(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

// "Oggi", "Domani" oppure "lunedì 26 ottobre"
export const dayLabel = (iso: string) => {
  const today = toIsoDay(new Date());
  if (iso === today) return 'Oggi';
  if (iso === addDays(today, 1)) return 'Domani';
  return parseDay(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
};

// Messaggio d'errore del backend (server.error.include-message=always) o un testo di riserva
export const errorMessage = (error: unknown, fallback: string) =>
  (isAxiosError(error) && typeof error.response?.data?.message === 'string' && error.response.data.message) || fallback;
