'use client';

// WeWatch Web — Synced Vimeo player (official Vimeo Player SDK, player.vimeo.com/api/player.js).
// Promise-based API (play/pause/setCurrentTime/getCurrentTime) + event listeners (play/pause/seeked).
// Same owner/viewer sync model as YouTubePlayer.tsx — ported from mobile's buildVimeoHtml()
// (apps/mobile/src/components/video/WebViewAdapters.ts), which already proved this exact protocol.

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

interface VimeoPlayerHandle {
  play(): Promise<void>;
  pause(): Promise<void>;
  setCurrentTime(seconds: number): Promise<number>;
  getCurrentTime(): Promise<number>;
  on(event: 'play' | 'pause' | 'seeked', cb: (data: { seconds: number }) => void): void;
  ready(): Promise<void>;
}
interface VimeoNamespace {
  Player: new (idOrElement: string | HTMLElement) => VimeoPlayerHandle;
}
declare global {
  interface Window { Vimeo?: VimeoNamespace }
}

let vimeoApiPromise: Promise<VimeoNamespace> | null = null;
function loadVimeoApi(): Promise<VimeoNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.Vimeo) return Promise.resolve(window.Vimeo);
  if (vimeoApiPromise) return vimeoApiPromise;
  vimeoApiPromise = new Promise<VimeoNamespace>((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = 'https://player.vimeo.com/api/player.js';
    tag.onload = () => { if (window.Vimeo) resolve(window.Vimeo); else reject(new Error('Vimeo SDK failed to init')); };
    tag.onerror = () => reject(new Error('Vimeo SDK failed to load'));
    document.head.appendChild(tag);
  });
  return vimeoApiPromise;
}

const DRIFT_HARD_SEEK_SECS = 1.2;
const SEEK_JUMP_SECS = 2.0;
const MAX_COMPENSATION_SECS = 30;

export function VimeoPlayer({ videoId, isOwner, onPlay, onPause, onSeek, onHeartbeat }: Props) {
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<VimeoPlayerHandle | null>(null);
  const t = useTranslations('party');
  const [ready, setReady] = useState(false);
  // Holds a message KEY, not text — the error follows the language switcher and effects
  // never need `t` in their dependency list.
  const [error, setError] = useState<string | null>(null);

  const isRemoteAction = useRef(false);
  const currentTimeRef = useRef(0);
  const lastPolledTime = useRef(0);

  const isOwnerRef = useRef(isOwner);   isOwnerRef.current = isOwner;
  const onPlayRef = useRef(onPlay);     onPlayRef.current = onPlay;
  const onPauseRef = useRef(onPause);   onPauseRef.current = onPause;
  const onSeekRef = useRef(onSeek);     onSeekRef.current = onSeek;
  const onHeartbeatRef = useRef(onHeartbeat); onHeartbeatRef.current = onHeartbeat;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    currentTimeRef.current = 0;

    loadVimeoApi().then((Vimeo) => {
      if (cancelled || !iframeRef.current) return;
      const player = new Vimeo.Player(iframeRef.current);
      playerRef.current = player;

      player.ready().then(() => { if (!cancelled) setReady(true); }).catch(() => {
        if (!cancelled) setError('playerLoadFailed');
      });
      player.on('play', (d) => {
        currentTimeRef.current = d.seconds ?? currentTimeRef.current;
        if (isOwnerRef.current && !isRemoteAction.current) onPlayRef.current(currentTimeRef.current);
      });
      player.on('pause', (d) => {
        currentTimeRef.current = d.seconds ?? currentTimeRef.current;
        if (isOwnerRef.current && !isRemoteAction.current) onPauseRef.current(currentTimeRef.current);
      });
      player.on('seeked', (d) => {
        currentTimeRef.current = d.seconds ?? currentTimeRef.current;
      });
    }).catch(() => { if (!cancelled) setError('playerSdkFailed'); });

    return () => { cancelled = true; playerRef.current = null; };
  }, [videoId]);

  // Owner: heartbeat + seek detection (Vimeo has no native "position poll" — read via promise).
  useEffect(() => {
    if (!ready || !isOwner) return;
    const iid = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      p.getCurrentTime().then((t) => {
        if (Math.abs(t - lastPolledTime.current) > SEEK_JUMP_SECS) onSeekRef.current(t);
        lastPolledTime.current = t;
        currentTimeRef.current = t;
        onHeartbeatRef.current(t);
      }).catch(() => {});
    }, 1000);
    return () => clearInterval(iid);
  }, [ready, isOwner]);

  // Viewer: apply incoming syncState.
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || isOwner || !p) return;
    isRemoteAction.current = true;
    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;
    if (Math.abs(currentTimeRef.current - target) > 0.5) {
      p.setCurrentTime(target).catch(() => {});
      currentTimeRef.current = target;
    }
    if (syncState.isPlaying) p.play().catch(() => {}); else p.pause().catch(() => {});
    const clear = setTimeout(() => { isRemoteAction.current = false; }, 400);
    return () => clearTimeout(clear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isOwner, syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp]);

  // Viewer: drift correction (hard-seek — Vimeo playbackRate isn't reliable enough for micro-sync).
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || isOwner || !p || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    if (Math.abs(expected - currentTimeRef.current) > DRIFT_HARD_SEEK_SECS) {
      isRemoteAction.current = true;
      p.setCurrentTime(expected).catch(() => {});
      currentTimeRef.current = expected;
      setTimeout(() => { isRemoteAction.current = false; }, 400);
    }
  }, [ready, isOwner, heartbeat, syncState.isPlaying]);

  if (error) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-slate-300 text-sm font-medium">{t('playerLoadFailed')}</p>
        <p className="text-slate-500 text-xs">{t(error, { platform: 'Vimeo' })}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${videoId}?autoplay=0&playsinline=1&transparent=0`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; picture-in-picture"
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
