'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaBell, FaCheck, FaCheckDouble, FaTrash,
  FaUserFriends, FaTrophy, FaMedal, FaFilm, FaSync, FaWifi,
  FaUserCheck, FaDoorOpen,
} from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, INotification } from '@/types';

type AnyNotifType = INotification['type'] | string;

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  friend_request:       { icon: <FaUserFriends size={15} />, color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  friend_accepted:      { icon: <FaUserFriends size={15} />, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  friend_online:        { icon: <FaWifi size={15} />,         color: 'text-lime-400',   bg: 'bg-lime-500/20' },
  friend_watching:      { icon: <FaFilm size={15} />,         color: 'text-lime-400',   bg: 'bg-lime-500/20' },
  battle_invite:        { icon: <FaTrophy size={15} />,       color: 'text-orange-400', bg: 'bg-orange-500/20' },
  battle_result:        { icon: <FaTrophy size={15} />,       color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  achievement_unlocked: { icon: <FaMedal size={15} />,        color: 'text-purple-400', bg: 'bg-purple-500/20' },
  watch_party_invite:   { icon: <FaFilm size={15} />,         color: 'text-cyan-400',   bg: 'bg-cyan-500/20' },
  system:               { icon: <FaBell size={15} />,         color: 'text-slate-400',  bg: 'bg-slate-500/20' },
};

const DEFAULT_META = { icon: <FaBell size={15} />, color: 'text-slate-400', bg: 'bg-slate-500/20' };

const TYPE_ROUTES: Partial<Record<AnyNotifType, (data?: Record<string, string>) => string>> = {
  friend_request:       () => '/friends?tab=requests',
  battle_invite:        () => '/battle',
  battle_result:        (d) => d?.battleId ? `/battle/${d.battleId}` : '/battle',
  watch_party_invite:   (d) => d?.inviteCode ? `/party/join/${d.inviteCode}` : (d?.roomId ? `/party/${d.roomId}` : '/home'),
  achievement_unlocked: () => '/achievements',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Hozirgina';
  if (mins < 60) return `${mins} daq. oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Kecha';
  if (days < 7) return `${days} kun oldin`;
  return new Date(dateStr).toLocaleDateString('uz-UZ');
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<INotification[]>>('/notifications?limit=50');
      const data = res.data.data;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error('Bildirishnomalar yuklashda xato', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { logger.warn('markRead error', err); }
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) { logger.warn('markAllRead error', err); }
  };

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    apiClient.delete(`/notifications/${id}`).catch(() => {});
  };

  const acceptFriendRequest = async (e: React.MouseEvent, notif: INotification) => {
    e.stopPropagation();
    const friendshipId = notif.data?.friendshipId;
    if (!friendshipId || acceptingIds.has(notif._id) || acceptedIds.has(notif._id)) return;
    setAcceptingIds((p) => new Set(p).add(notif._id));
    try {
      await apiClient.patch(`/users/friends/accept/${friendshipId}`);
      setAcceptedIds((p) => new Set(p).add(notif._id));
      void markRead(notif._id);
    } catch (err) {
      logger.warn('acceptFriendRequest error', err);
    } finally {
      setAcceptingIds((p) => { const s = new Set(p); s.delete(notif._id); return s; });
    }
  };

  const handleClick = (notif: INotification) => {
    if (!notif.isRead) void markRead(notif._id);
    const route = TYPE_ROUTES[notif.type];
    if (route) router.push(route(notif.data));
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <FaBell size={18} className="text-violet-400" />
            </div>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{t('title')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {unread > 0 ? `${unread} ta o'qilmagan` : "Hammasi o'qilgan"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void load(true)}
            disabled={refreshing}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all disabled:opacity-40"
          >
            <FaSync size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {unread > 0 && (
            <button
              onClick={() => void markAllRead()}
              className="h-9 px-4 rounded-xl flex items-center gap-2 text-sm text-slate-300 border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.14] transition-all"
            >
              <FaCheckDouble size={12} />
              {t('markAllRead')}
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[76px] rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-32">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
            <FaBell size={28} className="text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-medium text-lg">{t('empty')}</p>
            <p className="text-slate-600 text-sm mt-1">Hozircha bildirishnomalar yo&apos;q</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-1.5">
          {notifications.map((notif) => {
            const meta = TYPE_META[notif.type] ?? DEFAULT_META;
            return (
              <div
                key={notif._id}
                onClick={() => handleClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleClick(notif)}
                className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl border cursor-pointer transition-all select-none
                  hover:bg-white/[0.04] hover:border-white/[0.1]
                  ${notif.isRead
                    ? 'bg-transparent border-white/[0.05]'
                    : 'bg-white/[0.035] border-white/[0.08]'
                  }`}
              >
                {/* Unread indicator */}
                {!notif.isRead && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-violet-500" />
                )}

                {/* Type icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className={`text-sm font-medium truncate ${notif.isRead ? 'text-slate-400' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[11px] text-slate-600 shrink-0">{timeAgo(notif.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{notif.body}</p>
                </div>

                {/* Inline action buttons for specific types */}
                {notif.type === 'friend_request' && !acceptedIds.has(notif._id) && (
                  <button
                    onClick={(e) => void acceptFriendRequest(e, notif)}
                    disabled={acceptingIds.has(notif._id)}
                    className="shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                  >
                    {acceptingIds.has(notif._id) ? (
                      <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                    ) : (
                      <FaUserCheck size={11} />
                    )}
                    Qabul
                  </button>
                )}
                {notif.type === 'friend_request' && acceptedIds.has(notif._id) && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs text-emerald-400">
                    <FaCheck size={10} /> Qabul qilindi
                  </span>
                )}
                {notif.type === 'watch_party_invite' && notif.data?.inviteCode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/party/join/${notif.data!.inviteCode}`); }}
                    className="shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-all"
                  >
                    <FaDoorOpen size={11} />
                    Kirish
                  </button>
                )}

                {/* Read / Delete (hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); void markRead(notif._id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      title="O'qildi"
                    >
                      <FaCheck size={11} />
                    </button>
                  )}
                  <button
                    onClick={(e) => remove(notif._id, e)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
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
