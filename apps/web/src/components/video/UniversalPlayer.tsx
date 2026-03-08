'use client';

import { useEffect, useState, useCallback } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { apiClient } from '@/lib/axios';
import type { VideoPlatform } from '@/types';

/* ── Helpers ─────────────────────────────────────────────────────── */
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

/* ── YouTube resolver — fetches direct mp4 URL, plays in VideoPlayer */
function YouTubeResolverPlayer(props: UniversalPlayerProps) {
  const { videoUrl, thumbnail, ...rest } = props;
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [resolvedThumb, setResolvedThumb] = useState<string | undefined>(thumbnail);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setDirectUrl(null);

    apiClient
      .get<{ success: boolean; data: { url: string; title: string; thumbnail: string } }>(
        `/youtube/stream-url?url=${encodeURIComponent(videoUrl)}`,
      )
      .then((res) => {
        if (cancelled) return;
        const d = res.data?.data;
        if (d?.url) {
          setDirectUrl(d.url);
          if (d.thumbnail && !thumbnail) setResolvedThumb(d.thumbnail);
        } else {
          setFailed(true);
        }
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [videoUrl, thumbnail]);

  if (loading) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
        {resolvedThumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolvedThumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          <span className="text-white/50 text-sm">Video yuklanmoqda…</span>
        </div>
      </div>
    );
  }

  if (failed || !directUrl) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
        <p className="text-white/40 text-sm">Videoni yuklab bo'lmadi</p>
      </div>
    );
  }

  return (
    <VideoPlayer
      src={directUrl}
      poster={resolvedThumb}
      {...rest}
    />
  );
}

/* ── Generic iframe sub-component ───────────────────────────────── */
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
    return <YouTubeResolverPlayer {...props} onFullscreenChange={handleFullscreen} />;
  }

  // Vimeo, Twitch, Dailymotion, other → generic iframe embed
  return <IframePlayer videoUrl={videoUrl} platform={platform} />;
}
