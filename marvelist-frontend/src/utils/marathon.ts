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

// Ridimensiona e comprime l'immagine caricata: lo sfondo resta leggero nel database
export const compressImage = (file: File, maxWidth = 1600, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossibile leggere il file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Il file non è un\'immagine valida'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas non disponibile'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
