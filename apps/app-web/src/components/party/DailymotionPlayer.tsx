'use client';

// WeWatch Web — Dailymotion embed, driven one-way (official geo.dailymotion.com/player.html).
//
// Dailymotion's iframe sends no usable state postMessage in production (confirmed live,
// 2026-07-19 — captured every message over a real session pressing play/pause/seek; only an
// internal `pes_listen_eid` analytics ping ever arrived, never `apiready`/`playing`/`pause`/
// `seeked`). Detecting the owner's actions from iframe events is therefore a dead end. Instead:
// native controls are hidden (`controls=0`) and replaced with our own bar. The owner's clicks
// call sendCmd() AND broadcast (onPlay/onPause/onSeek) in the same handler — no round-trip
// through the iframe needed, since we're the ones initiating the action.
//
// Outgoing commands use Dailymotion's real shape, read directly from their shipped
// dmp.photon_boot.js: `{command, parameters:[...]}` (parameters is an array — a sibling `time`
// field, which the previous version of this file sent, is silently ignored).
//
// currentTime is tracked blindly (a local ticking clock while isPlaying), not from real player
// feedback — if the iframe stalls/buffers, our clock keeps ticking regardless. Same class of
// trade-off already accepted for Trovo (play/pause sync with no real position feedback either).

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';

interface Props {
  videoId: string;
  isOwner: boolean;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onHeartbeat: (time: number) => void;
}

const SEEK_STEP_SECS = 10;
const MAX_COMPENSATION_SECS = 30;

export function DailymotionPlayer({ videoId, isOwner, onPlay, onPause, onSeek, onHeartbeat }: Props) {
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentTimeRef = useRef(0);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function sendCmd(command: string, parameters: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ command, parameters }), '*');
  }

  function handleLoad() {
    setError(null);
    setReady(true);
  }

  function handleError() {
    setError('Видео не загрузилось — возможно, оно недоступно для встраивания');
  }

  // Owner: local blind clock — ticks once a second while playing, feeds the heartbeat.
  useEffect(() => {
    if (tickTimer.current) clearInterval(tickTimer.current);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    if (!isOwner || !isPlaying) return;
    tickTimer.current = setInterval(() => { currentTimeRef.current += 1; }, 1000);
    heartbeatTimer.current = setInterval(() => onHeartbeat(currentTimeRef.current), 1000);
    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, [isOwner, isPlaying, onHeartbeat]);

  function handleTogglePlay() {
    const next = !isPlaying;
    setIsPlaying(next);
    sendCmd(next ? 'play' : 'pause');
    if (next) onPlay(currentTimeRef.current); else onPause(currentTimeRef.current);
  }

  function handleSeekStep(deltaSecs: number) {
    const target = Math.max(0, currentTimeRef.current + deltaSecs);
    currentTimeRef.current = target;
    sendCmd('seek', [target]);
    onSeek(target);
  }

  // Viewer: apply incoming syncState — drives the iframe via sendCmd, no feedback expected.
  useEffect(() => {
    if (!ready || isOwner) return;
    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;
    if (Math.abs(currentTimeRef.current - target) > 0.5) {
      sendCmd('seek', [target]);
      currentTimeRef.current = target;
    }
    sendCmd(syncState.isPlaying ? 'play' : 'pause');
    setIsPlaying(syncState.isPlaying);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isOwner, syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp]);

  // Viewer: drift correction from owner's heartbeat (hard-seek — no real position feedback to
  // measure drift against otherwise).
  useEffect(() => {
    if (!ready || isOwner || !heartbeat) return;
    currentTimeRef.current = heartbeat.currentTime;
  }, [ready, isOwner, heartbeat]);

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
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      <iframe
        ref={iframeRef}
        src={`https://geo.dailymotion.com/player.html?video=${videoId}&autoplay=0&controls=0&api=postMessage`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
      />
      {/* Native controls are hidden (controls=0) — only the owner gets a control bar, since
          sync is entirely owner-driven with no feedback loop through the iframe. */}
      {!isOwner && <div className="absolute inset-0" />}
      {isOwner && ready && (
        <div
          className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent transition-opacity ${
            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}
        >
          <button
            onClick={() => handleSeekStep(-SEEK_STEP_SECS)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Назад 10с"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={handleTogglePlay}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 active:scale-90 transition-all"
            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button
            onClick={() => handleSeekStep(SEEK_STEP_SECS)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Вперёд 10с"
          >
            <RotateCw size={18} />
          </button>
        </div>
      )}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  );
}
