// CineSync Mobile — Notification Store (Zustand)
import { create } from 'zustand';
import { INotification } from '@app-types/index';

interface NotificationState {
  notifications: INotification[];
  unreadCount: number;

  setNotifications: (items: INotification[]) => void;
  addNotification: (item: INotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  addNotification: (item) =>
    set((state) => ({
      notifications: [item, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markRead: (id) =>
    set((state) => {
      const notif = state.notifications.find((n) => n._id === id);
      const wasUnread = notif ? !notif.isRead : false;
      return {
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  remove: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),
}));
