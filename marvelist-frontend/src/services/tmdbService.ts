import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  console.error("VITE_TMDB_API_KEY mancante: crea il file .env nella root del frontend e riavvia 'npm run dev'.");
}

type MediaType = 'FILM' | 'SERIE_TV';

const SEASON_RE = /\s+(Season|S\.)\s*(\d+)$/i;

export interface TmdbCastMember { id: number; name: string; character?: string; profile_path: string | null }
export interface TmdbVideo { type: string; site: string; key: string }

// Campi di /movie/{id} e /tv/{id} (con credits e videos) usati dall'app
export interface TmdbDetails {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  runtime?: number | null;
  number_of_episodes?: number;
  credits?: { cast?: TmdbCastMember[] };
  videos?: { results?: TmdbVideo[] };
}

export interface TmdbEpisode {
  name?: string;
  overview?: string;
  still_path: string | null;
  air_date?: string;
  runtime?: number | null;
  vote_average?: number;
}

export const tmdbService = {
  getEpisode: async (tmdbId: number, season: number, episode: number): Promise<TmdbEpisode | null> => {
    const url = `${TMDB_BASE_URL}/tv/${tmdbId}/season/${season}/episode/${episode}`;
    try {
      const it = (await axios.get(url, { params: { api_key: TMDB_API_KEY, language: 'it-IT' } })).data as TmdbEpisode;
      if (it.overview?.trim()) return it;
      const en = (await axios.get(url, { params: { api_key: TMDB_API_KEY, language: 'en-US' } })).data as TmdbEpisode;
      return { ...it, overview: en.overview, name: it.name && !/^Episodio \d+$/i.test(it.name) ? it.name : en.name };
    } catch {
      return null;
    }
  },

  getDetails: async (tmdbId: number, type: MediaType): Promise<TmdbDetails> => {
    const endpoint = type === 'FILM' ? 'movie' : 'tv';
    const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'it-IT',
        append_to_response: 'credits,videos'
      }
    });
    return response.data;
  },

  // Cerca il primo risultato compatibile per titolo; se con l'anno non trova nulla, riprova senza.
  // Un risultato con l'anno sbagliato viene scartato.
  searchFirstResult: async (title: string, year: number | undefined, type: MediaType) => {
    const endpoint = type === 'FILM' ? 'search/movie' : 'search/tv';
    const yearParam = type === 'FILM' ? { primary_release_year: year } : { first_air_date_year: year };
    const season = title.match(SEASON_RE);
    const laterSeason = type === 'SERIE_TV' && !!season && season[2] !== '1';

    const isPlausible = (result: { release_date?: string; first_air_date?: string }) => {
      const found = Number((result.release_date || result.first_air_date || '').slice(0, 4));
      if (!year || !found) return false;
      return laterSeason ? found <= year + 1 : Math.abs(found - year) <= 1;
    };

    const search = async (withYear: boolean) => {
      const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}`, {
        params: {
          api_key: TMDB_API_KEY,
          query: title.replace(SEASON_RE, ''), // "Loki Season 2" -> "Loki"
          language: 'it-IT',
          ...(withYear && year ? yearParam : {})
        }
      });
      return response.data.results?.find(isPlausible) ?? null;
    };

    try {
      return (await search(true)) ?? (year ? await search(false) : null);
    } catch (error) {
      console.error("Errore ricerca TMDB", error);
      return null;
    }
  },

  // Cerca per Titolo se l'ID non esiste nel DB e scarica i dettagli completi
  searchByName: async (title: string, year: number, type: MediaType) => {
    const firstResult = await tmdbService.searchFirstResult(title, year, type);
    if (!firstResult) return null;
    try {
      return await tmdbService.getDetails(firstResult.id, type);
    } catch (error) {
      console.error("Errore dettagli TMDB", error);
      return null;
    }
  },

  // Recupera solo la locandina (usa l'ID se c'è, altrimenti cerca per titolo)
  findPoster: async (media: { tmdbId?: number | null; title: string; releaseYear: number; type: MediaType }) => {
    try {
      if (media.tmdbId) {
        const details = await tmdbService.getDetails(media.tmdbId, media.type);
        return details.poster_path ? { tmdbId: details.id, posterPath: details.poster_path } : null;
      }
      const result = await tmdbService.searchFirstResult(media.title, media.releaseYear, media.type);
      return result?.poster_path ? { tmdbId: result.id as number, posterPath: result.poster_path as string } : null;
    } catch (error) {
      console.error("Errore recupero locandina TMDB", error);
      return null;
    }
  }
};
