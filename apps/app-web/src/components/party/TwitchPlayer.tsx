'use client';

// WeWatch Web — Synced Twitch player (official Twitch.Embed JS API).
//
// Only VODs (type: 'vod') are synced — owner/viewer play/pause+seek+heartbeat, same model as
// YouTubePlayer. Live channels (type: 'channel') get no sync at all: there's no shared timeline
// to seek to, and forcing every viewer's independent live view to pause because the owner's did
// has no "watch together" benefit — everyone already sees the same live edge on their own.
//
// parent must list every domain this embed can legitimately appear on — self-service, no approval
// wait (unlike e.g. Trovo). https://dev.twitch.tv/docs/embed/

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';

interface Props {
  id: string;
  type: 'channel' | 'vod';
  isOwner: boolean;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onHeartbeat: (time: number) => void;
}

interface TwitchPlayerHandle {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  getCurrentTime(): number;
  isPaused(): boolean;
}
interface TwitchEmbedInstance {
  addEventListener(event: string, cb: () => void): void;
  getPlayer(): TwitchPlayerHandle;
}
interface TwitchNamespace {
  Embed: (new (elId: string, opts: Record<string, unknown>) => TwitchEmbedInstance) & {
    VIDEO_READY: string;
    VIDEO_PLAY: string;
    VIDEO_PAUSE: string;
  };
}
declare global {
  interface Window { Twitch?: TwitchNamespace }
}

let twitchApiPromise: Promise<TwitchNamespace> | null = null;
function loadTwitchApi(): Promise<TwitchNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.Twitch) return Promise.resolve(window.Twitch);
  if (twitchApiPromise) return twitchApiPromise;
  twitchApiPromise = new Promise<TwitchNamespace>((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = 'https://embed.twitch.tv/embed/v1.js';
    tag.onload = () => { if (window.Twitch) resolve(window.Twitch); else reject(new Error('Twitch SDK failed to init')); };
    tag.onerror = () => reject(new Error('Twitch SDK failed to load'));
    document.head.appendChild(tag);
  });
  return twitchApiPromise;
}

const DRIFT_HARD_SEEK_SECS = 1.2;
const SEEK_JUMP_SECS = 2.0;
const MAX_COMPENSATION_SECS = 30;
const LOAD_TIMEOUT_MS = 15000;

export function TwitchPlayer({ id, type, isOwner, onPlay, onPause, onSeek, onHeartbeat }: Props) {
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);
  const isVod = type === 'vod';

  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<TwitchPlayerHandle | null>(null);
  const t = useTranslations('party');
  const [ready, setReady] = useState(false);
  // Holds a message KEY, not text — the error follows the language switcher and effects
  // never need `t` in their dependency list.
  const [error, setError] = useState<string | null>(null);
  // Twitch.Embed takes a container element ID (string), not a DOM ref — needs to be unique in
  // case multiple instances ever mount at once.
  const hostId = useRef(`twitch-embed-${Math.random().toString(36).slice(2)}`).current;

  const isRemoteAction = useRef(false);
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

    // Without this, a load failure that never reaches VIDEO_READY (e.g. a CSP frame-src
    // block, or Twitch's SDK silently failing) spins the loader forever with no feedback —
    // every other embed player here has this same fallback, Twitch was missing it.
    const timeoutId = setTimeout(() => {
      if (!cancelled) setReady((r) => {
        if (!r) setError('playerEmbedBlocked');
        return r;
      });
    }, LOAD_TIMEOUT_MS);

    loadTwitchApi().then((Twitch) => {
      if (cancelled || !hostRef.current) return;
      const opts: Record<string, unknown> = {
        width: '100%', height: '100%',
        parent: [window.location.hostname],
        autoplay: false, muted: false, layout: 'video',
      };
      if (isVod) opts.video = id; else opts.channel = id;

      const embed = new Twitch.Embed(hostId, opts);
      embed.addEventListener(Twitch.Embed.VIDEO_READY, () => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        playerRef.current = embed.getPlayer();
        setReady(true);
      });
      // Live channels: no shared timeline to sync to (the code below this already only applies
      // incoming state for VOD), so broadcasting the owner's local play/pause here was pure
      // overhead — it forced every viewer's independent live view to pause just because the
      // owner's did, with no "watch together" benefit since there's no position to keep in sync.
      // Removed for channels (2026-07-19); VODs still sync fully.
      if (isVod) {
        embed.addEventListener(Twitch.Embed.VIDEO_PLAY, () => {
          if (!isOwnerRef.current || isRemoteAction.current) return;
          const p = playerRef.current;
          if (p) onPlayRef.current(p.getCurrentTime());
        });
        embed.addEventListener(Twitch.Embed.VIDEO_PAUSE, () => {
          if (!isOwnerRef.current || isRemoteAction.current) return;
          const p = playerRef.current;
          if (p) onPauseRef.current(p.getCurrentTime());
        });
      }
    }).catch(() => { if (!cancelled) setError('playerSdkFailed'); });

    return () => { cancelled = true; clearTimeout(timeoutId); playerRef.current = null; };
  }, [id, type, isVod, hostId]);

  // Owner: heartbeat + seek detection (VOD only — a live channel has no timeline to seek/sync).
  useEffect(() => {
    if (!ready || !isOwner || !isVod) return;
    const iid = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const pos = p.getCurrentTime();
      if (p.isPaused()) { lastPolledTime.current = pos; return; }
      if (Math.abs(pos - lastPolledTime.current) > SEEK_JUMP_SECS) onSeekRef.current(pos);
      lastPolledTime.current = pos;
      onHeartbeatRef.current(pos);
    }, 1000);
    return () => clearInterval(iid);
  }, [ready, isOwner, isVod]);

  // Viewer: apply incoming syncState (VOD only).
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || isOwner || !p || !isVod) return;
    isRemoteAction.current = true;
    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;
    if (Math.abs(p.getCurrentTime() - target) > 0.5) p.seek(target);
    if (syncState.isPlaying) p.play(); else p.pause();
    const clear = setTimeout(() => { isRemoteAction.current = false; }, 400);
    return () => clearTimeout(clear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isOwner, isVod, syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp]);

  // Viewer: drift correction (VOD only, hard-seek — Twitch has no discrete-rate micro-sync either).
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || isOwner || !p || !isVod || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    if (Math.abs(expected - p.getCurrentTime()) > DRIFT_HARD_SEEK_SECS) {
      isRemoteAction.current = true;
      p.seek(expected);
      setTimeout(() => { isRemoteAction.current = false; }, 400);
    }
  }, [ready, isOwner, isVod, heartbeat, syncState.isPlaying]);

  if (error) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-slate-300 text-sm font-medium">{t('playerLoadFailed')}</p>
        <p className="text-slate-500 text-xs">{t(error, { platform: 'Twitch' })}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <div id={hostId} ref={hostRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  );
}
