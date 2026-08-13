'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { IUser } from '@/types';
import { avatarColor } from '@/lib/utils';
import { trackClick } from '@/lib/analytics';

interface Props {
  user: IUser;
  onMessage?: () => void;
}

/** Bitta do'st qatori. Ro'yxat `<ul>` bo'lgani uchun bu `<li>`. */
export function FriendCard({ user, onMessage }: Props) {
  const t = useTranslations('friends');
  // Rang endi lokal nusxadan emas, `lib/utils` dagi yagona manbadan — bir
  // foydalanuvchi sidebar, /home qatori va shu ro'yxatda bir xil rangda bo'ladi.
  const color = avatarColor(user._id ?? user.username ?? 'u');

  return (
    <li className="flex items-center gap-3 border-b border-[var(--ww-line)] px-4 py-3 transition-colors last:border-0 hover:bg-[var(--ww-surface-1)]">
      <span className="relative shrink-0">
        <span
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-[13.5px] font-semibold"
          style={{ background: `${color}2E`, border: `1px solid ${color}59`, color }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (user.username?.[0]?.toUpperCase() ?? '?')
          )}
        </span>
        {user.isOnline && (
          /* Chegara rangi sirt foniga teng — nuqta avatardan "kesib olingan"
             ko'rinadi, ustiga yopishtirilgan emas */
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--ww-bg)] bg-[var(--ww-online)]"
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-[var(--ww-text)]">{user.username}</p>
        {user.isOnline && (
          /* Ilgari bu joyda tarjimasiz "Online" turardi (prod audit 2026-08-01) */
          <p className="mt-0.5 text-[11.5px] text-[var(--ww-online)]">{t('online')}</p>
        )}
      </div>

      {onMessage && (
        <button
          type="button"
          onClick={() => { trackClick('friend_card:message'); onMessage(); }}
          className="ww-btn-subtle flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--ww-r-sm)] px-3 text-[12.5px] font-medium text-[var(--ww-text-2)]"
        >
          <MessageCircle size={14} aria-hidden="true" />
          {t('message')}
        </button>
      )}
    </li>
  );
}
