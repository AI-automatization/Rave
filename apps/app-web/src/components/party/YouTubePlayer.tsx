'use client';

// WeWatch Web — Synced YouTube player (official IFrame Player API).
//
// The raw <iframe src=".../embed?enablejsapi=1"> renders a player but is NOT synchronised — the
// owner's play/pause/seek never reach followers. This wraps YT.Player so:
//   • Owner  — its own play/pause/seek + a 1s heartbeat are broadcast over the socket.
//   • Viewer — applies incoming syncState (seekTo/play/pause) and drift-corrects off the heartbeat.
//
// Why hard-seek (not playbackRate micro-correction like the native <video> path): YT only accepts
// the discrete rates [0.25,0.5,1,1.25,1.5,2] — a fractional 1.08 snaps to 1.0, so smooth catch-up
// is impossible. We hard-seek on meaningful drift and leave sub-second drift alone (same trade-off
// the mobile code documents for the YouTube IFrame case).

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';

interface Props {
  videoId: string;
  isOwner: boolean;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onHeartbeat: (time: number) => void;
}

// ── Minimal YT IFrame API typings (avoids pulling @types/youtube) ────────────────
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}
interface YTPlayerEvent { data: number }
interface YTNamespace {
  Player: new (el: HTMLElement | string, opts: {
    videoId: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: () => void;
      onStateChange?: (e: YTPlayerEvent) => void;
      onError?: (e: YTPlayerEvent) => void;
    };
  }) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; BUFFERING: number; ENDED: number };
}

// YouTube IFrame API onError codes: 2 = invalid videoId, 5 = HTML5 player error,
// 100 = video not found/removed/private, 101 & 150 = embedding disabled by the video owner.
const YT_ERROR_MESSAGES: Record<number, string> = {
  2: 'Некорректная ссылка на видео',
  5: 'Ошибка плеера',
  100: 'Видео не найдено или удалено',
  101: 'Владелец видео запретил встраивание',
  150: 'Владелец видео запретил встраивание',
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Load the IFrame API exactly once, shared across every player instance on the page.
let ytApiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<YTNamespace>((resolve) => {
    // Chain any pre-existing callback so we never clobber another loader.
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

// Drift thresholds (seconds). Micro playbackRate correction is impossible on YT (discrete rates),
// so we only hard-seek once drift is clearly visible, and ignore sub-second wobble.
const YT_DRIFT_HARD_SEEK_SECS = 1.2;
// Owner seek detection: getCurrentTime jumping more than this between 1s polls (beyond the ~1s of
// normal playback) is a scrub, not natural progress → broadcast a seek.
const YT_SEEK_JUMP_SECS = 2.0;
const MAX_COMPENSATION_SECS = 30;

export function YouTubePlayer({ videoId, isOwner, onPlay, onPause, onSeek, onHeartbeat }: Props) {
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // true while WE are applying a remote change, so the resulting state-change events aren't
  // re-broadcast (echo loop). Mirrors isRemoteAction in the native path.
  const isRemoteAction = useRef(false);
  const lastPolledTime = useRef(0);

  // Keep the latest callbacks/flags in refs so the player-init effect can stay mount-once.
  const isOwnerRef = useRef(isOwner);   isOwnerRef.current = isOwner;
  const onPlayRef = useRef(onPlay);     onPlayRef.current = onPlay;
  const onPauseRef = useRef(onPause);   onPauseRef.current = onPause;
  const onSeekRef = useRef(onSeek);     onSeekRef.current = onSeek;
  const onHeartbeatRef = useRef(onHeartbeat); onHeartbeatRef.current = onHeartbeat;

  // ── Create the player once per videoId ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;

      const player = new YT.Player(hostRef.current, {
        videoId,
        playerVars: { autoplay: 0, controls: isOwnerRef.current ? 1 : 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => { if (!cancelled) setReady(true); },
          onStateChange: (e: YTPlayerEvent) => {
            // Only the owner drives the room. Its play/pause become socket broadcasts; a viewer's
            // own state changes are ignored (they follow the owner).
            if (!isOwnerRef.current || isRemoteAction.current) return;
            const p = playerRef.current;
            if (!p) return;
            if (e.data === YT.PlayerState.PLAYING) onPlayRef.current(p.getCurrentTime());
            else if (e.data === YT.PlayerState.PAUSED) onPauseRef.current(p.getCurrentTime());
          },
          // Without this, a video that fails to embed (private/removed/embedding-disabled) never
          // fires onReady either — the loading spinner spun forever with zero feedback (reported
          // live: "видео с youtube не приходит просто крутится").
          onError: (e: YTPlayerEvent) => {
            if (cancelled) return;
            setError(YT_ERROR_MESSAGES[e.data] ?? 'Не удалось загрузить видео');
          },
        },
      });
      playerRef.current = player;
    }).catch(() => { if (!cancelled) setError('Не удалось загрузить YouTube плеер'); });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  // ── Owner: 1s heartbeat + seek detection ──────────────────────────────────────
  useEffect(() => {
    if (!ready || !isOwner) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const t = p.getCurrentTime();
      const playing = p.getPlayerState() === (window.YT?.PlayerState.PLAYING ?? 1);
      if (!playing) { lastPolledTime.current = t; return; }
      // A jump larger than one poll's worth of playback = the owner scrubbed → broadcast a seek.
      if (Math.abs(t - lastPolledTime.current) > YT_SEEK_JUMP_SECS) {
        onSeekRef.current(t);
      }
      lastPolledTime.current = t;
      onHeartbeatRef.current(t);
    }, 1000);
    return () => clearInterval(id);
  }, [ready, isOwner]);

  // ── Viewer: apply incoming syncState (play/pause/seek) ────────────────────────
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || isOwner || !p) return;

    isRemoteAction.current = true;

    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;

    if (Math.abs(p.getCurrentTime() - target) > 0.5) {
      p.seekTo(target, true);
    }
    if (syncState.isPlaying) p.playVideo();
    else p.pauseVideo();

    const clear = setTimeout(() => { isRemoteAction.current = false; }, 400);
    return () => clearTimeout(clear);
  }, [ready, isOwner, syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp]);

  // ── Viewer: drift correction from heartbeat (hard-seek only; YT can't micro-rate) ─────
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || isOwner || !p || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    if (Math.abs(expected - p.getCurrentTime()) > YT_DRIFT_HARD_SEEK_SECS) {
      isRemoteAction.current = true;
      p.seekTo(expected, true);
      setTimeout(() => { isRemoteAction.current = false; }, 400);
    }
  }, [ready, isOwner, heartbeat, syncState.isPlaying]);

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      {/* Unconditionally rendered — never removed from the tree based on ready/error state.
          new YT.Player(hostRef.current, ...) REPLACES this element with an iframe (documented
          YouTube IFrame API behavior, not something under our control) — if this div is ever
          swapped for a different JSX branch (e.g. an early `if (error) return <other tree>`),
          React tries to remove a node YouTube already silently replaced, throwing
          "NotFoundError: Failed to execute 'removeChild' ... not a child of this node" and
          crashing the whole room. Confirmed live (2026-07-20) with a video whose embedding is
          disabled: onError fires, error state was set, and the resulting tree swap crashed. */}
      <div ref={hostRef} className="w-full h-full" />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-[#0A0A12]">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-slate-300 text-sm font-medium">Не удалось загрузить видео</p>
          <p className="text-slate-500 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
