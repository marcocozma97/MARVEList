import { api } from './api';
import type { VisionOrder } from '../utils/ordering';

export interface UserProfile {
  id: number;
  name: string;
  surname: string;
  email: string;
  nickname: string;
  avatar: string | null;
  followers: number;
  following: number;
  nicknameChosen: boolean;
  nicknameChangeableFrom: string | null;
}

export interface UserCard {
  id: number;
  nickname: string;
  avatar: string | null;
  followedByMe: boolean;
  me: boolean;
}

export interface PublicList {
  id: number;
  name: string;
  background: string | null;
  visionOrder: VisionOrder;
  startDate: string;
  endDate: string;
  mediaIds: number[];
}

export interface PublicProfile {
  id: number;
  nickname: string;
  avatar: string | null;
  followers: number;
  following: number;
  followedByMe: boolean;
  me: boolean;
  visible: boolean;
  rankTitle: string | null;
  rankTone: string | null;
  moviesSeen: number;
  seriesSeen: number;
  minutesWatched: number;
  favoriteIds: number[];
  watchingIds: number[];
  lists: PublicList[];
}

export interface FollowState {
  following: boolean;
  followers: number;
}

export const userService = {
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateMe: async (data: { nickname?: string; avatar?: string }): Promise<UserProfile> => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  isNicknameAvailable: async (name: string): Promise<boolean> =>
    (await api.get('/users/nickname-available', { params: { name } })).data.available,

  getPublic: async (id: number): Promise<PublicProfile> => (await api.get(`/users/${id}`)).data,

  followers: async (id: number): Promise<UserCard[]> => (await api.get(`/users/${id}/followers`)).data,

  following: async (id: number): Promise<UserCard[]> => (await api.get(`/users/${id}/following`)).data,

  search: async (q: string): Promise<UserCard[]> => (await api.get('/users/search', { params: { q } })).data,

  follow: async (id: number): Promise<FollowState> => (await api.post(`/users/${id}/follow`)).data,

  unfollow: async (id: number): Promise<FollowState> => (await api.delete(`/users/${id}/follow`)).data
};
