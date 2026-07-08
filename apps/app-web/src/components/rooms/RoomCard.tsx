'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Users, Play, Radio } from 'lucide-react';
import type { IWatchPartyRoom } from '@/types';

interface Props {
  room: IWatchPartyRoom;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  vk: '#0077FF',
  rutube: '#FF6600',
};

export function RoomCard({ room }: Props) {
  const t = useTranslations('party');
  const tHome = useTranslations('home');
  const memberCount = room.members?.length ?? 0;
  const isActive = String(room.status) === 'active';
  const platform = room.videoPlatform?.toLowerCase() ?? '';
  const platformColor = PLATFORM_COLORS[platform] ?? '#7C3AED';

  return (
    <Link
      href={`/room/${room._id}`}
      className="liquid-glass-sm group relative flex flex-col overflow-hidden cursor-pointer hover:border-violet-500/40 transition-all duration-200"
    >
      {/* Thumbnail — 16:9 */}
      <div className="relative aspect-video overflow-hidden bg-[#0D0D1F]">
        {room.videoThumbnail ? (
          <img
            src={room.videoThumbnail}
            alt={room.videoTitle ?? ''}
            className="w-full h-full object-cover transition-transform duration-350 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0f0d1f 0%, #1a1030 100%)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${platformColor}18`, border: `1px solid ${platformColor}30` }}>
              <Play size={20} style={{ color: platformColor }} className="ml-0.5" />
            </div>
          </div>
        )}

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/25">
          <div className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
            style={{ background: 'rgba(124,58,237,0.6)' }}>
            <Play size={16} fill="white" className="text-white ml-0.5" />
          </div>
        </div>

        {/* LIVE badge */}
        {isActive ? (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide text-white"
            style={{ background: '#E53E3E', boxShadow: '0 0 10px rgba(229,62,62,0.5)' }}>
            <Radio size={8} className="animate-pulse" />
            LIVE
          </div>
        ) : null}

        {/* Platform badge */}
        {room.videoPlatform && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white"
            style={{ background: `${platformColor}cc` }}>
            {room.videoPlatform}
          </div>
        )}

        {/* Member count — bottom left */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[11px] font-medium text-white/80">
          <Users size={11} />
          <span>{memberCount}</span>
        </div>
      </div>

      {/* Info row */}
      <div className="px-3 py-2.5 flex items-start gap-2.5">
        {/* Color dot */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${platformColor}20`, border: `1px solid ${platformColor}40` }}>
          <Play size={11} style={{ color: platformColor }} className="ml-0.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white leading-snug truncate">
            {room.name ?? room.videoTitle ?? tHome('title')}
          </p>
          {room.videoTitle && room.name && (
            <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-tight">{room.videoTitle}</p>
          )}
          <p className="text-[10px] text-slate-600 mt-0.5">
            {isActive ? (
              <span className="text-emerald-500">{t('live')} · {memberCount} {memberCount === 1 ? 'viewer' : 'viewers'}</span>
            ) : (
              <span>{t('idle')}</span>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
