'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import type { VideoPlatform } from '@/types';

/* ── YouTube IFrame API types ────────────────────────────────────── */
declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, opts: YTPlayerOptions) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (e: { target: YTPlayer }) => void;
    onStateChange?: (e: { data: number; target: YTPlayer }) => void;
  };
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0] ?? null;
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
}

function buildEmbedUrl(url: string, platform: VideoPlatform): string {
  if (platform === 'youtube') {
    const id = extractYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}` : url;
  }
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

/* ── YouTube sub-component with sync ────────────────────────────── */
function YouTubePlayer({
  videoUrl, syncTime, syncTimestamp, syncIsPlaying, isOwner = true,
  onPlay, onPause, onSeek,
}: UniversalPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef    = useRef<YTPlayer | null>(null);
  const readyRef     = useRef(false);
  const ignoreSyncRef = useRef(false); // prevent owner's own events from looping

  const videoId = extractYouTubeId(videoUrl) ?? '';

  /* ── Load YT IFrame API once ──────────────────────────────── */
  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      initPlayer();
    };
    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script');
      s.id  = 'yt-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
    return () => { playerRef.current?.destroy(); playerRef.current = null; readyRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !window.YT?.Player) return;
    playerRef.current?.destroy();
    const div = document.createElement('div');
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(div);
    playerRef.current = new window.YT.Player(div, {
      videoId,
      playerVars: { autoplay: 0, controls: isOwner ? 1 : 0, rel: 0, modestbranding: 1 },
      events: {
        onReady: () => { readyRef.current = true; },
        onStateChange: (e) => {
          if (!isOwner || ignoreSyncRef.current) return;
          const p = playerRef.current;
          if (!p) return;
          if (e.data === window.YT.PlayerState.PLAYING)  onPlay?.(p.getCurrentTime());
          if (e.data === window.YT.PlayerState.PAUSED)   onPause?.(p.getCurrentTime());
        },
      },
    });
  }, [videoId, isOwner, onPlay, onPause]);

  /* ── Apply remote sync (members only) ────────────────────── */
  useEffect(() => {
    if (isOwner || !readyRef.current || syncIsPlaying === undefined) return;
    const p = playerRef.current;
    if (!p) return;

    let target = syncTime ?? 0;
    if (syncIsPlaying && syncTimestamp) {
      target += Math.max(0, (Date.now() - syncTimestamp) / 1000);
    }
    ignoreSyncRef.current = true;
    if (Math.abs(p.getCurrentTime() - target) > 1.5) p.seekTo(target, true);
    if (syncIsPlaying) p.playVideo();
    else p.pauseVideo();
    setTimeout(() => { ignoreSyncRef.current = false; }, 300);
  }, [isOwner, syncTime, syncTimestamp, syncIsPlaying]);

  /* ── Owner seek detection (drag progress bar not possible with YT, ──
     but seek via keyboard or direct interaction triggers stateChange.
     We also poll getCurrentTime to detect seeks. ────────────────── */
  const lastTimeRef = useRef(0);
  useEffect(() => {
    if (!isOwner) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p || !readyRef.current) return;
      const t = p.getCurrentTime();
      if (Math.abs(t - lastTimeRef.current) > 2) {
        onSeek?.(t);
      }
      lastTimeRef.current = t;
    }, 1000);
    return () => clearInterval(id);
  }, [isOwner, onSeek]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full [&>div]:w-full [&>div]:h-full [&>iframe]:w-full [&>iframe]:h-full"
      />
      {/* Transparent overlay for non-owners: blocks all mouse/keyboard interaction
          with the YouTube iframe (prevents members from controlling playback) */}
      {!isOwner && (
        <div className="absolute inset-0 z-10 cursor-not-allowed" />
      )}
    </div>
  );
}

/* ── Generic iframe sub-component ───────────────────────────────── */
function IframePlayer({ videoUrl, platform, isOwner }: { videoUrl: string; platform: VideoPlatform; isOwner?: boolean }) {
  const embedUrl = buildEmbedUrl(videoUrl, platform);
  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title="Video player"
        style={!isOwner ? { pointerEvents: 'none' } : undefined}
      />
      {/* Block member interaction */}
      {!isOwner && (
        <div className="absolute inset-0 z-10 cursor-not-allowed" />
      )}
    </div>
  );
}

/* ── Main UniversalPlayer ────────────────────────────────────────── */
export function UniversalPlayer(props: UniversalPlayerProps) {
  const { videoUrl, platform } = props;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = useCallback((fs: boolean) => {
    setIsFullscreen(fs);
    props.onFullscreenChange?.(fs);
  }, [props]);

  if (platform === 'direct') {
    return (
      <VideoPlayer
        src={videoUrl}
        poster={props.thumbnail}
        title={props.title}
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
    return <YouTubePlayer {...props} />;
  }

  // Vimeo, Twitch, Dailymotion, other → generic iframe embed
  return <IframePlayer videoUrl={videoUrl} platform={platform} isOwner={props.isOwner} />;
}
