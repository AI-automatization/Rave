'use client';

import { useEffect, useCallback, useState } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
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

interface YtStreamInfo {
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
  mimeType: string;
  contentLength: number;
  isLive: boolean;
}

/* ── YouTube — Backend Stream Proxy Player ──────────────────────── */
// YouTube URL → backend /youtube/stream-url (metadata + isLive)
//   VOD:  proxy URL /youtube/stream?url=...&token=... (range request, seeking)
//   Live: format.url to'g'ridan (HLS m3u8) → VideoPlayer HLS.js ile ishlaydi
// → VideoPlayer (bizning native player, to'liq owner/member sync)
function YouTubeStreamPlayer(props: UniversalPlayerProps) {
  const {
    videoUrl,
    title, thumbnail, initialTime,
    syncTime, syncTimestamp, syncIsPlaying,
    isOwner, onProgress, onPlay, onPause, onSeek, onFullscreenChange,
  } = props;

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState(false);

  useEffect(() => {
    setResolving(true);
    setResolveError(false);
    setStreamUrl(null);
    setIsLive(false);

    const resolve = async () => {
      const contentBase = process.env.NEXT_PUBLIC_CONTENT_URL ?? '';
      const token =
        typeof window !== 'undefined' ? (localStorage.getItem('access_token') ?? '') : '';

      // 1. Metadata olish: isLive, title, format URL
      const infoRes = await fetch(
        `${contentBase}/youtube/stream-url?url=${encodeURIComponent(videoUrl)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!infoRes.ok) throw new Error('stream-url failed');
      const { data } = (await infoRes.json()) as { data: YtStreamInfo };

      // 2. Stream URL tanlash:
      //    Live → format.url to'g'ridan (HLS m3u8, VideoPlayer HLS.js ile o'ynaydi)
      //    VOD  → backend proxy (range request, seeking ishlaydi)
      const finalUrl = data.isLive
        ? data.url
        : `${contentBase}/youtube/stream?url=${encodeURIComponent(videoUrl)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

      setIsLive(data.isLive);
      setStreamUrl(finalUrl);
    };

    resolve()
      .catch(() => setResolveError(true))
      .finally(() => setResolving(false));
  }, [videoUrl]);

  if (resolving) {
    return (
      <div className="aspect-video bg-black rounded-xl flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Video yuklanmoqda...</p>
      </div>
    );
  }

  if (resolveError || !streamUrl) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
        <p className="text-white/40 text-sm">Video yuklashda xato. Qayta urinib ko&apos;ring.</p>
      </div>
    );
  }

  // VideoPlayer: to'liq sync (owner/member), HLS, seeking, isLive — hammasi handle qilinadi
  return (
    <VideoPlayer
      src={streamUrl}
      poster={thumbnail}
      title={title}
      initialTime={initialTime}
      syncTime={syncTime}
      syncTimestamp={syncTimestamp}
      syncIsPlaying={syncIsPlaying}
      isOwner={isOwner}
      isLive={isLive}
      onProgress={onProgress}
      onPlay={onPlay}
      onPause={onPause}
      onSeek={isLive ? undefined : onSeek}
      onFullscreenChange={onFullscreenChange}
    />
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
    return <YouTubeStreamPlayer {...props} onFullscreenChange={handleFullscreen} />;
  }

  return <IframePlayer videoUrl={videoUrl} platform={platform} />;
}
