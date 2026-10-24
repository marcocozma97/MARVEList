import { api } from './api';

export interface UserProfile {
  name: string;
  surname: string;
  email: string;
  nickname: string;
  avatar: string | null;
}

export const userService = {
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateMe: async (data: { nickname?: string; avatar?: string }): Promise<UserProfile> => {
    const response = await api.put('/users/me', data);
    return response.data;
  }
};
