'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { FaVolumeMute, FaVolumeDown, FaVolumeUp, FaExpand, FaCompress } from 'react-icons/fa';
import { VideoPlayer } from '@/components/VideoPlayer';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import type { VideoPlatform } from '@/types';

/* ── Minimal YouTube IFrame API types ────────────────────────────── */
type YTPlayerState = -1 | 0 | 1 | 2 | 3 | 5;
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}
interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: () => void;
    onStateChange?: (event: { data: YTPlayerState }) => void;
  };
}
declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
      PlayerState: { UNSTARTED: -1; ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
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

interface YtStreamInfo {
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
  mimeType: string;
  contentLength: number;
  isLive: boolean;
}

/* ── YouTube IFrame API Player (sync to'liq ishlaydi) ───────────── */
// Backend proxy ishlamasa bu komponent fallback sifatida ishlatiladi.
// YouTube IFrame API orqali:
//   Owner:  onStateChange → onPlay/onPause/onSeek chaqiradi → socket emit
//   Member: syncTime/syncIsPlaying o'zgarganda → seekTo + play/pause
function YouTubeIframePlayer(props: UniversalPlayerProps) {
  const {
    videoUrl,
    title,
    syncTime,
    syncTimestamp,
    syncIsPlaying,
    isOwner,
    onPlay,
    onPause,
    onSeek,
  } = props;

  const ytId = extractYouTubeId(videoUrl);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  // Sync uygulanayotganda owner eventlari ignore qilinadi (feedback loop oldini olish)
  const applyingSyncRef = useRef(false);
  // Seek aniqlash: BUFFERING state da vaqtni saqlab qo'yamiz
  const prevTimeRef = useRef(0);
  // Takroriy sync oldini olish
  const lastSyncKeyRef = useRef('');

  // Stable callback refs (stale closure muammosidan himoya)
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekRef = useRef(onSeek);
  const isOwnerRef = useRef(isOwner);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);
  useEffect(() => { onSeekRef.current = onSeek; }, [onSeek]);
  useEffect(() => { isOwnerRef.current = isOwner; }, [isOwner]);

  // Member uchun volume + fullscreen state
  const [memberVolume, setMemberVolume] = useState(100);
  const [memberMuted, setMemberMuted] = useState(false);
  const [showVolSlider, setShowVolSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMemberVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    setMemberVolume(v);
    setMemberMuted(v === 0);
    playerRef.current?.setVolume(v);
    if (v === 0) playerRef.current?.mute();
    else playerRef.current?.unMute();
  }, []);

  const handleMemberFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      void wrapperRef.current.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleMemberToggleMute = useCallback(() => {
    if (memberMuted) {
      playerRef.current?.unMute();
      playerRef.current?.setVolume(memberVolume || 100);
      setMemberMuted(false);
    } else {
      playerRef.current?.mute();
      setMemberMuted(true);
    }
  }, [memberMuted, memberVolume]);

  // YouTube IFrame API yuklash va player yaratish
  useEffect(() => {
    if (!ytId || typeof window === 'undefined') return;

    const createPlayer = () => {
      if (!containerRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: ytId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          // Member player kontrollarni ko'rmaydi — faqat owner boshqaradi
          controls: isOwnerRef.current ? 1 : 0,
        },
        events: {
          onStateChange: (event: { data: YTPlayerState }) => {
            // Member va sync apply paytida owner eventlari ignore
            if (!isOwnerRef.current || applyingSyncRef.current) return;
            const player = playerRef.current;
            if (!player) return;
            const currentTime = player.getCurrentTime();

            if (event.data === 3) {
              // BUFFERING — seek bo'lishi mumkin, vaqtni eslab qol
              prevTimeRef.current = currentTime;
            } else if (event.data === 1) {
              // PLAYING — seek bo'ldimi?
              if (Math.abs(currentTime - prevTimeRef.current) > 2) {
                onSeekRef.current?.(currentTime);
              }
              onPlayRef.current?.(currentTime);
              prevTimeRef.current = currentTime;
            } else if (event.data === 2) {
              // PAUSED
              onPauseRef.current?.(currentTime);
              prevTimeRef.current = currentTime;
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      // API skriptini yuklash (bir marta)
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [ytId]);

  // Member: sync qo'llash (VideoPlayer dagi drift compensation bilan bir xil formula)
  useEffect(() => {
    if (isOwner || syncIsPlaying === undefined) return;
    const player = playerRef.current;
    if (!player) return;

    const syncKey = `${syncTime}-${syncIsPlaying}`;
    if (lastSyncKeyRef.current === syncKey) return;
    lastSyncKeyRef.current = syncKey;

    applyingSyncRef.current = true;

    // Drift compensation: server yuborgan vaqtdan beri qancha o'tdi
    let targetTime = syncTime ?? 0;
    if (syncTimestamp && syncIsPlaying) {
      const elapsed = Math.max(0, (Date.now() - syncTimestamp) / 1000);
      targetTime = targetTime + elapsed;
    }

    if (Math.abs(player.getCurrentTime() - targetTime) > 1) {
      player.seekTo(targetTime, true);
    }

    if (syncIsPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }

    // Sync tugagach flag ni qaytarish (500ms — YT player react qilishi uchun)
    setTimeout(() => { applyingSyncRef.current = false; }, 500);
  }, [isOwner, syncTime, syncTimestamp, syncIsPlaying]);

  if (!ytId) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
        <p className="text-white/40 text-sm">Noto&apos;g&apos;ri YouTube URL</p>
      </div>
    );
  }

  const MemberVolumeIcon = memberMuted || memberVolume === 0 ? FaVolumeMute
    : memberVolume < 50 ? FaVolumeDown
    : FaVolumeUp;

  return (
    <div ref={wrapperRef} className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      {/* YouTube IFrame API bu div ni replace qiladi */}
      <div ref={containerRef} className="w-full h-full" title={title} />

      {/* Member overlay: iframe clicks BLOKLANADI (play/pause/seek imkonsiz)
          Faqat volume control ko'rinadi pastda */}
      {!isOwner && (
        <div className="absolute inset-0 z-10">
          {/* Shaffof overlay — YouTube iframe ga click o'tmasligi uchun */}
          <div className="absolute inset-0" />

          {/* Controls — pastda o'ng tomonda: volume + fullscreen */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            {/* Volume */}
            <div
              className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2"
              onMouseEnter={() => setShowVolSlider(true)}
              onMouseLeave={() => setShowVolSlider(false)}
            >
              <button
                onClick={handleMemberToggleMute}
                className="text-white/80 hover:text-white transition-colors"
              >
                <MemberVolumeIcon size={16} />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${showVolSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={2}
                  value={memberMuted ? 0 : memberVolume}
                  onChange={handleMemberVolumeChange}
                  className="w-20 h-1 rounded-full cursor-pointer accent-[#7C3AED]"
                />
              </div>
            </div>

            {/* Fullscreen */}
            <button
              onClick={handleMemberFullscreen}
              className="flex items-center justify-center h-9 w-9 bg-black/70 backdrop-blur-sm rounded-lg text-white/80 hover:text-white transition-colors"
              title={isFullscreen ? 'Kichiklashtirish' : 'Kattalashtirish'}
            >
              {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── YouTube — Backend Stream Proxy Player ──────────────────────── */
// YouTube URL → backend /youtube/stream-url (metadata + isLive)
//   VOD:  proxy URL /youtube/stream?url=...&token=... (range request, seeking)
//   Live: format.url to'g'ridan (HLS m3u8) → VideoPlayer HLS.js ile ishlaydi
// Agar backend fail bo'lsa → YouTubeIframePlayer fallback (sync ishlaydi)
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
      // next.config.mjs: /youtube/:path* → content service (rewrite)
      // ytdl.getInfo() cold start da 15-20s oladi — 30s timeout kerak
      const res = await apiClient.get<{ success: boolean; data: YtStreamInfo }>(
        `/youtube/stream-url?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 30_000 },
      );
      if (!res.data.success) throw new Error('stream-url failed');
      const info = res.data.data;

      const token = useAuthStore.getState().accessToken ?? '';
      const finalUrl = info.isLive
        ? info.url
        : `/youtube/stream?url=${encodeURIComponent(videoUrl)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

      setIsLive(info.isLive);
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
    // Backend proxy fail — YouTube IFrame API fallback (sync to'liq ishlaydi)
    return <YouTubeIframePlayer {...props} />;
  }

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
