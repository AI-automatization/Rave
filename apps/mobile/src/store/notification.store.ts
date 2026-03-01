import { create } from 'zustand';
import type { INotification } from '@types/index';

interface NotificationState {
  notifications: INotification[];
  unreadCount: number;

  setNotifications: (items: INotification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (item: INotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),

  addNotification: (item) =>
    set((state) => ({
      notifications: [item, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  remove: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
    })),
}));
