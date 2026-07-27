'use client';

// WeWatch Web — Synced Rutube player (official rutube.ru/play/embed/ postMessage protocol).
//
// Protocol verified live (2026-07-19, headless Playwright against a real video) before writing
// this — mobile's buildRutubeHtml() (WebViewAdapters.ts) assumed a `{method, value}` command
// shape that turned out to not exist; Rutube only reacts to `{type:'player:<action>', data}`:
//   outgoing: {type:'player:play'} / {type:'player:pause'} /
//             {type:'player:setCurrentTime', data:{time}}  — all confirmed to actually move the
//             player (seekTo/seek/event:pause and the old {method,...} shape did nothing)
//   incoming: player:ready, player:changeState ({state, isPlaying}), player:currentTime
//             ({time, duration}) — rich and reliable, unlike VK's embed which sends nothing at all
//
// Previously Rutube had no dedicated player and fell through to content-service's server-side
// yt-dlp extraction, which Rutube blocks from Railway's datacenter IP (options JSON returns 404
// there, 200 from a residential IP — confirmed by direct comparison). Routing through the
// official client-side embed instead sidesteps that IP-block entirely, same reasoning as VK/
// Twitch/etc in T-S137.

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
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

interface RutubeMessage {
  type?: string;
  data?: { state?: string; isPlaying?: boolean; time?: number; currentTime?: number; duration?: number };
}

const RUTUBE_DRIFT_HARD_SEEK_SECS = 1.2;
const MAX_COMPENSATION_SECS = 30;
const LOAD_TIMEOUT_MS = 15000;

export function RutubePlayer({ videoId, isOwner, onPlay, onPause, onSeek, onHeartbeat }: Props) {
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const t = useTranslations('party');
  const [ready, setReady] = useState(false);
  // Holds a message KEY, not text — the error follows the language switcher and effects
  // never need `t` in their dependency list.
  const [error, setError] = useState<string | null>(null);

  // true while WE are applying a remote change, so the resulting Rutube event isn't re-broadcast
  // (echo loop). Mirrors isRemoteAction in the other synced embed players.
  const isRemoteAction = useRef(false);
  const currentTimeRef = useRef(0);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isOwnerRef = useRef(isOwner);   isOwnerRef.current = isOwner;
  const onPlayRef = useRef(onPlay);     onPlayRef.current = onPlay;
  const onPauseRef = useRef(onPause);   onPauseRef.current = onPause;
  const onSeekRef = useRef(onSeek);     onSeekRef.current = onSeek;
  const onHeartbeatRef = useRef(onHeartbeat); onHeartbeatRef.current = onHeartbeat;

  function sendCmd(type: string, data?: object) {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type, ...(data ? { data } : {}) }), '*');
  }

  useEffect(() => {
    setReady(false);
    setError(null);
    currentTimeRef.current = 0;

    const timeoutId = setTimeout(() => {
      setReady((r) => {
        if (!r) setError('playerEmbedBlocked');
        return r;
      });
    }, LOAD_TIMEOUT_MS);

    const startHeartbeat = () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (isOwnerRef.current) onHeartbeatRef.current(currentTimeRef.current);
      }, 1000);
    };

    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      let msg: RutubeMessage;
      try {
        msg = (typeof e.data === 'string' ? JSON.parse(e.data) : e.data) as RutubeMessage;
      } catch { return; }
      const d = msg.data ?? {};
      const time = d.currentTime ?? d.time;
      if (typeof time === 'number') currentTimeRef.current = time;

      switch (msg.type) {
        case 'player:ready':
          clearTimeout(timeoutId);
          setReady(true);
          startHeartbeat();
          break;
        case 'player:changeState':
          if (!isOwnerRef.current || isRemoteAction.current) break;
          if (d.state === 'playing') onPlayRef.current(currentTimeRef.current);
          else if (d.state === 'pause') onPauseRef.current(currentTimeRef.current);
          else if (d.state === 'seeked') onSeekRef.current(currentTimeRef.current);
          break;
        default:
          break;
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeoutId);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, [videoId]);

  // ── Viewer: apply incoming syncState (play/pause/seek) ────────────────────────
  useEffect(() => {
    if (!ready || isOwner) return;

    isRemoteAction.current = true;

    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;

    if (Math.abs(currentTimeRef.current - target) > 0.5) {
      sendCmd('player:setCurrentTime', { time: target });
      currentTimeRef.current = target;
    }
    sendCmd(syncState.isPlaying ? 'player:play' : 'player:pause');

    const clear = setTimeout(() => { isRemoteAction.current = false; }, 400);
    return () => clearTimeout(clear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isOwner, syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp]);

  // ── Viewer: drift correction from heartbeat (hard-seek only) ──────────────────
  useEffect(() => {
    if (!ready || isOwner || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    if (Math.abs(expected - currentTimeRef.current) > RUTUBE_DRIFT_HARD_SEEK_SECS) {
      isRemoteAction.current = true;
      sendCmd('player:setCurrentTime', { time: expected });
      currentTimeRef.current = expected;
      setTimeout(() => { isRemoteAction.current = false; }, 400);
    }
  }, [ready, isOwner, heartbeat, syncState.isPlaying]);

  if (error) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-slate-300 text-sm font-medium">{t('playerLoadFailed')}</p>
        <p className="text-slate-500 text-xs">{t(error, { platform: 'Rutube' })}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        ref={iframeRef}
        src={`https://rutube.ru/play/embed/${videoId}?autoplay=1`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      />
      {/* Rutube's embed has no documented param to disable its own native controls (unlike
          YouTube's controls=0) — block pointer events for non-owners so a viewer's own click
          can't desync the room, mirroring the same fix applied to VKPlayer. */}
      {!isOwner && <div className="absolute inset-0" />}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  );
}
