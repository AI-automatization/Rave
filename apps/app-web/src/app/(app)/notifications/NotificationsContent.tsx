'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Bell, Users, Tv, Trash2, Loader2, CheckCheck } from 'lucide-react';
import type { INotification } from '@/types';

async function fetchNotifications(): Promise<INotification[]> {
  const res = await fetch('/api/notifications', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json() as { data?: INotification[] } | INotification[];
  return Array.isArray(data) ? data : (data as { data?: INotification[] }).data ?? [];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotifIcon({ type }: { type: INotification['type'] }) {
  if (type === 'friend_request' || type === 'friend_accepted') {
    return <Users size={16} className="text-violet-400" />;
  }
  if (type === 'watch_party_invite') {
    return <Tv size={16} className="text-blue-400" />;
  }
  return <Bell size={16} className="text-slate-400" />;
}

interface NotificationItemProps {
  notification: INotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.05] last:border-0 transition-colors cursor-pointer group ${
        notification.isRead
          ? 'hover:bg-white/[0.02]'
          : 'border-l-2 border-l-violet-500 hover:bg-violet-500/[0.07]'
      }`}
      style={!notification.isRead ? { background: 'rgba(124,58,237,0.05)' } : undefined}
      onClick={() => !notification.isRead && onRead(notification._id)}
    >
      <div className="shrink-0 mt-1">
        <NotifIcon type={notification.type} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${notification.isRead ? 'text-slate-300' : 'text-white'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-[11px] text-slate-600 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>

      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg opacity-0 group-hover:opacity-100"
        aria-label="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function NotificationsContent() {
  const t = useTranslations('notifications');
  const qc = useQueryClient();

  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications/read-all', { method: 'PATCH', credentials: 'include' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="liquid-glass-sm px-5 py-3.5 flex items-center justify-between">
        <h1 className="text-base font-semibold text-white">{t('title')}</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="h-8 px-3 rounded-md text-xs font-medium text-zinc-400 border border-white/[0.08] hover:bg-white/[0.04] transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCheck size={14} />
            {t('markAllRead')}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="liquid-glass-sm flex flex-col items-center justify-center py-16 gap-3">
          <Bell size={24} className="text-zinc-700" />
          <p className="text-sm text-zinc-500">{t('loadError')}</p>
        </div>
      )}

      {!isLoading && !isError && (!notifications || notifications.length === 0) && (
        <div className="liquid-glass-sm flex flex-col items-center justify-center py-16 gap-3">
          <Bell size={24} className="text-zinc-700" />
          <p className="text-sm text-zinc-500">{t('empty')}</p>
        </div>
      )}

      {!isLoading && !isError && notifications && notifications.length > 0 && (
        <div className="liquid-glass overflow-hidden">
          {notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onRead={(id) => markRead.mutate(id)}
              onDelete={(id) => deleteNotif.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
