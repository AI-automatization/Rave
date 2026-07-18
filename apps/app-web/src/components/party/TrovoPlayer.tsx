'use client';

// WeWatch Web — Synced Trovo player (official Trovo.TrovoPlayer JS API).
//
// NOT YET LIVE: embedding requires a whitelisted domain (Trovo requires manual approval, unlike
// Twitch's self-service `parent` param) — app.wewatch.uz whitelist request submitted
// 2026-07-18 to developer@trovo.live, reply SLA up to 1 week. This component is ready to go the
// moment approval lands; until then any Trovo URL will fail to load.
//
// Real limitation, confirmed from Trovo's own docs (developer.trovo.live/docs/Embedded.html):
// the player object exposes play()/pause()/getCurrentTime()/getDuration() but NO seek/
// setCurrentTime method at all. So unlike every other platform here, there is no way to force a
// viewer to jump to a specific timestamp — no catch-up, no drift correction. Sync is therefore
// play/pause-only: everyone starts/stops together, but a viewer who falls behind (buffering,
// late join) has no way to be brought back in sync programmatically. This matches Trovo's own
// framing of the player as stream-oriented ("Begins playing the live stream") even for VODs.

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';

interface Props {
  streamername: string;
  isOwner: boolean;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
}

interface TrovoPlayerHandle {
  play(): void;
  pause(): void;
  getPlayerState(): string;
  getCurrentTime(): number;
}
interface TrovoNamespace {
  TrovoPlayer: new (elId: string, opts: Record<string, unknown>) => TrovoPlayerHandle;
}
declare global {
  interface Window { Trovo?: TrovoNamespace }
}

let trovoApiPromise: Promise<TrovoNamespace> | null = null;
function loadTrovoApi(): Promise<TrovoNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.Trovo) return Promise.resolve(window.Trovo);
  if (trovoApiPromise) return trovoApiPromise;
  trovoApiPromise = new Promise<TrovoNamespace>((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = 'https://cdn.trovo.live/embed/iframeApi.js';
    tag.onload = () => { if (window.Trovo) resolve(window.Trovo); else reject(new Error('Trovo SDK failed to init')); };
    tag.onerror = () => reject(new Error('Trovo SDK failed to load'));
    document.head.appendChild(tag);
  });
  return trovoApiPromise;
}

export function TrovoPlayer({ streamername, isOwner, onPlay, onPause }: Props) {
  const syncState = useWatchPartyStore((s) => s.syncState);

  const playerRef = useRef<TrovoPlayerHandle | null>(null);
  const hostId = useRef(`trovo-embed-${Math.random().toString(36).slice(2)}`).current;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRemoteAction = useRef(false);
  const isOwnerRef = useRef(isOwner);   isOwnerRef.current = isOwner;
  const onPlayRef = useRef(onPlay);     onPlayRef.current = onPlay;
  const onPauseRef = useRef(onPause);   onPauseRef.current = onPause;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    loadTrovoApi().then((Trovo) => {
      if (cancelled) return;
      const player = new Trovo.TrovoPlayer(hostId, {
        width: '100%', height: '100%',
        streamername,
        enablejsapi: true,
        origin: window.location.origin,
        events: {
          onReady() { if (!cancelled) { playerRef.current = player; setReady(true); } },
          onStateChange(state: string) {
            if (!isOwnerRef.current || isRemoteAction.current) return;
            if (state === 'playing') onPlayRef.current(0);
            else if (state === 'pause' || state === 'ended') onPauseRef.current(0);
          },
        },
      });
    }).catch(() => {
      if (!cancelled) setError('Trovo embed недоступен — домен ожидает подтверждения Trovo');
    });

    return () => { cancelled = true; playerRef.current = null; };
  }, [streamername, hostId]);

  // Viewer: play/pause only — Trovo's API has no seek, so no drift correction is possible.
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || isOwner || !p) return;
    isRemoteAction.current = true;
    if (syncState.isPlaying) p.play(); else p.pause();
    const clear = setTimeout(() => { isRemoteAction.current = false; }, 400);
    return () => clearTimeout(clear);
  }, [ready, isOwner, syncState.isPlaying]);

  if (error) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-slate-300 text-sm font-medium">Не удалось загрузить видео</p>
        <p className="text-slate-500 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <div id={hostId} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  );
}
