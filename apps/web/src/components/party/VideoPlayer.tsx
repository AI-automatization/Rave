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

function buildProxyUrl(cdnUrl: string, headers?: Record<string, string>): string {
  const h = headers ? encodeURIComponent(JSON.stringify(headers)) : '';
  return `/api/content/proxy-stream?url=${encodeURIComponent(cdnUrl)}&h=${h}`;
}

// Prevent macOS from registering the video as system media (Now Playing HUD, AirPlay)
function suppressMacOsPlayer() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = null;
  const actions: MediaSessionAction[] = [
    'play', 'pause', 'seekto', 'seekbackward', 'seekforward',
    'previoustrack', 'nexttrack', 'stop',
  ];
  for (const action of actions) {
    try { navigator.mediaSession.setActionHandler(action, null); } catch { /* unsupported */ }
  }
}

// ── Native video wrapper with HLS.js + macOS suppression ─────────────────────

interface NativeProps {
  src: string;
  isHls: boolean;
  poster?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  autoplayBlocked: boolean;
  isOwner: boolean;
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
  isOwner,
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

    // Suppress macOS Now Playing / AirPlay on every src change
    suppressMacOsPlayer();

    if (!isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        video.src = src;
        return;
      }
      hlsRef.current?.destroy();
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      // HLS.js attaching triggers mediaSession again — suppress after attach
      hls.once(Hls.Events.MANIFEST_PARSED, suppressMacOsPlayer);
    }).catch(() => { video.src = src; });

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
        // Prevents AirPlay / Remote Playback API (macOS native player)
        disableRemotePlayback
        // eslint-disable-next-line react/no-unknown-property
        {...({ 'x-webkit-airplay': 'deny' } as Record<string, string>)}
        className="w-full h-full"
        // Only owner events are broadcast to the room.
        // Viewer can use controls locally (volume, fullscreen) but their
        // play/pause/seek don't affect other participants.
        onPlay={isOwner ? onPlay : undefined}
        onPause={isOwner ? onPause : undefined}
        onSeeked={isOwner ? onSeeked : undefined}
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

  // Extract → proxy URL for VK / Rutube
  useEffect(() => {
    if (!needsExtract || !videoUrl || extractedForUrl.current === videoUrl) return;
    extractedForUrl.current = videoUrl;
    setProxySrc(null);
    setExtractPoster(undefined);
    setExtractError(null);
    setExtracting(true);

    extractVideoUrl(videoUrl)
      .then((result) => {
        setProxySrc(buildProxyUrl(result.videoUrl, result.httpHeaders));
        setIsHls(result.type === 'hls');
        setExtractPoster(result.poster);
      })
      .catch((err: unknown) => {
        setExtractError((err as Error).message ?? 'Extraction failed');
      })
      .finally(() => setExtracting(false));
  }, [videoUrl, needsExtract]);

  // ── Sync incoming state to HTML5 video ────────────────────────────────────
  // Runs on every explicit PLAY / PAUSE / SEEK / SYNC event from server.
  // Always seek to exact position — threshold is tiny (0.3s) just to avoid
  // harmless float noise when the same event fires twice.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed || !directSrc) return;

    isRemoteAction.current = true;

    if (Math.abs(video.currentTime - syncState.currentTime) > 0.3) {
      video.currentTime = syncState.currentTime;
    }

    if (syncState.isPlaying && video.paused) {
      video.play()
        .then(() => setAutoplayBlocked(false))
        .catch(() => setAutoplayBlocked(true));
    } else if (!syncState.isPlaying && !video.paused) {
      video.pause();
      setAutoplayBlocked(false);
    }

    setTimeout(() => { isRemoteAction.current = false; }, 200);
  }, [syncState.currentTime, syncState.isPlaying, isEmbed, directSrc]);

  // Owner heartbeat every 2s
  useEffect(() => {
    const video = videoRef.current;
    if (!isOwner || isEmbed || !video) return;
    const id = setInterval(() => {
      if (!video.paused) onHeartbeat(video.currentTime);
    }, 2000);
    return () => clearInterval(id);
  }, [isOwner, isEmbed, onHeartbeat]);

  // Non-owner drift correction via heartbeat
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

  // Owner event handlers (only owner's actions are sent to the room)
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

  // ── YouTube (always iframe) ─────────────────────────────────────────────────

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
          isOwner={isOwner}
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
      isOwner={isOwner}
      onPlay={handlePlay}
      onPause={handlePause}
      onSeeked={handleSeeked}
      onBufferStart={onBufferStart}
      onBufferEnd={onBufferEnd}
      onOverlayClick={handleOverlayClick}
    />
  );
}
