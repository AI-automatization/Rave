'use client';

import { useEffect, useRef, useCallback } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import type { VideoPlatform } from '@/types';

/* ── Helpers ─────────────────────────────────────────────────────── */
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]{11})/);
  return m?.[1] ?? null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
}

function buildEmbedUrl(url: string, platform: VideoPlatform): string {
  if (platform === 'vimeo') {
    const id = extractVimeoId(url);
    return id ? `https://player.vimeo.com/video/${id}?api=1` : url;
  }
  if (platform === 'twitch') {
    const channel = url.match(/twitch\.tv\/([^/?]+)/)?.[1];
    return channel
      ? `https://player.twitch.tv/?channel=${channel}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`
      : url;
  }
  if (platform === 'dailymotion') {
    const id = url.match(/dailymotion\.com\/video\/([^_?]+)/)?.[1];
    return id ? `https://www.dailymotion.com/embed/video/${id}` : url;
  }
  return url;
}

/* ── Props ───────────────────────────────────────────────────────── */
interface UniversalPlayerProps {
  videoUrl: string;
  platform: VideoPlatform;
  title?: string;
  thumbnail?: string;
  initialTime?: number;
  syncTime?: number;
  syncTimestamp?: number;
  syncIsPlaying?: boolean;
  isOwner?: boolean;
  onProgress?: (progress: number, currentTime: number) => void;
  onPlay?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onSeek?: (time: number) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

/* ── YouTube — IFrame Player API (postMessage) ─────────────────── */
function YouTubeIframePlayer({
  videoUrl, syncTime, syncTimestamp, syncIsPlaying, isOwner,
  onPlay, onPause, onSeek,
}: UniversalPlayerProps) {
  const iframeRef       = useRef<HTMLIFrameElement>(null);
  const applyingRef     = useRef(false);   // true while we're applying sync (ignore state events)
  const currentTimeRef  = useRef(0);       // tracks latest currentTime from infoDelivery
  const lastTrackedRef  = useRef(0);       // for seek detection (owner)
  const playerStateRef  = useRef(-1);      // last known YouTube playerState

  const videoId = extractYouTubeId(videoUrl);

  /* Send a command to the YouTube iframe via postMessage */
  const cmd = useCallback((func: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*',
    );
  }, []);

  /* Member sync: when owner plays/pauses, apply to our iframe */
  useEffect(() => {
    if (isOwner || syncIsPlaying === undefined) return;

    applyingRef.current = true;

    // Drift-compensated target time
    const elapsed = syncTimestamp ? Math.max(0, (Date.now() - syncTimestamp) / 1000) : 0;
    const target  = (syncTime ?? 0) + (syncIsPlaying ? elapsed : 0);

    // Only seek if we're significantly out of sync
    if (Math.abs(target - currentTimeRef.current) > 2) {
      cmd('seekTo', [target, true]);
    }

    if (syncIsPlaying) cmd('playVideo');
    else               cmd('pauseVideo');

    // Clear flag after commands settle
    const t = setTimeout(() => { applyingRef.current = false; }, 800);
    return () => clearTimeout(t);
  }, [isOwner, syncIsPlaying, syncTime, syncTimestamp, cmd]);

  /* Listen to YouTube postMessage events */
  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      let data: Record<string, unknown>;
      try { data = JSON.parse(e.data) as Record<string, unknown>; }
      catch { return; }

      // Periodic info: track currentTime + playerState
      if (data.event === 'infoDelivery') {
        const info = data.info as Record<string, unknown> | null;
        if (!info) return;
        if (typeof info.currentTime === 'number') currentTimeRef.current  = info.currentTime;
        if (typeof info.playerState === 'number') playerStateRef.current  = info.playerState;
      }

      // State transitions: only emit owner events (not sync-applied ones)
      if (data.event === 'onStateChange' && isOwner && !applyingRef.current) {
        const state = data.info as number;
        const ct    = currentTimeRef.current;
        if (state === 1) onPlay?.(ct);   // playing
        if (state === 2) onPause?.(ct);  // paused
      }
    };

    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [isOwner, onPlay, onPause]);

  /* Owner seek detection: poll currentTime every second, emit onSeek on jumps */
  useEffect(() => {
    if (!isOwner) return;
    const id = setInterval(() => {
      const cur = currentTimeRef.current;
      // Natural progression ≈ 1s; a jump > 4s is likely a user seek
      const playing = playerStateRef.current === 1;
      if (playing && Math.abs(cur - lastTrackedRef.current - 1) > 4) {
        onSeek?.(cur);
      }
      lastTrackedRef.current = cur;
    }, 1000);
    return () => clearInterval(id);
  }, [isOwner, onSeek]);

  if (!videoId) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
        <p className="text-white/40 text-sm">YouTube video ID topilmadi</p>
      </div>
    );
  }

  const origin   = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(origin)}&controls=1&rel=0&modestbranding=1`;

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title={`YouTube — ${videoId}`}
      />
    </div>
  );
}

/* ── Generic iframe (Vimeo, Twitch, Dailymotion) ─────────────────── */
function IframePlayer({ videoUrl, platform }: { videoUrl: string; platform: VideoPlatform }) {
  const embedUrl = buildEmbedUrl(videoUrl, platform);
  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title="Video player"
      />
    </div>
  );
}

/* ── Main UniversalPlayer ────────────────────────────────────────── */
export function UniversalPlayer(props: UniversalPlayerProps) {
  const { videoUrl, platform } = props;

  const handleFullscreen = useCallback((fs: boolean) => {
    props.onFullscreenChange?.(fs);
  }, [props]);

  if (platform === 'direct') {
    return (
      <VideoPlayer
        src={videoUrl}
        poster={props.thumbnail}
        title={props.title}
        initialTime={props.initialTime}
        syncTime={props.syncTime}
        syncTimestamp={props.syncTimestamp}
        syncIsPlaying={props.syncIsPlaying}
        isOwner={props.isOwner}
        onProgress={props.onProgress}
        onPlay={props.onPlay}
        onPause={props.onPause}
        onSeek={props.onSeek}
        onFullscreenChange={handleFullscreen}
      />
    );
  }

  if (platform === 'youtube') {
    return <YouTubeIframePlayer {...props} onFullscreenChange={handleFullscreen} />;
  }

  return <IframePlayer videoUrl={videoUrl} platform={platform} />;
}
