import { api } from './api';

export interface CommentItem {
  id: number;
  episode: number | null;
  authorName: string;
  authorAvatar: string | null;
  text: string | null;
  gifUrl: string | null;
  imageUrl: string | null;
  spoiler: boolean;
  createdAt: string;
  mine: boolean;
}

export interface NewComment {
  text?: string;
  episode?: number | null;
  spoiler: boolean;
  gifUrl?: string | null;
  image?: string | null;
}

export const commentImageSrc = (imageUrl: string) => `${api.defaults.baseURL}${imageUrl}`;

export const commentService = {
  list: async (mediaId: number, episode?: number | null): Promise<CommentItem[]> => {
    const response = await api.get(`/media/${mediaId}/comments`, { params: episode ? { episode } : {} });
    return response.data;
  },

  count: async (mediaId: number, episode?: number | null): Promise<number> => {
    const response = await api.get(`/media/${mediaId}/comments/count`, { params: episode ? { episode } : {} });
    return response.data.count;
  },

  create: async (mediaId: number, comment: NewComment): Promise<CommentItem> => {
    const response = await api.post(`/media/${mediaId}/comments`, comment);
    return response.data;
  },

  remove: async (commentId: number): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  }
};
