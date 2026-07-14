'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Loader2, Play, AlertCircle, Pause, Maximize, Minimize, Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';
import { trackClick } from '@/lib/analytics';
import { YouTubePlayer } from './YouTubePlayer';

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

// Mirrors mobile's extractYouTubeVideoId (apps/mobile/src/utils/videoPlayer.ts): matches `v=`
// anywhere in the query string, not just as the literal first param after "watch?" — a share
// link with another param first (e.g. "?list=...&v=..." from a playlist, or "?si=...&v=...")
// made the old anchored regex fail entirely, silently falling through to generic CDN extraction
// (never meant for YouTube) and spinning forever instead of rendering the YouTube player.
function getYouTubeId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
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
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        maxBufferLength: 8,      // fire canplay after 8s buffered, not default 30s
        maxMaxBufferLength: 30,
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
    const onVolChange = () => { setVolume(video.volume); setIsMuted(video.muted); };
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
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
      document.removeEventListener('fullscreenchange', onFullscreenChange);
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
    trackClick('video:toggle_play_pause');
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
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    v.muted = val === 0;
    setIsMuted(val === 0);
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    trackClick('video:toggle_mute');
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    trackClick('video:toggle_fullscreen');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  }

  function VolumeIcon({ size }: { size: number }) {
    if (isMuted || volume === 0) return <VolumeX size={size} />;
    if (volume < 0.5) return <Volume1 size={size} />;
    return <Volume2 size={size} />;
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
      {/* Video element */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="none"
        disableRemotePlayback
        disablePictureInPicture
        {...({ 'x-webkit-airplay': 'deny' } as Record<string, string>)}
        className="w-full h-full"
        onPlay={isOwner ? onPlay : undefined}
        onPause={isOwner ? onPause : undefined}
        onSeeked={isOwner ? onSeeked : undefined}
        onWaiting={() => {
          const v = videoRef.current;
          if (!v || v.paused) return;
          if (!isOwner) onBufferStart();
        }}
        onCanPlay={() => {
          if (!isOwner) onBufferEnd();
        }}
      />

      {/* Autoplay blocked overlay */}
      {autoplayBlocked && (
        <button
          onClick={() => { trackClick('video:autoplay_overlay'); onOverlayClick(); }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 cursor-pointer group/btn"
          aria-label="Нажмите чтобы воспроизвести"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover/btn:scale-110"
            style={{ background: 'rgba(124,58,237,0.85)', boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}>
            <Play size={32} className="text-white ml-1.5" fill="white" />
          </div>
          <span className="text-white/60 text-sm font-medium">Нажмите чтобы начать</span>
        </button>
      )}

      {/* Click area */}
      {!autoplayBlocked && (
        <div className="absolute inset-0 cursor-pointer" onClick={handleVideoAreaClick} />
      )}

      {/* Controls overlay */}
      {!autoplayBlocked && (
        <div
          className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 pointer-events-none ${
            controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'
          }`}
        >
          {/* Deep gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

          <div className="relative px-4 pb-4 pt-10">
            {/* Progress bar */}
            <div className="relative mb-3 group/progress">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                disabled={!isOwner || !duration}
                className="w-full cursor-pointer disabled:cursor-default"
                style={{
                  accentColor: '#7c3aed',
                  height: '3px',
                  appearance: 'none',
                  background: `linear-gradient(to right, #7c3aed ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 0%)`,
                  borderRadius: '2px',
                }}
                aria-label="Прогресс"
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-3">
              {/* Play/Pause — owner only */}
              {isOwner && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleVideoAreaClick(); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:bg-white/10 active:scale-90 flex-shrink-0"
                  aria-label={isPaused ? 'Воспроизвести' : 'Пауза'}
                >
                  {isPaused
                    ? <Play size={20} fill="currentColor" />
                    : <Pause size={20} fill="currentColor" />}
                </button>
              )}

              {/* Volume */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Mute"
                >
                  <VolumeIcon size={16} />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolume}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 cursor-pointer"
                  style={{
                    accentColor: '#7c3aed',
                    height: '3px',
                    appearance: 'none',
                    background: `linear-gradient(to right, rgba(255,255,255,0.8) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 0%)`,
                    borderRadius: '2px',
                  }}
                  aria-label="Громкость"
                />
              </div>

              {/* Time */}
              <span className="text-white/60 text-xs tabular-nums flex-shrink-0">
                {fmtTime(currentTime)}
                {duration > 0 && <span className="text-white/30"> / {fmtTime(duration)}</span>}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Non-owner indicator */}
              {!isOwner && (
                <span className="text-[10px] text-white/30 font-medium uppercase tracking-wide flex-shrink-0">
                  viewing
                </span>
              )}

              {/* Fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                aria-label={isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
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
  // Prevents calling video.play() a second time while the first promise is still pending.
  // v.paused stays true until play() resolves, so rapid clicks would queue multiple play() calls
  // each firing onPlay → sendPlay, causing a storm of PLAY events and viewer chaos.
  const playPendingRef = useRef(false);
  // Debounces socket emissions: rapid play→pause→play within 80ms collapses to one final event.
  // Without this, each browser play/pause event fires a socket event, flooding the server
  // and delivering conflicting VIDEO_PLAY/VIDEO_PAUSE to viewers faster than they can process.
  const pendingEmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const [proxySrc, setProxySrc] = useState<string | null>(null);
  const [isHls, setIsHls] = useState(false);
  const [extractPoster, setExtractPoster] = useState<string | undefined>(undefined);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const extractedForUrl = useRef<string>('');
  const progressLoadedRef = useRef<string>('');
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoUrl = room?.videoUrl ?? '';
  const ytId = getYouTubeId(videoUrl);
  const isEmbed = !!ytId;
  // Extract all non-YouTube URLs — content service handles Rutube, VK, and all other platforms
  const needsExtract = !!videoUrl && !ytId;
  const directSrc = needsExtract ? proxySrc : null;

  // Extract → proxy URL for any non-YouTube source
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

    // Compensate for delivery latency: a PLAY that took 200ms to arrive should land at the owner's
    // CURRENT position, not where they were when they pressed play. serverTimestamp is already
    // normalised to this client's clock (use-watch-party). Only while playing — pause is a fixed
    // position. Capped at 30s so a stale timestamp can't seek wildly past the real position.
    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(30, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;

    if (Math.abs(video.currentTime - target) > 0.3) {
      video.currentTime = target;
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
        .catch((e: unknown) => {
          // AbortError = play() interrupted by rapid pause — not a real block, don't show overlay
          if ((e as DOMException)?.name !== 'AbortError') setAutoplayBlocked(true);
        });
    } else if (!syncState.isPlaying && !video.paused) {
      video.pause();
      setAutoplayBlocked(false);
    }

    setTimeout(() => { isRemoteAction.current = false; }, 200);
  }, [syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp, isEmbed, directSrc, isOwner]);

  // Cleanup debounce timer on unmount to avoid post-unmount state updates
  useEffect(() => () => {
    if (pendingEmitRef.current) clearTimeout(pendingEmitRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  // Load saved progress for owner when a non-YouTube video is ready
  useEffect(() => {
    if (!isOwner || !videoUrl || !proxySrc || progressLoadedRef.current === videoUrl) return;
    progressLoadedRef.current = videoUrl;

    fetch(`/api/content/watch-progress?url=${encodeURIComponent(videoUrl)}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((body: unknown) => {
        const data = (body as { data?: { position?: number } }).data;
        const position = data?.position ?? 0;
        if (position > 30) {
          const fmtTime = (s: number) =>
            `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
          toast({
            title: `Continue from ${fmtTime(position)}?`,
            description: 'You watched this before',
            action: {
              altText: 'Resume',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          });
          // Expose seek via a brief delay so videoRef is attached to src
          setTimeout(() => {
            if (videoRef.current) videoRef.current.currentTime = position;
          }, 1500);
        }
      })
      .catch(() => {});
  }, [isOwner, videoUrl, proxySrc]);

  // Save progress every 10s for owner
  useEffect(() => {
    if (!isOwner || isEmbed || !proxySrc) return;

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || !videoUrl || video.paused) return;
      fetch('/api/content/watch-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          videoUrl,
          position: video.currentTime,
          duration: video.duration || 0,
        }),
      }).catch(() => {});
    }, 10_000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isOwner, isEmbed, proxySrc, videoUrl]);

  // Owner heartbeat every 1s — dep on directSrc so interval starts after extraction completes
  // and videoRef.current is guaranteed set (NativeVideoPlayer renders when proxySrc is ready)
  useEffect(() => {
    const video = videoRef.current;
    if (!isOwner || isEmbed || !video) return;
    const id = setInterval(() => {
      if (!video.paused) onHeartbeat(video.currentTime);
    }, 1000);
    return () => clearInterval(id);
  }, [isOwner, isEmbed, onHeartbeat, directSrc]);

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
    if (isRemoteAction.current) return;
    if (isOwner) ownerExplicitlyPausedRef.current = false;
    setAutoplayBlocked(false);
    playPendingRef.current = false; // play() resolved — clear guard
    // Debounce: cancel any pending emit (e.g. a pause that followed this play within 80ms)
    // and schedule the play emit. This collapses rapid play→pause→play into one final event.
    if (pendingEmitRef.current) clearTimeout(pendingEmitRef.current);
    pendingEmitRef.current = setTimeout(() => {
      pendingEmitRef.current = null;
      if (videoRef.current) onPlay(videoRef.current.currentTime);
    }, 80);
  }, [onPlay, isOwner]);

  const handlePause = useCallback(() => {
    if (isRemoteAction.current) return;
    if (isOwner) ownerExplicitlyPausedRef.current = true;
    if (pendingEmitRef.current) clearTimeout(pendingEmitRef.current);
    pendingEmitRef.current = setTimeout(() => {
      pendingEmitRef.current = null;
      if (videoRef.current) onPause(videoRef.current.currentTime);
    }, 80);
  }, [onPause, isOwner]);

  const handleSeeked = useCallback(() => {
    if (!isRemoteAction.current && videoRef.current) {
      onSeek(videoRef.current.currentTime);
    }
  }, [onSeek]);

  function handleOverlayClick() {
    // Guard: v.paused stays true while play() promise is pending, so rapid clicks
    // would queue multiple play() calls. Block until the first resolves.
    if (playPendingRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    playPendingRef.current = true;
    v.play()
      .then(() => setAutoplayBlocked(false))
      .catch((e: unknown) => {
        playPendingRef.current = false;
        if ((e as DOMException)?.name !== 'AbortError') setAutoplayBlocked(true);
      });
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

  // ── YouTube — synced via the official IFrame Player API ─────────────────────
  // (raw iframe was display-only; YouTubePlayer broadcasts owner play/pause/seek + heartbeat and
  //  drift-corrects followers so the room actually watches together.)

  if (ytId) {
    return (
      <YouTubePlayer
        videoId={ytId}
        isOwner={isOwner}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onHeartbeat={onHeartbeat}
      />
    );
  }

  // ── Any non-YouTube source (Rutube, VK, Vimeo, direct, etc.) — extract + proxy ───

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

  return null;
}
