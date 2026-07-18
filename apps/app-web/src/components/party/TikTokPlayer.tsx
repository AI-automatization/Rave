'use client';

// WeWatch Web — Synced TikTok player (official tiktok.com/player/v1/{id} embed).
//
// Outgoing commands are confirmed from TikTok's own docs (developers.tiktok.com/doc/embed-player):
// postMessage({ type: 'play'|'pause'|'mute'|'unmute'|'seekTo', value?, 'x-tiktok-player': true }).
//
// NOT fully confirmed (their docs page kept timing out on repeated fetch attempts, and I could
// not find complete documentation of the INCOMING event names/shape they send back): the exact
// format of TikTok's own play/pause/seeked notifications. This player defensively tries several
// plausible field names when parsing incoming messages; owner-side local-interaction detection
// (tapping play/pause directly on the embed) may not work until verified live and adjusted —
// flag any sync issues here first if TikTok rooms misbehave.
//
// TikTok is short-form (typically well under actual movie length) — lower priority than the other
// platforms for a "watch a film together" use case, included per today's source-expansion pass.

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

interface TikTokMessage {
  type?: string;
  event?: string;
  value?: number;
  currentTime?: number;
  seekTo?: number;
}

const DRIFT_HARD_SEEK_SECS = 1.2;
const MAX_COMPENSATION_SECS = 30;
const LOAD_TIMEOUT_MS = 15000;

export function TikTokPlayer({ videoId, isOwner, onPlay, onPause, onSeek, onHeartbeat }: Props) {
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRemoteAction = useRef(false);
  const currentTimeRef = useRef(0);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isOwnerRef = useRef(isOwner);   isOwnerRef.current = isOwner;
  const onPlayRef = useRef(onPlay);     onPlayRef.current = onPlay;
  const onPauseRef = useRef(onPause);   onPauseRef.current = onPause;
  const onSeekRef = useRef(onSeek);     onSeekRef.current = onSeek;
  const onHeartbeatRef = useRef(onHeartbeat); onHeartbeatRef.current = onHeartbeat;

  function sendCmd(type: string, value?: number) {
    iframeRef.current?.contentWindow?.postMessage(
      { type, value, 'x-tiktok-player': true },
      '*',
    );
  }

  useEffect(() => {
    setReady(false);
    setError(null);
    currentTimeRef.current = 0;

    // No confirmed "ready" event — the iframe itself loading is the best available readiness
    // signal here (unlike YouTube/Vimeo/Twitch's explicit onReady callback).
    const timeoutId = setTimeout(() => setReady(true), 1500);
    const hardTimeout = setTimeout(() => {
      setReady((r) => { if (!r) setError('Видео не загрузилось'); return r; });
    }, LOAD_TIMEOUT_MS);

    const startHeartbeat = () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (isOwnerRef.current) onHeartbeatRef.current(currentTimeRef.current);
      }, 1000);
    };
    startHeartbeat();

    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as TikTokMessage;
      if (!data || typeof data !== 'object') return;
      const t = data.currentTime ?? data.value ?? data.seekTo;
      if (typeof t === 'number') currentTimeRef.current = t;

      const evt = (data.type ?? data.event ?? '').toString().toLowerCase();
      if (!isOwnerRef.current || isRemoteAction.current) return;
      if (evt.includes('play')) onPlayRef.current(currentTimeRef.current);
      else if (evt.includes('pause')) onPauseRef.current(currentTimeRef.current);
      else if (evt.includes('seek')) onSeekRef.current(currentTimeRef.current);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeoutId);
      clearTimeout(hardTimeout);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, [videoId]);

  // Viewer: apply incoming syncState.
  useEffect(() => {
    if (!ready || isOwner) return;
    isRemoteAction.current = true;
    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;
    if (Math.abs(currentTimeRef.current - target) > 0.5) {
      sendCmd('seekTo', target);
      currentTimeRef.current = target;
    }
    sendCmd(syncState.isPlaying ? 'play' : 'pause');
    const clear = setTimeout(() => { isRemoteAction.current = false; }, 400);
    return () => clearTimeout(clear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isOwner, syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp]);

  // Viewer: drift correction (hard-seek only).
  useEffect(() => {
    if (!ready || isOwner || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    if (Math.abs(expected - currentTimeRef.current) > DRIFT_HARD_SEEK_SECS) {
      isRemoteAction.current = true;
      sendCmd('seekTo', expected);
      currentTimeRef.current = expected;
      setTimeout(() => { isRemoteAction.current = false; }, 400);
    }
  }, [ready, isOwner, heartbeat, syncState.isPlaying]);

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
      <iframe
        ref={iframeRef}
        src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1`}
        className="w-full h-full border-0"
        allow="fullscreen"
        allowFullScreen
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  );
}
