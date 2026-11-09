import { api } from './api';

export const NOTIFICATIONS_READ_EVENT = 'marvelist:notifications-read';

export type NotificationType = 'FOLLOW' | 'LIKE' | 'REPLY' | 'NEW_MEDIA' | 'RELEASE_30' | 'RELEASE_7' | 'RELEASE_1' | 'RELEASED' | 'EPISODE_OUT' | 'NICKNAME' | 'JAIRVIS_OFFLINE';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  actorId: number;
  actorName: string;
  actorAvatar: string | null;
  mediaId: number | null;
  mediaTitle: string | null;
  episode: number | null;
  commentId: number | null;
  snippet: string | null;
  mediaPoster: string | null;
  releaseDate: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  list: async (): Promise<NotificationItem[]> => (await api.get('/notifications')).data,

  unreadCount: async (): Promise<number> => (await api.get('/notifications/unread-count')).data.count,

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/read');
  }
};
