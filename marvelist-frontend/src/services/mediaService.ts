import { api } from './api';

export const PROGRESS_CHANGED_EVENT = 'marvelist:progress-changed';

const notifyProgressChanged = <T,>(value: T): T => {
  window.dispatchEvent(new Event(PROGRESS_CHANGED_EVENT));
  return value;
};

export interface MediaItem {
  id: number;
  tmdbId: number;
  title: string;
  type: 'FILM' | 'SERIE_TV';
  phase: string;
  visionOrder: 'MCU' | 'FAN' | 'GOD';
  posterPath: string;
  releaseYear: number;
  sortOrder: number | null;
  episodes: number | null; // solo SERIE_TV
  runtime: number | null;  // solo FILM, in minuti
  upcoming: boolean | null; // "In arrivo" nel JSON (inArrivo = true)
  releaseDate: string | null; // data di uscita dei titoli in arrivo (da TMDB), yyyy-mm-dd
  doomsday: boolean | null; // fa parte della Road to Doomsday
  tags: string | null;      // tag del JSON separati da virgola
  episodeAirDates?: string | null;
}

// Progresso personale su un titolo (minuti/episodi visti, voto, stato)
export interface MediaProgress {
  mediaId: number;
  seen: boolean;
  favorite: boolean;
  inWatchlist: boolean;
  watchLater: boolean; // "Guarda dopo": saltato nelle maratone e nel completamento delle fasi
  rating: number | null;
  minutesWatched: number;
  watchedEpisodes: number[];
}

export const mediaService = {
  // Chiamata per ottenere tutti i media per la Timeline
  getAllMedia: async (): Promise<MediaItem[]> => {
    const response = await api.get('/media');
    return response.data;
  },

  getMediaById: async (id: number): Promise<MediaItem> => {
    const response = await api.get(`/media/${id}`);
    return response.data;
  },

  getSeenIds: async (): Promise<number[]> => {
    const response = await api.get('/media/seen');
    return response.data;
  },

  // Clicca "visto" o "non visto" (il backend allinea anche minuti ed episodi)
  toggleSeen: async (mediaId: number): Promise<MediaProgress> => {
    const response = await api.post(`/media/${mediaId}/seen`);
    return notifyProgressChanged(response.data);
  },

  // Presa visione di un'intera fase (seen=false la azzera: voti e preferiti restano)
  setSeenBulk: async (mediaIds: number[], seen: boolean): Promise<MediaProgress[]> => {
    const response = await api.post('/media/bulk-seen', { mediaIds, seen });
    return notifyProgressChanged(response.data);
  },

  getFavorites: async (): Promise<number[]> => {
    const response = await api.get('/media/favorites');
    return response.data;
  },

  toggleFavorite: async (mediaId: number): Promise<void> => {
    await api.post(`/media/${mediaId}/favorite`);
  },

  // "Guarda dopo": titoli rimandati dall'utente
  getWatchLater: async (): Promise<number[]> => {
    const response = await api.get('/media/watch-later');
    return response.data;
  },

  toggleWatchLater: async (mediaId: number): Promise<MediaProgress> => {
    const response = await api.post(`/media/${mediaId}/watch-later`);
    return response.data;
  },

  // Watchlist automatica: titoli iniziati ma non finiti
  getWatchlist: async (): Promise<number[]> => {
    const response = await api.get('/media/watchlist');
    return response.data;
  },

  getAllProgress: async (): Promise<MediaProgress[]> => {
    const response = await api.get('/media/progress');
    return response.data;
  },

  getProgress: async (mediaId: number): Promise<MediaProgress> => {
    const response = await api.get(`/media/${mediaId}/progress`);
    return response.data;
  },

  // Minuti visti (film) o episodi visti (serie)
  updateProgress: async (mediaId: number, data: { minutesWatched?: number; watchedEpisodes?: number[] }): Promise<MediaProgress> => {
    const response = await api.put(`/media/${mediaId}/progress`, data);
    return notifyProgressChanged(response.data);
  },

  // Voto a scudi da 0.5 a 10 (null lo toglie)
  updateRating: async (mediaId: number, rating: number | null): Promise<MediaProgress> => {
    const response = await api.put(`/media/${mediaId}/rating`, { rating });
    return response.data;
  },

  getEpisodeRatings: async (mediaId: number): Promise<Record<number, number>> => {
    const response = await api.get(`/media/${mediaId}/episode-ratings`);
    return response.data;
  },

  rateEpisode: async (mediaId: number, episode: number, rating: number | null): Promise<Record<number, number>> => {
    const response = await api.put(`/media/${mediaId}/episodes/${episode}/rating`, { rating });
    return response.data;
  },

  // Salva l'ID, la locandina (ed eventualmente durata/episodi) nel database
  syncTmdbData: async (id: number, tmdbId: number, posterPath: string, extra?: { runtime?: number; episodes?: number }): Promise<void> => {
    await api.put(`/media/${id}/sync`, null, {
      params: { tmdbId, posterPath, ...extra }
    });
  }
};
