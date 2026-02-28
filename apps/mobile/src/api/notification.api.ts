import { notificationClient } from './client';
import type { ApiResponse, INotification } from '@types/index';

export const notificationApi = {
  getNotifications: async (page = 1, limit = 20, isRead?: boolean) => {
    const { data } = await notificationClient.get<ApiResponse<INotification[]>>('/notifications', {
      params: { page, limit, ...(isRead !== undefined && { isRead }) },
    });
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await notificationClient.get<ApiResponse<{ unreadCount: number }>>(
      '/notifications/unread-count',
    );
    return data;
  },

  markAllRead: async () => {
    await notificationClient.patch('/notifications/read-all');
  },

  markRead: async (notificationId: string) => {
    await notificationClient.patch(`/notifications/${notificationId}/read`);
  },

  deleteNotification: async (notificationId: string) => {
    await notificationClient.delete(`/notifications/${notificationId}`);
  },
};
