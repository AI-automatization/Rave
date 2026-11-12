'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Play, Users } from 'lucide-react';
import { roomsApi } from '@/lib/api/rooms.api';
import { ApiError } from '@/lib/api-client';
import { toast } from '@/store/toast.store';
import { trackClick } from '@/lib/analytics';

interface WatchItem {
  sourceUrl: string;
  title: string | null;
  thumbnail: string | null;
  platform: string | null;
  viewers?: number;
  lastWatchedAt?: string;
}

/**
 * One tap from a movie to a room playing it. With an already-open room (backend allows one per
 * owner) the movie is handed to that room instead via ?play= (RoomContent switches to it).
 */
export function useStartWatching() {
  const router = useRouter();
  const t = useTranslations('home');
  const [startingUrl, setStartingUrl] = useState<string | null>(null);

  async function start(item: Pick<WatchItem, 'sourceUrl' | 'title' | 'thumbnail'>) {
    if (startingUrl) return;
    setStartingUrl(item.sourceUrl);
    try {
      const res = await roomsApi.create({
        name: item.title ? item.title.slice(0, 60) : undefined,
        videoUrl: item.sourceUrl,
        videoTitle: item.title ?? undefined,
        videoThumbnail: item.thumbnail ?? undefined,
        isPrivate: true,
      });
      const id = res.data?._id;
      if (id) router.push(`/room/${id}`);
    } catch (err) {
      const roomId = err instanceof ApiError && err.status === 409
        ? (err.data as { data?: { roomId?: string } })?.data?.roomId
        : undefined;
      if (roomId) {
        router.push(`/room/${roomId}?play=${encodeURIComponent(item.sourceUrl)}`);
        return;
      }
      toast.error(t('watchStartError'));
    } finally {
      setStartingUrl(null);
    }
  }

  return { start, startingUrl };
}

export function WatchRail({ kind }: { kind: 'trending' | 'history' }) {
  const t = useTranslations('home');
  const { start, startingUrl } = useStartWatching();
  const { data: items = [] } = useQuery<WatchItem[]>({
    queryKey: ['watch-rail', kind],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${kind}`, { credentials: 'include' });
      if (!res.ok) return [];
      const body = (await res.json()) as { data?: WatchItem[] };
      return Array.isArray(body.data) ? body.data : [];
    },
    staleTime: 60_000,
  });

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4" data-testid={`rail-${kind}`}>
      <h2 className="text-[13px] font-semibold text-[var(--ww-text-2)]">
        {kind === 'trending' ? t('weeklyTop') : t('watchHistory')}
      </h2>
      <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {items.map((item, i) => (
          <button
            key={item.sourceUrl}
            type="button"
            onClick={() => { trackClick(`home:${kind}_start`); void start(item); }}
            className="ww-card group relative w-56 shrink-0 cursor-pointer overflow-hidden text-left"
          >
            <div className="relative aspect-video bg-[var(--ww-surface-2)]">
              {item.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
              {kind === 'trending' && (
                <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[12px] font-bold text-white">
                  #{i + 1}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                {startingUrl === item.sourceUrl
                  ? <Loader2 size={28} className="animate-spin text-white" />
                  : <Play size={28} className="text-white opacity-0 transition-opacity group-hover:opacity-100" fill="white" />}
              </span>
            </div>
            <div className="flex flex-col gap-1 px-3 py-2.5">
              <span className="line-clamp-2 text-[13px] font-medium text-[var(--ww-text)]">{item.title ?? item.sourceUrl}</span>
              {kind === 'trending' && item.viewers !== undefined && (
                <span className="flex items-center gap-1 text-[11px] text-[var(--ww-text-3)]">
                  <Users size={11} aria-hidden="true" /> {t('weeklyViewers', { count: item.viewers })}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
