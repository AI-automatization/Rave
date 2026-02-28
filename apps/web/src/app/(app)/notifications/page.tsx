'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, INotification } from '@/types';

const TYPE_ICONS: Record<INotification['type'], string> = {
  friend_request:     '👥',
  friend_accepted:    '🤝',
  battle_invite:      '⚔️',
  battle_result:      '🏆',
  achievement_unlocked: '🎖️',
  watch_party_invite: '🎬',
  system:             '🔔',
};

const TYPE_ROUTES: Partial<Record<INotification['type'], (data?: Record<string, string>) => string>> = {
  friend_request:       () => `/friends`,
  battle_invite:        () => `/battle`,
  battle_result:        (d) => d?.battleId ? `/battle/${d.battleId}` : '/battle',
  watch_party_invite:   (d) => d?.roomId ? `/party/${d.roomId}` : '/home',
  achievement_unlocked: () => `/achievements`,
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await apiClient.get<ApiResponse<INotification[]>>('/notifications?limit=50');
      setNotifications(res.data.data ?? []);
    } catch (err) {
      logger.error('Bildirishnomalar yuklashda xato', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      logger.warn('O\'qildi belgilashda xato', err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      logger.warn('Barchasini o\'qildi belgilashda xato', err);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      logger.warn("O'chirishda xato", err);
    }
  };

  const handleClick = (notif: INotification) => {
    if (!notif.isRead) void markRead(notif._id);
    const route = TYPE_ROUTES[notif.type];
    if (route) router.push(route(notif.data));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-display">BILDIRISHNOMALAR</h1>
          {unreadCount > 0 && (
            <span className="badge badge-primary">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => void markAllRead()}
            className="btn btn-ghost btn-sm gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            Barchasini o&apos;qildi
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card bg-base-200 animate-pulse h-16" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 mx-auto text-base-content/10 mb-4" />
          <p className="text-base-content/40">Bildirishnomalar yo&apos;q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`card cursor-pointer transition-colors hover:bg-base-300 ${
                notif.isRead ? 'bg-base-200' : 'bg-base-200 border-l-4 border-primary'
              }`}
              onClick={() => handleClick(notif)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleClick(notif)}
            >
              <div className="card-body p-4 flex-row items-center gap-3">
                <span className="text-xl shrink-0">{TYPE_ICONS[notif.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${notif.isRead ? 'text-base-content/70' : 'text-base-content'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-base-content/50 line-clamp-1">{notif.body}</p>
                  <p className="text-xs text-base-content/30 mt-0.5">
                    {new Date(notif.createdAt).toLocaleString('uz')}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!notif.isRead && (
                    <button
                      className="btn btn-ghost btn-xs btn-circle"
                      onClick={(e) => { e.stopPropagation(); void markRead(notif._id); }}
                      title="O'qildi"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-xs btn-circle text-error"
                    onClick={(e) => { e.stopPropagation(); void deleteNotif(notif._id); }}
                    title="O'chirish"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
