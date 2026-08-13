'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Bell, Users, Tv, Trash2, CheckCheck } from 'lucide-react';
import type { INotification } from '@/types';
import { trackClick } from '@/lib/analytics';
import { useRelativeTime } from '@/lib/relative-time';

async function fetchNotifications(): Promise<INotification[]> {
  const res = await fetch('/api/notifications', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json() as { data?: INotification[] } | INotification[];
  return Array.isArray(data) ? data : (data as { data?: INotification[] }).data ?? [];
}

/** Turi bo'yicha ikonka — rang tokendan, ilgari to'g'ridan-to'g'ri Tailwind ranglari edi */
function NotifIcon({ type }: { type: INotification['type'] }) {
  if (type === 'friend_request' || type === 'friend_accepted') {
    return <Users size={15} aria-hidden="true" className="text-[var(--ww-accent-hi)]" />;
  }
  if (type === 'watch_party_invite') {
    return <Tv size={15} aria-hidden="true" className="text-[var(--ww-online)]" />;
  }
  return <Bell size={15} aria-hidden="true" className="text-[var(--ww-text-3)]" />;
}

/** Bo'sh va xato holatlari bir xil shaklda — faqat matn farq qiladi */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="ww-card flex flex-col items-center justify-center gap-3 py-16">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)]">
        <Bell size={20} aria-hidden="true" className="text-[var(--ww-text-4)]" />
      </span>
      <p className="text-[13px] text-[var(--ww-text-3)]">{text}</p>
    </div>
  );
}

interface NotificationItemProps {
  notification: INotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const t = useTranslations('notifications');
  const timeAgo = useRelativeTime();
  const unread = !notification.isRead;

  const markRead = () => {
    if (!unread) return;
    trackClick('notifications:read');
    onRead(notification._id);
  };

  return (
    <li
      /* O'qilmagan qator bosiladigan bo'lgani uchun klaviaturadan ham
         ochilishi kerak — ilgari bu oddiy `div` edi va Tab bilan umuman
         yetib bo'lmasdi. O'qilgan qator interaktiv emas, unga rol berilmaydi. */
      role={unread ? 'button' : undefined}
      tabIndex={unread ? 0 : undefined}
      aria-label={unread ? t('markRead') : undefined}
      onClick={markRead}
      onKeyDown={(e) => {
        if (!unread) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          markRead();
        }
      }}
      className={`group relative flex items-start gap-3 border-b border-[var(--ww-line)] px-4 py-3.5 transition-colors last:border-0 ${
        unread
          ? 'cursor-pointer bg-[var(--ww-accent-soft)] hover:bg-[rgba(124,58,237,0.20)]'
          : 'hover:bg-[var(--ww-surface-1)]'
      }`}
    >
      {/* Chap chekkadagi belgi — holat faqat fon rangiga tayanmasligi kerak */}
      {unread && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px] bg-[var(--ww-accent-hi)]"
        />
      )}

      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)]">
        <NotifIcon type={notification.type} />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`text-[13.5px] font-medium leading-snug ${
            unread ? 'text-[var(--ww-text)]' : 'text-[var(--ww-text-2)]'
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ww-text-3)]">
          {notification.body}
        </p>
        <p className="mt-1 text-[11.5px] text-[var(--ww-text-4)]">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {unread && (
        <span
          aria-hidden="true"
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--ww-accent-hi)]"
        />
      )}

      {/* Always visible below `sm`: `group-hover` has no equivalent on touch, so on a phone the
          delete button was simply unreachable. */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); trackClick('notifications:delete'); onDelete(notification._id); }}
        className="-m-1 shrink-0 cursor-pointer rounded-[var(--ww-r-sm)] p-2.5 text-[var(--ww-text-4)] transition-colors hover:bg-[var(--ww-danger-soft)] hover:text-[var(--ww-danger)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        aria-label={t('delete')}
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </li>
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Sarlavha endi panel ichida emas, sahifaning o'z sarlavhasi — /home
          bilan bir xil tipografik pog'ona */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-[var(--ww-text)] sm:text-[30px]">
            {t('title')}
          </h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-[13px] text-[var(--ww-text-3)]">
              {t('unreadCount', { count: unreadCount })}
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => { trackClick('notifications:mark_all_read'); markAllRead.mutate(); }}
            disabled={markAllRead.isPending}
            className="ww-btn-subtle flex h-10 cursor-pointer items-center gap-2 rounded-[var(--ww-r-md)] px-3.5 text-[13px] font-medium text-[var(--ww-text-2)]"
          >
            <CheckCheck size={15} aria-hidden="true" />
            {t('markAllRead')}
          </button>
        )}
      </header>

      {/* Skeleton shaped like the real rows, matching /home and /friends — a centred spinner
          collapsed the page height and made the list jump into place once data landed. */}
      {isLoading && (
        <div className="ww-card overflow-hidden" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-b border-[var(--ww-line)] px-4 py-3.5 last:border-0"
            >
              <div className="skeleton h-8 w-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="skeleton h-3 w-2/5 rounded" />
                <div className="skeleton h-2.5 w-4/5 rounded" />
                <div className="skeleton h-2 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && !isLoading && <EmptyState text={t('loadError')} />}

      {!isLoading && !isError && (!notifications || notifications.length === 0) && (
        <EmptyState text={t('empty')} />
      )}

      {!isLoading && !isError && notifications && notifications.length > 0 && (
        <ul className="ww-card overflow-hidden">
          {notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onRead={(id) => markRead.mutate(id)}
              onDelete={(id) => deleteNotif.mutate(id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
