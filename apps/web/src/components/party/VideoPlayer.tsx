'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Loader2, Play, AlertCircle, Pause, Maximize } from 'lucide-react';
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

// Must use noop () => {} handlers — null reverts to browser defaults (shows OS player).
// Empty handlers tell the OS "app handles media itself → no system UI needed".
const MEDIA_ACTIONS: MediaSessionAction[] = [
  'play', 'pause', 'seekto', 'seekbackward', 'seekforward',
  'previoustrack', 'nexttrack', 'stop',
];
const noop = () => {};

function suppressMacOsPlayer() {
  if (typeof navigator === 'undefined') return;
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
    for (const action of MEDIA_ACTIONS) {
      try { navigator.mediaSession.setActionHandler(action, noop); } catch { /* unsupported */ }
    }
  }
}

// ── Custom video player — no native controls ───────────────────────────────────
// Using native `controls` attribute triggers: macOS AirPlay/PiP buttons, Android Chrome
// built-in controls, and macOS "Now Playing" HUD. Custom controls avoid all of this.

interface NativeProps {
  src: string;
  isHls: boolean;
  poster?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  autoplayBlocked: boolean;
  isOwner: boolean;
  startPosition?: number; // seek here immediately on load (join late → skip to owner position)
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
  startPosition,
  onPlay,
  onPause,
  onSeeked,
  onBufferStart,
  onBufferEnd,
  onOverlayClick,
}: NativeProps) {
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [isPaused, setIsPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);

  // HLS setup + macOS suppression
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    suppressMacOsPlayer();

    if (!isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS or plain MP4 — seek after metadata loads
      video.src = src;
      if (startPosition && startPosition > 0.5) {
        video.addEventListener('loadedmetadata', () => {
          if (Math.abs(video.currentTime - startPosition) > 0.3) video.currentTime = startPosition;
        }, { once: true });
      }
      video.addEventListener('play', suppressMacOsPlayer, { passive: true });
      return;
    }

    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) { video.src = src; return; }
      hlsRef.current?.destroy();
      // startPosition in config tells HLS.js to buffer segments from owner's
      // current position instead of from 0 — crucial when joining mid-playback
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startPosition: (startPosition && startPosition > 0.5) ? startPosition : -1,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.once(Hls.Events.MANIFEST_PARSED, suppressMacOsPlayer);
      video.addEventListener('play', suppressMacOsPlayer, { passive: true });
    }).catch(() => { video.src = src; });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, isHls, videoRef]);

  // Mirror video state for custom controls UI
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlayEvt = () => setIsPaused(false);
    const onPauseEvt = () => {
      setIsPaused(true);
      // Keep HLS.js loading even when paused so segments are ready on resume.
      // Without this, democratic pause (sync-effect video.pause) stops HLS loading,
      // canplay never fires, BUFFER_END is never sent, and 30s safety timeout loops.
      if (hlsRef.current) hlsRef.current.startLoad();
    };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onMeta = () => { if (isFinite(video.duration)) setDuration(video.duration); };
    const onVolChange = () => setVolume(video.volume);
    video.addEventListener('play', onPlayEvt);
    video.addEventListener('pause', onPauseEvt);
    video.addEventListener('timeupdate', onTimeUpdate, { passive: true });
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('durationchange', onMeta);
    video.addEventListener('volumechange', onVolChange);
    return () => {
      video.removeEventListener('play', onPlayEvt);
      video.removeEventListener('pause', onPauseEvt);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('durationchange', onMeta);
      video.removeEventListener('volumechange', onVolChange);
    };
  }, [videoRef]);

  // Show controls temporarily (for mobile tap)
  function revealControls() {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }

  function handleVideoAreaClick() {
    revealControls();
    if (!isOwner) return;
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) onOverlayClick();
    else v.pause();
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isOwner) return;
    const v = videoRef.current;
    if (v) v.currentTime = Number(e.target.value);
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (v) v.volume = Number(e.target.value);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  }

  function fmtTime(s: number) {
    if (!isFinite(s) || s < 0) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }

  const controlsVisible = showControls;

  return (
    <div
      ref={containerRef}
      className="aspect-video bg-black rounded-xl overflow-hidden relative group select-none"
    >
      {/* Hidden video — no native controls to prevent Mac/Android native player */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="none"
        disableRemotePlayback
        disablePictureInPicture
        // eslint-disable-next-line react/no-unknown-property
        {...({ 'x-webkit-airplay': 'deny' } as Record<string, string>)}
        className="w-full h-full"
        onPlay={isOwner ? onPlay : undefined}
        onPause={isOwner ? onPause : undefined}
        onSeeked={isOwner ? onSeeked : undefined}
        onWaiting={() => {
          const v = videoRef.current;
          if (!v || v.paused) return; // skip if deliberately paused
          // Owner never triggers democratic pause — owner's initial buffer would deadlock:
          // BUFFER_START → VIDEO_PAUSE → Safari stops loading → canplay never fires → 30s loop.
          // Viewers trigger it; owner just loads locally and its BUFFER_END helps reconcile.
          if (!isOwner) onBufferStart();
        }}
        onCanPlay={() => {
          onBufferEnd(); // always send — harmless for owner (srem noop if not in set)
        }}
      />

      {/* Autoplay blocked overlay — visible to all (non-owner click starts local only) */}
      {autoplayBlocked && (
        <button
          onClick={onOverlayClick}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 cursor-pointer group/btn"
          aria-label="Нажмите чтобы воспроизвести"
        >
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover/btn:bg-white/20 transition-colors">
            <Play size={28} className="text-white ml-1" fill="white" />
          </div>
          <span className="text-white/70 text-sm">Нажмите чтобы начать</span>
        </button>
      )}

      {/* Clickable area — tap reveals controls; owner tap also toggles play/pause */}
      {!autoplayBlocked && (
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={handleVideoAreaClick}
        />
      )}

      {/* Custom controls bar — hover (desktop) or tap (mobile) */}
      {!autoplayBlocked && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pt-10 pb-3 px-3 transition-opacity duration-200 pointer-events-none ${
            controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'
          }`}
        >
          {/* Seek bar — visible to all, seekable only by owner */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isOwner || !duration}
            className="w-full h-1 mb-2 cursor-pointer disabled:cursor-default disabled:opacity-50"
            style={{ accentColor: '#7c3aed' }}
            aria-label="Прогресс"
          />

          <div className="flex items-center gap-2">
            {/* Play/pause — owner only */}
            {isOwner && (
              <button
                onClick={(e) => { e.stopPropagation(); handleVideoAreaClick(); }}
                className="text-white hover:text-violet-300 transition-colors flex-shrink-0"
                aria-label={isPaused ? 'Воспроизвести' : 'Пауза'}
              >
                {isPaused
                  ? <Play size={18} fill="currentColor" />
                  : <Pause size={18} fill="currentColor" />}
              </button>
            )}

            {/* Time */}
            <span className="text-white/50 text-xs tabular-nums flex-shrink-0">
              {fmtTime(currentTime)}{duration > 0 ? ` / ${fmtTime(duration)}` : ''}
            </span>

            <div className="ml-auto flex items-center gap-3">
              {/* Volume */}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolume}
                onClick={(e) => e.stopPropagation()}
                className="w-16 h-1 cursor-pointer"
                style={{ accentColor: '#7c3aed' }}
                aria-label="Громкость"
              />
              {/* Fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                aria-label="Полный экран"
              >
                <Maximize size={15} />
              </button>
            </div>
          </div>
        </div>
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
  // Tracks owner's deliberate pause to prevent democratic buffer resume from auto-playing.
  // Set true only when owner explicitly pauses (!isRemoteAction), false when they explicitly play.
  // This avoids the race condition where sync-effect pause (isRemoteAction=true) sets roomUserPaused
  // on the server and then resumeRoom is permanently blocked.
  const ownerExplicitlyPausedRef = useRef(false);
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
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed || !directSrc) return;

    isRemoteAction.current = true;

    if (Math.abs(video.currentTime - syncState.currentTime) > 0.3) {
      video.currentTime = syncState.currentTime;
    }

    if (syncState.isPlaying && video.paused) {
      // Don't auto-resume if owner deliberately paused — only their own play click should resume.
      // ownerExplicitlyPausedRef is cleared in handlePlay and set in handlePause (user-initiated only).
      if (isOwner && ownerExplicitlyPausedRef.current) {
        isRemoteAction.current = false;
        return;
      }
      video.play()
        .then(() => setAutoplayBlocked(false))
        .catch(() => setAutoplayBlocked(true));
    } else if (!syncState.isPlaying && !video.paused) {
      video.pause();
      setAutoplayBlocked(false);
    }

    setTimeout(() => { isRemoteAction.current = false; }, 200);
  }, [syncState.currentTime, syncState.isPlaying, isEmbed, directSrc]);

  // Owner heartbeat every 1s (faster = tighter viewer sync)
  useEffect(() => {
    const video = videoRef.current;
    if (!isOwner || isEmbed || !video) return;
    const id = setInterval(() => {
      if (!video.paused) onHeartbeat(video.currentTime);
    }, 1000);
    return () => clearInterval(id);
  }, [isOwner, isEmbed, onHeartbeat]);

  // Non-owner drift correction via heartbeat.
  // Tiered: >2s → hard seek; >0.5s → 1.15x rate; >0.2s → 1.08x rate; else restore.
  // 1s heartbeat + tiered rates close 1s drift in ~6 cycles (~6s).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed || isOwner || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    const drift = expected - video.currentTime;
    const absDrift = Math.abs(drift);
    if (absDrift > 2) {
      isRemoteAction.current = true;
      video.playbackRate = 1.0;
      video.currentTime = expected;
      setTimeout(() => { isRemoteAction.current = false; }, 200);
    } else if (absDrift > 0.5) {
      video.playbackRate = drift > 0 ? 1.15 : 0.85;
    } else if (absDrift > 0.2) {
      video.playbackRate = drift > 0 ? 1.08 : 0.92;
    } else {
      video.playbackRate = 1.0;
    }
  }, [heartbeat, isEmbed, isOwner, syncState.isPlaying]);

  const handlePlay = useCallback(() => {
    if (!isRemoteAction.current && videoRef.current) {
      if (isOwner) ownerExplicitlyPausedRef.current = false;
      setAutoplayBlocked(false);
      onPlay(videoRef.current.currentTime);
    }
  }, [onPlay, isOwner]);

  const handlePause = useCallback(() => {
    if (!isRemoteAction.current && videoRef.current) {
      if (isOwner) ownerExplicitlyPausedRef.current = true;
      onPause(videoRef.current.currentTime);
    }
  }, [onPause, isOwner]);

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
          startPosition={syncState.currentTime}
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
      startPosition={syncState.currentTime}
      onPlay={handlePlay}
      onPause={handlePause}
      onSeeked={handleSeeked}
      onBufferStart={onBufferStart}
      onBufferEnd={onBufferEnd}
      onOverlayClick={handleOverlayClick}
    />
  );
}
