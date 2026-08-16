'use client';

/**
 * Do'stlar qatori — onlaynlar birinchi.
 *
 * Nega bosh sahifada: mahsulotning butun ma'nosi birga tomosha qilishda
 * (brief: "Диван на двоих. Экраны разные"). Yolg'iz foydalanuvchi uchun
 * ilova qiymatsiz, shuning uchun "kim hozir bor" savoli bosh ekranning
 * markaziy savoli bo'lishi kerak — do'stlar sahifasiga yashirilgan emas.
 *
 * `useFriends()` har 20 soniyada yangilanadi (web'da presence uchun socket
 * hali yo'q — hooks/use-friends.ts dagi izohga qarang), demak yashil nuqta
 * o'zidan-o'zi yangilanib turadi.
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { UserPlus } from 'lucide-react';
import { useFriends } from '@/hooks/use-friends';
import { avatarColor } from '@/lib/utils';
import type { IUser } from '@/types';

const MAX_SHOWN = 8;

function FriendAvatar({ user }: { user: IUser }) {
  const color = avatarColor(user._id ?? user.username ?? 'u');

  return (
    <Link
      href={`/messages?user=${user._id}`}
      className="group flex w-[58px] shrink-0 flex-col items-center gap-1.5"
    >
      <span className="relative">
        <span
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-[15px] font-semibold transition-transform duration-200 group-hover:scale-105"
          style={{ background: `${color}2E`, border: `1px solid ${color}59`, color }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (user.username?.[0]?.toUpperCase() ?? '?')
          )}
        </span>
        {user.isOnline && (
          /* border rangi sahifa foniga teng — nuqta avatardan "kesib olingan"
             ko'rinadi, ustiga yopishtirilgan emas */
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--ww-bg)] bg-[var(--ww-online)]" />
        )}
      </span>
      <span className="w-full truncate text-center text-[11px] text-[var(--ww-text-3)]">
        {user.username}
      </span>
    </Link>
  );
}

export function FriendsRail() {
  const t = useTranslations('home');
  const { data: friends } = useFriends();

  if (!friends) return null;

  // Onlaynlar oldinda — qatorning boshi eng qimmatli joy
  const sorted = [...friends].sort(
    (a, b) => Number(Boolean(b.isOnline)) - Number(Boolean(a.isOnline)),
  );
  const shown = sorted.slice(0, MAX_SHOWN);

  if (shown.length === 0) {
    return (
      <div className="ww-card flex items-center gap-4 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ww-accent-soft)]">
          <UserPlus size={18} aria-hidden="true" className="text-[var(--ww-accent-hi)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--ww-text)]">{t('inviteFriends')}</p>
          <p className="mt-0.5 text-[12.5px] text-[var(--ww-text-3)]">{t('inviteFriendsDesc')}</p>
        </div>
        <Link
          href="/friends"
          className="ww-btn-subtle shrink-0 rounded-[var(--ww-r-md)] px-4 py-2 text-[13px] font-medium text-[var(--ww-text)]"
        >
          {t('addFriend')}
        </Link>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-[var(--ww-text-2)]">{t('yourFriends')}</h2>
        <Link
          href="/friends"
          className="-my-1.5 py-1.5 text-[12.5px] text-[var(--ww-text-3)] transition-colors hover:text-[var(--ww-text)]"
        >
          {t('seeAll')} ›
        </Link>
      </div>

      <div className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {shown.map((f) => (
          <FriendAvatar key={f._id} user={f} />
        ))}
        <Link
          href="/friends"
          className="group flex w-[58px] shrink-0 flex-col items-center gap-1.5"
          aria-label={t('addFriend')}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[var(--ww-line-strong)] text-[var(--ww-text-4)] transition-colors group-hover:border-[var(--ww-accent-hi)] group-hover:text-[var(--ww-accent-hi)]">
            <UserPlus size={17} aria-hidden="true" />
          </span>
          <span className="w-full truncate text-center text-[11px] text-[var(--ww-text-4)]">
            {t('addFriend')}
          </span>
        </Link>
      </div>
    </section>
  );
}
