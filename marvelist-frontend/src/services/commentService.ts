import { api } from './api';

export interface CommentItem {
  id: number;
  parentId: number | null;
  episode: number | null;
  authorId: number;
  authorName: string;
  authorAvatar: string | null;
  text: string | null;
  gifUrl: string | null;
  spoiler: boolean;
  createdAt: string;
  mine: boolean;
  likes: number;
  liked: boolean;
  replies: CommentItem[];
}

export interface NewComment {
  text?: string;
  episode?: number | null;
  spoiler: boolean;
  gifUrl?: string | null;
  parentId?: number | null;
}

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

  like: async (commentId: number): Promise<{ likes: number; liked: boolean }> => {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },

  remove: async (commentId: number): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  }
};
