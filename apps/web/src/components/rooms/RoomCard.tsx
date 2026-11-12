'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Users, Play } from 'lucide-react';
import { useRelativeTime } from '@/lib/relative-time';
import type { IWatchPartyRoom } from '@/types';

interface Props {
  room: IWatchPartyRoom;
  /** Gorizontal qatorlar uchun ixcham variant (so'nggi xonalar) */
  compact?: boolean;
}

// Platforma rangi — foydalanuvchi manbani belgidan emas, rangdan darrov taniydi
const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  vk: '#0077FF',
  rutube: '#FF6600',
};

export function RoomCard({ room, compact = false }: Props) {
  const t = useTranslations('party');
  const tHome = useTranslations('home');
  const timeAgo = useRelativeTime();

  const memberCount = room.members?.length ?? 0;
  const isActive = String(room.status) === 'active';
  const platform = room.videoPlatform?.toLowerCase() ?? '';
  const platformColor = PLATFORM_COLORS[platform] ?? 'var(--ww-accent)';

  return (
    <Link
      href={`/room/${room._id}`}
      className="ww-card group flex h-full flex-col overflow-hidden"
    >
      {/* Poster — 16:9 */}
      <div className="relative aspect-video overflow-hidden bg-[#0B0916]">
        {room.videoThumbnail ? (
          <img
            src={room.videoThumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#141026 0%,#0B0916 100%)' }}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: `${platformColor}1F`, border: `1px solid ${platformColor}38` }}
            >
              <Play size={17} style={{ color: platformColor }} aria-hidden="true" />
            </span>
          </div>
        )}

        {/* Pastki qorong'ilashtirish — a'zolar soni o'qilishi uchun */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent"
        />

        {/* Hover — ijro tugmasi */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(124,58,237,0.85)] backdrop-blur-sm">
            <Play size={16} fill="white" className="ml-0.5 text-white" aria-hidden="true" />
          </span>
        </div>

        {/* LIVE — pulsli nuqta bilan, statik yorliq emas */}
        {isActive && (
          <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full border border-[rgba(255,59,78,0.4)] bg-[rgba(20,6,10,0.78)] px-2.5 py-1 backdrop-blur-md">
            <span className="ww-live-dot !h-1.5 !w-1.5" aria-hidden="true" />
            <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--ww-live)]">
              {t('live')}
            </span>
          </div>
        )}

        {room.videoPlatform && (
          <span
            className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
            style={{ background: `${platformColor}D9` }}
          >
            {room.videoPlatform}
          </span>
        )}

        <span className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[11px] font-medium text-white/85">
          <Users size={11} aria-hidden="true" />
          {memberCount}
        </span>

        {compact && (
          <span className="absolute bottom-2 right-2.5 max-w-[60%] truncate text-[10px] text-white/55">
            {timeAgo(room.createdAt)}
          </span>
        )}
      </div>

      {/* Matn qismi */}
      <div className="flex flex-1 flex-col gap-0.5 px-3 py-2.5">
        <p className="truncate text-[13.5px] font-semibold leading-snug text-[var(--ww-text)]">
          {room.name ?? room.videoTitle ?? tHome('title')}
        </p>
        {!compact && room.videoTitle && room.name && (
          <p className="truncate text-[11.5px] leading-tight text-[var(--ww-text-3)]">
            {room.videoTitle}
          </p>
        )}
        <p className="mt-0.5 text-[11px]">
          {isActive ? (
            <span className="font-medium text-[var(--ww-live)]">
              {tHome('watchingNow', { count: memberCount })}
            </span>
          ) : (
            <span className="text-[var(--ww-text-4)]">{t('idle')}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
