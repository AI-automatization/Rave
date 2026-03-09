'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaBell, FaCheck, FaCheckDouble, FaTrash, FaUserFriends,
  FaTrophy, FaMedal, FaFilm, FaInfoCircle, FaSync,
} from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, INotification } from '@/types';

const TYPE_META: Record<INotification['type'], { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  friend_request:       { icon: <FaUserFriends size={16} />, color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
  friend_accepted:      { icon: <FaUserFriends size={16} />, color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  battle_invite:        { icon: <FaTrophy size={16} />,       color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  battle_result:        { icon: <FaTrophy size={16} />,       color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
  achievement_unlocked: { icon: <FaMedal size={16} />,        color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  watch_party_invite:   { icon: <FaFilm size={16} />,         color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30' },
  system:               { icon: <FaInfoCircle size={16} />,   color: 'text-slate-400',  bg: 'bg-slate-500/15',  border: 'border-slate-500/30' },
};

const TYPE_ROUTES: Partial<Record<INotification['type'], (data?: Record<string, string>) => string>> = {
  friend_request:       () => `/friends`,
  battle_invite:        () => `/battle`,
  battle_result:        (d) => d?.battleId ? `/battle/${d.battleId}` : '/battle',
  watch_party_invite:   (d) => d?.roomId ? `/party/${d.roomId}` : '/home',
  achievement_unlocked: () => `/achievements`,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Hozir';
  if (mins < 60) return `${mins} daq. oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Kecha';
  if (days < 7) return `${days} kun oldin`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await apiClient.get<ApiResponse<INotification[]>>('/notifications?limit=50');
      setNotifications(res.data.data ?? []);
    } catch (err) {
      logger.error('Bildirishnomalar yuklashda xato', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

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

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await apiClient.delete(`/notifications/${id}`);
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
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <FaBell size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white leading-tight">{t('title')}</h1>
            <p className="text-xs text-slate-500">
              {unreadCount > 0 ? `${unreadCount} ta o'qilmagan` : 'Hammasi o\'qilgan'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadNotifications(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all disabled:opacity-40"
            title="Yangilash"
          >
            <FaSync size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllRead()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-slate-300 hover:bg-white/[0.05] transition-all text-xs font-medium border border-white/[0.06]"
            >
              <FaCheckDouble size={12} />
              {t('markAllRead')}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <FaBell size={24} className="text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">{t('empty')}</p>
            <p className="text-slate-600 text-sm mt-1">Hozircha bildirishnomalar yo&apos;q</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((notif) => {
            const meta = TYPE_META[notif.type];
            return (
              <div
                key={notif._id}
                onClick={() => handleClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleClick(notif)}
                className={`group relative flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all hover:border-white/[0.12] hover:bg-white/[0.03] ${
                  notif.isRead
                    ? 'bg-transparent border-white/[0.06]'
                    : 'bg-white/[0.04] border-white/[0.09]'
                }`}
              >
                {/* Unread dot */}
                {!notif.isRead && (
                  <div className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
                )}

                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bg} ${meta.border} ${meta.color}`}>
                  {meta.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pr-6">
                  <p className={`text-sm font-medium leading-snug ${notif.isRead ? 'text-slate-400' : 'text-slate-100'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{notif.body}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>

                {/* Actions — visible on hover */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); void markRead(notif._id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-all"
                      title="O'qildi"
                    >
                      <FaCheck size={11} />
                    </button>
                  )}
                  <button
                    onClick={(e) => void deleteNotif(notif._id, e)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="O'chirish"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
