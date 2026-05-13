import { apiClient } from './client';

export type NotifType = 'announcement' | 'maintenance' | 'promo' | 'update' | 'system' | 'warning';

export const notificationsApi = {
  broadcast: async (title: string, body: string, type: NotifType): Promise<void> => {
    await apiClient.post('/admin/notifications/broadcast', { title, body, type });
  },

  sendToUser: async (userId: string, title: string, body: string, type: NotifType): Promise<void> => {
    await apiClient.post('/admin/notifications/send', { userId, title, body, type });
  },
};
