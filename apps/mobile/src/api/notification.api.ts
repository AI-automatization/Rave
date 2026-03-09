// CineSync Mobile — Notification API
import { notificationClient } from './client';
import { ApiResponse, INotification } from '@app-types/index';

export const notificationApi = {
  async getAll(page = 1, limit = 20): Promise<INotification[]> {
    const res = await notificationClient.get<ApiResponse<INotification[]>>('/notifications', {
      params: { page, limit },
    });
    return res.data.data ?? [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    await notificationClient.put(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await notificationClient.put('/notifications/read-all');
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await notificationClient.delete(`/notifications/${notificationId}`);
  },

  async getUnreadCount(): Promise<number> {
    const res = await notificationClient.get<ApiResponse<{ count: number }>>(
      '/notifications/unread-count',
    );
    return res.data.data?.count ?? 0;
  },
};
