'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaBell, FaCheck, FaCheckDouble, FaTrash } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, INotification } from '@/types';

const TYPE_ICONS: Record<INotification['type'], string> = {
  friend_request:       '👥',
  friend_accepted:      '🤝',
  battle_invite:        '⚔️',
  battle_result:        '🏆',
  achievement_unlocked: '🎖️',
  watch_party_invite:   '🎬',
  system:               '🔔',
};

const TYPE_ROUTES: Partial<Record<INotification['type'], (data?: Record<string, string>) => string>> = {
  friend_request:       () => `/friends`,
  battle_invite:        () => `/battle`,
  battle_result:        (d) => d?.battleId ? `/battle/${d.battleId}` : '/battle',
  watch_party_invite:   (d) => d?.roomId ? `/party/${d.roomId}` : '/home',
  achievement_unlocked: () => `/achievements`,
};

export default function NotificationsPage() {
  const t = useTranslations('notifications');
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
      logger.warn("O'qildi belgilashda xato", err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      logger.warn("Barchasini o'qildi belgilashda xato", err);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaBell size={28} className="text-cyan-400" />
          <h1 className="text-3xl font-display text-white">{t('title')}</h1>
          {unreadCount > 0 && <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-cyan-500 text-slate-900 font-semibold">{unreadCount}</span>}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => void markAllRead()} className="inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all text-sm font-medium">
            <FaCheckDouble size={16} />
            {t('markAllRead')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <FaBell size={64} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-500">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`rounded-lg border transition-all cursor-pointer hover:border-cyan-500/50 p-4 flex gap-3 ${
                notif.isRead ? 'bg-slate-800 border-slate-700' : 'bg-slate-800 border-l-4 border-cyan-500'
              }`}
              onClick={() => handleClick(notif)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleClick(notif)}
            >
              <span className="text-lg shrink-0">{TYPE_ICONS[notif.type]}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${notif.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-slate-500 line-clamp-1">{notif.body}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!notif.isRead && (
                  <button
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-700/50 transition-all"
                    onClick={(e) => { e.stopPropagation(); void markRead(notif._id); }}
                  >
                    <FaCheck size={12} />
                  </button>
                )}
                <button
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                  onClick={(e) => { e.stopPropagation(); void deleteNotif(notif._id); }}
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
