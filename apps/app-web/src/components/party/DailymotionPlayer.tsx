'use client';

// WeWatch Web — Synced Dailymotion player (official geo.dailymotion.com/player.html embed).
// Plain postMessage protocol, no SDK script needed — same owner/viewer sync model as
// YouTubePlayer.tsx, ported from mobile's buildDailymotionHtml() (WebViewAdapters.ts).
//
// 'apiready' isn't reliably observed in production (same class of bug as VK, 2026-07-19) — the
// iframe loads and plays fine (native controls work end-to-end) while our postMessage listener
// never sees a recognizable ready signal, so the load-timeout fired a false "failed to embed"
// error over a working video. The iframe's own onLoad is the ground truth for "embed succeeded";
// treat it as ready too so the UI never lies about a video that's actually playing.

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

interface DMMessage {
  event?: string;
  currentTime?: number;
  duration?: number;
}

const DRIFT_HARD_SEEK_SECS = 1.2;
const MAX_COMPENSATION_SECS = 30;
const LOAD_TIMEOUT_MS = 15000;

export function DailymotionPlayer({ videoId, isOwner, onPlay, onPause, onSeek, onHeartbeat }: Props) {
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
  const markReadyRef = useRef<() => void>(() => {});

  function sendCmd(command: string, params?: object) {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ command, ...params }), '*');
  }

  useEffect(() => {
    setReady(false);
    setError(null);
    currentTimeRef.current = 0;

    const timeoutId = setTimeout(() => {
      setReady((r) => {
        if (!r) setError('Видео не загрузилось — возможно, оно недоступно для встраивания');
        return r;
      });
    }, LOAD_TIMEOUT_MS);

    const startHeartbeat = () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (isOwnerRef.current) onHeartbeatRef.current(currentTimeRef.current);
      }, 1000);
    };

    const markReady = () => {
      clearTimeout(timeoutId);
      setError(null);
      setReady(true);
      startHeartbeat();
    };
    markReadyRef.current = markReady;

    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      let data: DMMessage;
      try {
        data = (typeof e.data === 'string' ? JSON.parse(e.data) : e.data) as DMMessage;
      } catch { return; }
      if (typeof data.currentTime === 'number') currentTimeRef.current = data.currentTime;

      switch (data.event) {
        case 'apiready':
          markReady();
          break;
        case 'playing':
          if (isOwnerRef.current && !isRemoteAction.current) onPlayRef.current(currentTimeRef.current);
          break;
        case 'pause':
        case 'ended':
          if (isOwnerRef.current && !isRemoteAction.current) onPauseRef.current(currentTimeRef.current);
          break;
        case 'seeked':
          if (isOwnerRef.current && !isRemoteAction.current) onSeekRef.current(currentTimeRef.current);
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

  // Viewer: apply incoming syncState.
  useEffect(() => {
    if (!ready || isOwner) return;
    isRemoteAction.current = true;
    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;
    if (Math.abs(currentTimeRef.current - target) > 0.5) {
      sendCmd('seek', { time: target });
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
      sendCmd('seek', { time: expected });
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
        src={`https://geo.dailymotion.com/player.html?video=${videoId}&autoplay=0&controls=1&api=postMessage`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        onLoad={() => markReadyRef.current()}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  );
}
