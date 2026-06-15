'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Loader2, Play, AlertCircle } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onHeartbeat: (time: number) => void;
  onBufferStart: () => void;
  onBufferEnd: () => void;
}

interface ExtractResult {
  videoUrl: string;
  type: 'mp4' | 'hls' | 'embed';
  poster?: string;
  httpHeaders?: Record<string, string>;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

function isVkUrl(url: string): boolean {
  return /(?:vk\.com|vkvideo\.ru)\/video-?\d+_\d+/.test(url);
}

function isRutubeUrl(url: string): boolean {
  return /rutube\.ru\/video\/[a-zA-Z0-9]+/.test(url);
}

async function extractVideoUrl(url: string): Promise<ExtractResult> {
  const res = await fetch('/api/content/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Extract failed: ${res.status}`);
  }
  const data = (await res.json()) as { data?: ExtractResult };
  if (!data.data?.videoUrl) throw new Error('No video URL returned');
  return data.data;
}

/** Build proxy URL that routes CDN stream through the web server (same Railway IP as yt-dlp). */
function buildProxyUrl(cdnUrl: string, headers?: Record<string, string>): string {
  const h = headers ? encodeURIComponent(JSON.stringify(headers)) : '';
  return `/api/content/proxy-stream?url=${encodeURIComponent(cdnUrl)}&h=${h}`;
}

// ── Native video wrapper with HLS.js support ──────────────────────────────────

interface NativeProps {
  src: string;
  isHls: boolean;
  poster?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  autoplayBlocked: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeeked: () => void;
  onBufferStart: () => void;
  onBufferEnd: () => void;
  onOverlayClick: () => void;
}

function NativeVideoPlayer({
  src,
  isHls,
  poster,
  videoRef,
  autoplayBlocked,
  onPlay,
  onPause,
  onSeeked,
  onBufferStart,
  onBufferEnd,
  onOverlayClick,
}: NativeProps) {
  const hlsRef = useRef<import('hls.js').default | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Native HLS (Safari) or non-HLS: use src directly
    if (!isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    // Chrome/Firefox: need HLS.js
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        // Fallback: try native anyway
        video.src = src;
        return;
      }
      // Destroy previous instance if src changed
      hlsRef.current?.destroy();

      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
    }).catch(() => {
      // hls.js import failed — try native
      video.src = src;
    });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, isHls, videoRef]);

  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
      <video
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        preload="none"
        disableRemotePlayback
        className="w-full h-full"
        onPlay={onPlay}
        onPause={onPause}
        onSeeked={onSeeked}
        onWaiting={onBufferStart}
        onCanPlay={onBufferEnd}
      />
      {autoplayBlocked && (
        <button
          onClick={onOverlayClick}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 cursor-pointer group"
          aria-label="Нажмите чтобы воспроизвести"
        >
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Play size={28} className="text-white ml-1" fill="white" />
          </div>
          <span className="text-white/70 text-sm">Нажмите чтобы начать</span>
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function VideoPlayer({
  onPlay,
  onPause,
  onSeek,
  onHeartbeat,
  onBufferStart,
  onBufferEnd,
}: Props) {
  const room = useWatchPartyStore((s) => s.room);
  const isConnected = useWatchPartyStore((s) => s.isConnected);
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = !!(room && currentUser && room.ownerId === currentUser._id);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isRemoteAction = useRef(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const [proxySrc, setProxySrc] = useState<string | null>(null);
  const [isHls, setIsHls] = useState(false);
  const [extractPoster, setExtractPoster] = useState<string | undefined>(undefined);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const extractedForUrl = useRef<string>('');

  const videoUrl = room?.videoUrl ?? '';
  const ytId = getYouTubeId(videoUrl);
  const needsExtract = !ytId && (isVkUrl(videoUrl) || isRutubeUrl(videoUrl));
  const isEmbed = !!ytId;
  const directSrc = needsExtract ? proxySrc : (!ytId && videoUrl) || null;

  // Extract → proxy URL
  useEffect(() => {
    if (!needsExtract || !videoUrl || extractedForUrl.current === videoUrl) return;
    extractedForUrl.current = videoUrl;
    setProxySrc(null);
    setExtractPoster(undefined);
    setExtractError(null);
    setExtracting(true);

    extractVideoUrl(videoUrl)
      .then((result) => {
        const proxy = buildProxyUrl(result.videoUrl, result.httpHeaders);
        setProxySrc(proxy);
        setIsHls(result.type === 'hls');
        setExtractPoster(result.poster);
      })
      .catch((err: unknown) => {
        setExtractError((err as Error).message ?? 'Extraction failed');
      })
      .finally(() => setExtracting(false));
  }, [videoUrl, needsExtract]);

  // Sync play/pause/seek from syncState
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed || !directSrc) return;

    isRemoteAction.current = true;
    if (Math.abs(video.currentTime - syncState.currentTime) > 2) {
      video.currentTime = syncState.currentTime;
    }
    if (syncState.isPlaying && video.paused) {
      video.play().then(() => setAutoplayBlocked(false)).catch(() => setAutoplayBlocked(true));
    } else if (!syncState.isPlaying && !video.paused) {
      video.pause();
      setAutoplayBlocked(false);
    }
    setTimeout(() => { isRemoteAction.current = false; }, 200);
  }, [syncState.currentTime, syncState.isPlaying, isEmbed, directSrc]);

  // Owner heartbeat
  useEffect(() => {
    const video = videoRef.current;
    if (!isOwner || isEmbed || !video) return;
    const id = setInterval(() => {
      if (!video.paused) onHeartbeat(video.currentTime);
    }, 2000);
    return () => clearInterval(id);
  }, [isOwner, isEmbed, onHeartbeat]);

  // Non-owner drift correction
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed || isOwner || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    const drift = expected - video.currentTime;
    if (Math.abs(drift) > 3) {
      isRemoteAction.current = true;
      video.currentTime = expected;
      setTimeout(() => { isRemoteAction.current = false; }, 200);
    } else if (Math.abs(drift) > 0.3) {
      video.playbackRate = drift > 0 ? 1.08 : 0.92;
    } else {
      video.playbackRate = 1.0;
    }
  }, [heartbeat, isEmbed, isOwner, syncState.isPlaying]);

  const handlePlay = useCallback(() => {
    if (!isRemoteAction.current && videoRef.current) {
      setAutoplayBlocked(false);
      onPlay(videoRef.current.currentTime);
    }
  }, [onPlay]);

  const handlePause = useCallback(() => {
    if (!isRemoteAction.current && videoRef.current) {
      onPause(videoRef.current.currentTime);
    }
  }, [onPause]);

  const handleSeeked = useCallback(() => {
    if (!isRemoteAction.current && videoRef.current) {
      onSeek(videoRef.current.currentTime);
    }
  }, [onSeek]);

  function handleOverlayClick() {
    videoRef.current?.play().then(() => setAutoplayBlocked(false)).catch(() => {});
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (!room) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-2">
        <p className="text-slate-400 text-sm font-medium">Видео не выбрано</p>
        {!isConnected && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Loader2 size={12} className="animate-spin" />
            Подключение...
          </div>
        )}
      </div>
    );
  }

  // ── YouTube ─────────────────────────────────────────────────────────────────

  if (ytId) {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=0&enablejsapi=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube player"
        />
      </div>
    );
  }

  // ── VK / Rutube — extract + proxy ──────────────────────────────────────────

  if (needsExtract) {
    if (extracting) {
      return (
        <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-violet-400" />
          <p className="text-slate-400 text-sm">Загрузка видео...</p>
        </div>
      );
    }

    if (extractError) {
      return (
        <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-slate-300 text-sm font-medium">Не удалось загрузить видео</p>
          <p className="text-slate-500 text-xs">{extractError}</p>
        </div>
      );
    }

    if (proxySrc) {
      return (
        <NativeVideoPlayer
          src={proxySrc}
          isHls={isHls}
          poster={extractPoster}
          videoRef={videoRef}
          autoplayBlocked={autoplayBlocked}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeeked}
          onBufferStart={onBufferStart}
          onBufferEnd={onBufferEnd}
          onOverlayClick={handleOverlayClick}
        />
      );
    }

    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-violet-400" />
      </div>
    );
  }

  // ── HTML5 direct (.mp4 / .m3u8) ────────────────────────────────────────────

  const srcIsHls = /\.(m3u8|mpd)(\?|$)/i.test(videoUrl) || /\/hls\//i.test(videoUrl);

  return (
    <NativeVideoPlayer
      src={videoUrl}
      isHls={srcIsHls}
      videoRef={videoRef}
      autoplayBlocked={autoplayBlocked}
      onPlay={handlePlay}
      onPause={handlePause}
      onSeeked={handleSeeked}
      onBufferStart={onBufferStart}
      onBufferEnd={onBufferEnd}
      onOverlayClick={handleOverlayClick}
    />
  );
}
