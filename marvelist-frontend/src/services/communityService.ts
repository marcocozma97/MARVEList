import { api } from './api';

export interface CommunityRating { average: number | null; count: number }

// Voto MARVEList: media dei voti di tutti gli utenti sul titolo e sui singoli episodi
export interface MediaRatings {
  rating: CommunityRating;
  episodes: Record<number, CommunityRating>;
}

export interface TopWatched { mediaId: number; users: number }
export interface TopRated { mediaId: number; average: number; count: number }

export const communityService = {
  getRatings: async (mediaId: number): Promise<MediaRatings> => (await api.get(`/community/ratings/${mediaId}`)).data,
  getTopWatched: async (): Promise<TopWatched[]> => (await api.get('/community/top-watched')).data,
  getTopRated: async (): Promise<TopRated[]> => (await api.get('/community/top-rated')).data,
};
