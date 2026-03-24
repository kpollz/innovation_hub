import apiClient from './client';
import type { NotificationListResponse } from '@/types';

export const notificationsApi = {
  list: async (page = 1, limit = 5, unread_only = false): Promise<NotificationListResponse> => {
    const response = await apiClient.get<NotificationListResponse>('/notifications', {
      params: { page, limit, unread_only },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<number> => {
    const response = await apiClient.patch<{ updated: number }>('/notifications/read-all');
    return response.data.updated;
  },
};
