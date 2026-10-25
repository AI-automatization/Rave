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
import { useTranslations } from 'next-intl';
import { AlertCircle, Loader2, VolumeX } from 'lucide-react';
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
  mute(): void;
  unMute(): void;
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
// Values are message KEYS (messages/*.json → party.*) — this map is module-level, outside any
// component, so it cannot call the translator itself.
const YT_ERROR_KEYS: Record<number, string> = {
  2: 'playerYtBadUrl',
  5: 'playerYtInternal',
  100: 'playerYtNotFound',
  101: 'playerYtEmbedForbidden',
  150: 'playerYtEmbedForbidden',
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
  const t = useTranslations('party');
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  // Holds a message KEY, not text — the error follows the language switcher and effects
  // never need `t` in their dependency list.
  const [error, setError] = useState<string | null>(null);

  // true while WE are applying a remote change, so the resulting state-change events aren't
  // re-broadcast (echo loop). Mirrors isRemoteAction in the native path.
  const isRemoteAction = useRef(false);
  // Last non-BUFFERING state. A viewer's PLAYING whose previous settled state was already PLAYING
  // (PLAYING→BUFFERING→PLAYING) is a stall recovery or the end of a scrub, not a "play" tap —
  // broadcasting it would let a laggy viewer drag the room back. PAUSED→BUFFERING→PLAYING is a tap.
  const lastSettledRef = useRef<number | null>(null);
  const lastPolledTime = useRef(0);
  // Phones (iOS Safari above all) refuse a remote playVideo() with sound until the viewer has
  // touched the page — the owner pressed play and the phone just sat there (real report
  // 2026-10-24: "laptopdan start bosdim, telefonda ko'rsatmadi"). Muted playback IS allowed, so
  // the viewer falls back to it and gets a one-tap "turn sound on" button.
  const [mutedFallback, setMutedFallback] = useState(false);
  const mutedFallbackRef = useRef(false);

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
        playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => { if (!cancelled) setReady(true); },
          onStateChange: (e: YTPlayerEvent) => {
            // Any member's play/pause is broadcast (server accepts it since 2026-10-25: "hohlagan
            // a'zo stop/start qila olsin"). Changes we applied ourselves (isRemoteAction) are not.
            const prevSettled = lastSettledRef.current;
            if (e.data !== YT.PlayerState.BUFFERING) lastSettledRef.current = e.data;
            if (isRemoteAction.current) return;
            const p = playerRef.current;
            if (!p) return;
            if (e.data === YT.PlayerState.PLAYING) {
              if (!isOwnerRef.current && prevSettled === YT.PlayerState.PLAYING) return;
              onPlayRef.current(p.getCurrentTime());
            }
            // A pause while the tab is hidden is the browser/OS (screen lock, app switch), not the
            // person — it must not pause the whole room.
            else if (e.data === YT.PlayerState.PAUSED && document.visibilityState !== 'hidden') {
              onPauseRef.current(p.getCurrentTime());
            }
          },
          // Without this, a video that fails to embed (private/removed/embedding-disabled) never
          // fires onReady either — the loading spinner spun forever with zero feedback (reported
          // live: "видео с youtube не приходит просто крутится").
          onError: (e: YTPlayerEvent) => {
            if (cancelled) return;
            setError(YT_ERROR_KEYS[e.data] ?? 'playerLoadFailed');
          },
        },
      });
      playerRef.current = player;
    }).catch(() => { if (!cancelled) setError('playerSdkFailed'); });

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

  // Viewer play that the browser may silently block: re-check shortly after and fall back to muted.
  const viewerPlay = (p: YTPlayer) => {
    p.playVideo();
    if (mutedFallbackRef.current) return;
    setTimeout(() => {
      const YTS = window.YT?.PlayerState;
      const state = p.getPlayerState();
      if (state === (YTS?.PLAYING ?? 1) || state === (YTS?.BUFFERING ?? 3)) return;
      if (!useWatchPartyStore.getState().syncState.isPlaying) return;
      mutedFallbackRef.current = true;
      setMutedFallback(true);
      // Our own retry of the room's play — its PLAYING event must not be re-broadcast (it would
      // carry a position ~1.5s behind the room and pull everyone back).
      isRemoteAction.current = true;
      setTimeout(() => { isRemoteAction.current = false; }, 1500);
      p.mute();
      p.playVideo();
    }, 1500);
  };

  const unmute = () => {
    const p = playerRef.current;
    if (!p) return;
    p.unMute();
    if (useWatchPartyStore.getState().syncState.isPlaying) p.playVideo();
    mutedFallbackRef.current = false;
    setMutedFallback(false);
  };

  // ── Everyone: apply incoming syncState (play/pause/seek) ──────────────────────
  // Owner included now — another member may have paused/played. The owner's own taps also land
  // here (sendPlay/sendPause update the store locally) and are no-ops: the player is already in
  // that state at that position.
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || !p) return;

    isRemoteAction.current = true;

    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;

    if (Math.abs(p.getCurrentTime() - target) > 0.5) {
      p.seekTo(target, true);
    }
    const YTS = window.YT?.PlayerState;
    const state = p.getPlayerState();
    const playing = state === (YTS?.PLAYING ?? 1) || state === (YTS?.BUFFERING ?? 3);
    if (syncState.isPlaying && !playing) viewerPlay(p);
    else if (!syncState.isPlaying && playing) p.pauseVideo();

    const clear = setTimeout(() => { isRemoteAction.current = false; }, 400);
    return () => clearTimeout(clear);
  }, [ready, syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp]);

  // ── Viewer: drift correction from heartbeat (time AND play/pause state) ─────
  //
  // Found 2026-08-02 (real report: two viewers, each playing the same YouTube video
  // "differently" with no obvious cause): this effect only ever corrected TIME drift.
  // YouTube's stock IFrame chrome still lets a viewer toggle play/pause by clicking the
  // video area itself even with `controls: 0` (that param only hides the scrubber/buttons,
  // not the click-to-toggle behavior) — and browsers also auto-pause backgrounded video on
  // their own. Either way, once a viewer's LOCAL player state disagreed with syncState.isPlaying,
  // nothing here ever noticed, because the sync-apply effect above only re-runs when syncState
  // itself changes (i.e. the OWNER does something new) — a viewer's own stray click never
  // touches the store, so if the owner was just sitting there playing with no new actions,
  // the desync persisted forever. Now every heartbeat tick also reconciles play/pause state,
  // not just position.
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || isOwner || !p || !heartbeat) return;

    const playerIsPlaying = p.getPlayerState() === (window.YT?.PlayerState.PLAYING ?? 1);
    if (playerIsPlaying !== syncState.isPlaying) {
      isRemoteAction.current = true;
      if (syncState.isPlaying) viewerPlay(p);
      else p.pauseVideo();
      setTimeout(() => { isRemoteAction.current = false; }, 400);
    }

    if (!syncState.isPlaying) return;
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
      {mutedFallback && !isOwner && !error && (
        <button
          type="button"
          onClick={unmute}
          data-testid="yt-unmute"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-sm cursor-pointer"
        >
          <VolumeX size={16} aria-hidden="true" />
          {t('playerTapForSound')}
        </button>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-[#0A0A12]">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-slate-300 text-sm font-medium">{t('playerLoadFailed')}</p>
          <p className="text-slate-500 text-xs">{t(error, { platform: 'YouTube' })}</p>
        </div>
      )}
    </div>
  );
}
