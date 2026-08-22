'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { trackClick } from '@/lib/analytics';
import type { IWatchPartyRoom } from '@/types';

// 2026-08-22, Pro "continue watching" — rooms that auto-closed with a captured frame + position
// (see watchParty.service.ts's closeRoomBySystem) show up here instead of just disappearing.
// Free-owned rooms never appear (server never marks them resumable in the first place), so this
// component doesn't need its own plan check — an empty/absent list is the correct Free-tier state.

function formatPosition(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export function ContinueWatchingRail() {
  const t = useTranslations('home');
  const router = useRouter();
  const qc = useQueryClient();

  const { data: rooms } = useQuery<IWatchPartyRoom[]>({
    queryKey: ['rooms-resumable'],
    queryFn: async () => {
      const res = await fetch('/api/rooms/resumable', { credentials: 'include' });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: IWatchPartyRoom[] };
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 30_000,
  });

  const resumeMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`/api/rooms/${roomId}/resume`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('resume_failed');
      const data = (await res.json()) as { data: IWatchPartyRoom };
      return data.data;
    },
    onSuccess: (newRoom) => {
      void qc.invalidateQueries({ queryKey: ['rooms-resumable'] });
      router.push(`/room/${newRoom._id}`);
    },
  });

  if (!rooms || rooms.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-[13px] font-semibold text-[var(--ww-text-2)]">{t('continueWatching')}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {rooms.map((room) => (
          <button
            key={room._id}
            type="button"
            disabled={resumeMutation.isPending}
            onClick={() => {
              trackClick('home:continue_watching');
              resumeMutation.mutate(room._id);
            }}
            className="ww-card group flex w-48 shrink-0 flex-col overflow-hidden text-left cursor-pointer disabled:opacity-50"
          >
            <div className="relative aspect-video overflow-hidden bg-[#0B0916]">
              {room.lastFrame ? (
                // eslint-disable-next-line @next/next/no-img-element -- small base64 data URL, not a real optimizable asset
                <img src={room.lastFrame} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ background: 'linear-gradient(135deg,#141026 0%,#0B0916 100%)' }} />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                <Play size={22} className="text-white opacity-0 transition-opacity group-hover:opacity-100" fill="currentColor" />
              </div>
              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                {formatPosition(room.currentTime)}
              </span>
            </div>
            <p className="truncate px-2 py-2 text-[13px] font-medium text-[var(--ww-text)]">
              {room.videoTitle ?? room.name ?? t('untitledRoom')}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
