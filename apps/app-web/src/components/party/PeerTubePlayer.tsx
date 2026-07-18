'use client';

// WeWatch Web — Synced PeerTube player (official @peertube/embed-api).
//
// PeerTube is federated/self-hosted — there's no single fixed domain the way YouTube/Vimeo have
// one. The embed script itself is a fixed CDN URL (unpkg.com/@peertube/embed-api), but the
// IFRAME must load from whatever instance the video actually lives on — and CSP's frame-src
// needs exact domains, it can't allowlist "any PeerTube instance" (that's every domain on the
// internet, from CSP's point of view). This ships with a small starter allowlist (see
// next.config.mjs frame-src) of well-known Framasoft-adjacent instances; a link from an instance
// not on that list will be silently blocked by the browser, not by this component — expand the
// CSP list on demand as real rooms need specific instances, there's no way to pre-enumerate
// "all PeerTube instances" (there are hundreds, run independently).

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';

interface Props {
  instance: string;
  videoId: string;
  isOwner: boolean;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onHeartbeat: (time: number) => void;
}

interface PlaybackStatus { position: number; volume: number; duration: number; playbackState: 'playing' | 'paused' | 'ended' }
interface PeerTubePlayerHandle {
  ready: Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(seconds: number): Promise<void>;
  getCurrentTime(): Promise<number>;
  addEventListener(event: 'playbackStatusUpdate' | 'playbackStatusChange', cb: (data: PlaybackStatus | { type: string }) => void): void;
}
declare global {
  interface Window { PeerTubePlayer?: new (iframe: HTMLIFrameElement) => PeerTubePlayerHandle }
}

let peertubeApiPromise: Promise<void> | null = null;
function loadPeerTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.PeerTubePlayer) return Promise.resolve();
  if (peertubeApiPromise) return peertubeApiPromise;
  peertubeApiPromise = new Promise<void>((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = 'https://unpkg.com/@peertube/embed-api/build/player.min.js';
    tag.onload = () => { if (window.PeerTubePlayer) resolve(); else reject(new Error('PeerTube SDK failed to init')); };
    tag.onerror = () => reject(new Error('PeerTube SDK failed to load'));
    document.head.appendChild(tag);
  });
  return peertubeApiPromise;
}

const DRIFT_HARD_SEEK_SECS = 1.2;
const SEEK_JUMP_SECS = 2.0;
const MAX_COMPENSATION_SECS = 30;

export function PeerTubePlayer({ instance, videoId, isOwner, onPlay, onPause, onSeek, onHeartbeat }: Props) {
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<PeerTubePlayerHandle | null>(null);
  const [ready, setReady] = useState(false);
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

    loadPeerTubeApi().then(() => {
      if (cancelled || !iframeRef.current || !window.PeerTubePlayer) return;
      const player = new window.PeerTubePlayer(iframeRef.current);
      playerRef.current = player;

      player.ready.then(() => { if (!cancelled) setReady(true); }).catch(() => {
        if (!cancelled) setError('Не удалось загрузить видео — возможно, инстанс не разрешён (см. CSP)');
      });
      player.addEventListener('playbackStatusUpdate', (data) => {
        if ('position' in data) currentTimeRef.current = data.position;
      });
      player.addEventListener('playbackStatusChange', (data) => {
        if (!('type' in data) || !isOwnerRef.current || isRemoteAction.current) return;
        if (data.type === 'playing') onPlayRef.current(currentTimeRef.current);
        else if (data.type === 'paused') onPauseRef.current(currentTimeRef.current);
      });
    }).catch(() => { if (!cancelled) setError('Не удалось загрузить PeerTube плеер'); });

    return () => { cancelled = true; playerRef.current = null; };
  }, [instance, videoId]);

  // Owner: heartbeat + seek detection.
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
      p.seek(target).catch(() => {});
      currentTimeRef.current = target;
    }
    if (syncState.isPlaying) p.play().catch(() => {}); else p.pause().catch(() => {});
    const clear = setTimeout(() => { isRemoteAction.current = false; }, 400);
    return () => clearTimeout(clear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isOwner, syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp]);

  // Viewer: drift correction (hard-seek only).
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || isOwner || !p || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    if (Math.abs(expected - currentTimeRef.current) > DRIFT_HARD_SEEK_SECS) {
      isRemoteAction.current = true;
      p.seek(expected).catch(() => {});
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
        src={`https://${instance}/videos/embed/${videoId}?api=1`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen"
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
