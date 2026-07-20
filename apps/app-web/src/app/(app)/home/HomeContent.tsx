'use client';

import { useState } from 'react';
import { Plus, LogIn, WifiOff, RefreshCw, Play, TrendingUp } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { useTranslations } from 'next-intl';
import { useRooms } from '@/hooks/use-rooms';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { RoomCard } from '@/components/rooms/RoomCard';
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog';
import { JoinRoomDialog } from '@/components/rooms/JoinRoomDialog';
import { trackClick } from '@/lib/analytics';
import type { IWatchPartyRoom } from '@/types';

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function RecentRoomCard({ room }: { room: IWatchPartyRoom }) {
  const router = useRouter();
  const isActive = String(room.status) === 'active';

  return (
    <button
      onClick={() => { trackClick('home:open_recent_room'); router.push(`/room/${room._id}`); }}
      className="group flex-shrink-0 w-48 rounded-xl overflow-hidden border border-white/[0.06] hover:border-violet-500/30 transition-all duration-200 text-left cursor-pointer"
      style={{ background: 'rgba(10,10,18,0.9)' }}
    >
      <div className="relative aspect-video bg-[#0D0D1F] overflow-hidden">
        {room.videoThumbnail ? (
          <img src={room.videoThumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f0d1f,#1a1030)' }}>
            <Play size={16} className="text-zinc-600 ml-0.5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        {isActive && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: '#E53E3E' }}>
            LIVE
          </div>
        )}
        <span className="absolute bottom-1.5 right-1.5 text-[9px] text-white/50">{timeAgo(room.createdAt)}</span>
      </div>
      <div className="px-2.5 py-2">
        <p className="text-[12px] font-medium text-white truncate leading-snug">{room.name ?? room.videoTitle ?? '—'}</p>
        {room.videoPlatform && (
          <p className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-wide">{room.videoPlatform}</p>
        )}
      </div>
    </button>
  );
}

function SectionHeader({
  label,
  count,
  live = false,
}: {
  label: string;
  count?: number;
  live?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      {live && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      {count !== undefined && (
        <span className="text-[11px] text-zinc-600">{count}</span>
      )}
    </div>
  );
}

export function HomeContent() {
  const t = useTranslations('home');
  const shouldReduceMotion = useReducedMotion();
  const { data: rooms, isLoading, isError } = useRooms();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: recentRooms } = useQuery<IWatchPartyRoom[]>({
    queryKey: ['rooms-recent'],
    queryFn: async () => {
      const res = await fetch('/api/rooms/recent', { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json() as { data?: IWatchPartyRoom[] };
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 30_000,
  });

  const activeRooms = rooms?.filter((r) => String(r.status) === 'active') ?? [];
  const idleRooms = rooms?.filter((r) => String(r.status) !== 'active') ?? [];
  const hasRooms = !isLoading && !isError && rooms && rooms.length > 0;
  const totalViewers = activeRooms.reduce((sum, r) => sum + (r.members?.length ?? 0), 0);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">

      {/* ── Header + actions ── */}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div>
          <h1 className="text-lg font-semibold text-white">
            {user?.username ?? 'WeWatch'}
          </h1>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={() => { trackClick('home:open_join_dialog'); setJoinOpen(true); }}
            className="h-8 px-3.5 rounded-md text-xs font-medium text-zinc-300 border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all cursor-pointer flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <LogIn size={12} />
            {t('join')}
          </button>
          <button
            onClick={() => { trackClick('home:open_create_dialog'); setCreateOpen(true); }}
            className="h-8 px-3.5 rounded-md text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors cursor-pointer flex items-center gap-1.5 active:scale-[0.97]"
          >
            <Plus size={12} />
            {t('create')}
          </button>
        </div>
      </div>

      {/* ── Quick stats (only when there's data) ── */}
      {hasRooms && (
        <div className="liquid-glass">
          <div className="grid grid-cols-3 divide-x divide-white/[0.06] px-6 py-4">
            {[
              { label: 'Rooms', value: rooms?.length ?? 0 },
              { label: 'Live', value: activeRooms.length },
              { label: 'Viewers', value: totalViewers },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <p className="text-2xl font-bold text-violet-400 leading-none">{value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent rooms ── */}
      {recentRooms && recentRooms.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionHeader label={t('recentRooms')} />
          <div className="liquid-glass-sm p-3">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {recentRooms.map((room) => (
                <RecentRoomCard key={room._id} room={room} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Loading — skeleton shaped like the real room grid (no layout shift once it
          resolves) instead of a bare spinner. .skeleton is the shimmer defined in
          globals.css — was already there, just never wired up to any page. ── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="liquid-glass-sm overflow-hidden">
              <div className="skeleton aspect-video" />
              <div className="px-3 py-2.5 flex flex-col gap-2">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-2.5 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <WifiOff size={24} className="text-zinc-700" />
          <div>
            <p className="text-white font-medium text-sm mb-1">{t('errorTitle')}</p>
            <p className="text-zinc-500 text-xs">{t('errorDesc')}</p>
          </div>
          <button
            onClick={() => { trackClick('home:retry'); qc.invalidateQueries({ queryKey: ['rooms'] }); }}
            className="h-8 px-4 rounded-md text-xs font-medium text-zinc-300 border border-white/[0.08] hover:bg-white/[0.06] transition-all flex items-center gap-2 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <RefreshCw size={12} />
            {t('retry')}
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !isError && (!rooms || rooms.length === 0) && (
        <div className="liquid-glass p-12 flex flex-col items-center gap-4 text-center">
          <TrendingUp size={28} className="text-violet-400/40" />
          <div className="flex flex-col gap-1">
            <p className="text-white font-semibold text-base">{t('empty')}</p>
            <p className="text-zinc-500 text-sm max-w-xs">{t('emptyDesc')}</p>
          </div>
          <button
            onClick={() => { trackClick('home:empty_state_create'); setCreateOpen(true); }}
            className="h-9 px-5 rounded-md text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 cursor-pointer active:scale-[0.97] transition-colors flex items-center gap-2 mt-1"
          >
            <Plus size={13} />
            {t('createFirst')}
          </button>
        </div>
      )}

      {/* ── LIVE NOW ── */}
      {hasRooms && activeRooms.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader label="Live Now" count={activeRooms.length} live />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeRooms.map((room, i) => (
              <motion.div
                key={room._id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut', delay: shouldReduceMotion ? 0 : Math.min(i * 0.04, 0.24) }}
              >
                <RoomCard room={room} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── ROOMS ── */}
      {hasRooms && idleRooms.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader label="Rooms" count={idleRooms.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {idleRooms.map((room, i) => (
              <motion.div
                key={room._id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut', delay: shouldReduceMotion ? 0 : Math.min(i * 0.04, 0.24) }}
              >
                <RoomCard room={room} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}
