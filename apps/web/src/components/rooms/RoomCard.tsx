'use client';

import Link from 'next/link';
import { Users, Play } from 'lucide-react';
import type { IWatchPartyRoom } from '@/types';

interface Props {
  room: IWatchPartyRoom;
}

export function RoomCard({ room }: Props) {
  const memberCount = room.members?.length ?? 0;
  const isActive = String(room.status) === 'active';

  return (
    <Link
      href={`/room/${room._id}`}
      className="group card p-0 overflow-hidden hover:border-violet-500/30 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#0F0E1A] overflow-hidden">
        {room.videoThumbnail ? (
          <img
            src={room.videoThumbnail}
            alt={room.videoTitle ?? ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={32} className="text-slate-600" />
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
        }`}>
          {isActive ? 'Live' : 'Idle'}
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold text-white truncate">
          {room.name ?? room.videoTitle ?? 'Watch Party'}
        </h3>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {memberCount}
          </span>
          {room.videoTitle && (
            <span className="truncate">{room.videoTitle}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
