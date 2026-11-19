import { api } from './api';

export interface CommunityRating { average: number | null; count: number }

// Voto MARVEList: media dei voti di tutti gli utenti sul titolo e sui singoli episodi
export interface MediaRatings {
  rating: CommunityRating;
  episodes: Record<number, CommunityRating>;
}

export interface TopWatched { mediaId: number; users: number }
export interface TopRated { mediaId: number; average: number; count: number }

// Classifiche ricalcolate dal server ogni 24 ore
export interface Rankings { topWatched: TopWatched[]; topRated: TopRated[]; updatedAt: string | null }

export const communityService = {
  getRatings: async (mediaId: number): Promise<MediaRatings> => (await api.get(`/community/ratings/${mediaId}`)).data,
  getRankings: async (): Promise<Rankings> => (await api.get('/community/rankings')).data,
};
