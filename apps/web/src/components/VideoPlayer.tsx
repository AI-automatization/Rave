'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  FaPlay, FaPause, FaVolumeUp, FaVolumeDown, FaVolumeMute,
  FaExpand, FaCompress,
} from 'react-icons/fa';
import { MdReplay10, MdForward10, MdPictureInPictureAlt, MdSpeed } from 'react-icons/md';
import { logger } from '@/lib/logger';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onProgress?: (progress: number, currentTime: number) => void;
  onEnded?: () => void;
  syncTime?: number;
  syncIsPlaying?: boolean;
  isOwner?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
}

export function VideoPlayer({
  src,
  poster,
  title,
  onProgress,
  onEnded,
  syncTime,
  syncIsPlaying,
  isOwner = true,
  onPlay,
  onPause,
  onSeek,
}: VideoPlayerProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const progressRef   = useRef<HTMLDivElement>(null);
  const hlsRef        = useRef<Hls | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for stable access inside event listeners (avoid stale closures)
  const syncIsPlayingRef = useRef<boolean | undefined>(syncIsPlaying);
  const isOwnerRef       = useRef(isOwner);
  const onPlayRef        = useRef(onPlay);
  const onPauseRef       = useRef(onPause);

  const [isPlaying,       setIsPlaying]       = useState(false);
  const [isMuted,         setIsMuted]         = useState(false);
  const [volume,          setVolume]          = useState(1);
  const [currentTime,     setCurrentTime]     = useState(0);
  const [duration,        setDuration]        = useState(0);
  const [buffered,        setBuffered]        = useState(0);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [showControls,    setShowControls]    = useState(true);
  const [isBuffering,     setIsBuffering]     = useState(false);
  const [speed,           setSpeed]           = useState(1);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showVolSlider,   setShowVolSlider]   = useState(false);
  const [skipFlash,       setSkipFlash]       = useState<'left' | 'right' | null>(null);
  const [hoverTime,       setHoverTime]       = useState<{ time: number; x: number } | null>(null);
  const [hint,            setHint]            = useState<string | null>(null);

  /* ── HLS / MP4 setup ────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const isHls = src.includes('.m3u8');
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) logger.error('HLS fatal error', { type: data.type, details: data.details });
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      video.src = src;
    }
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [src]);

  /* ── Progress tracking every 5s ─────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;
    progressInterval.current = setInterval(() => {
      if (video.duration > 0)
        onProgress((video.currentTime / video.duration) * 100, video.currentTime);
    }, 5000);
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [onProgress]);

  /* ── Keep refs fresh (must be before sync effects) ─────────── */
  useEffect(() => { syncIsPlayingRef.current = syncIsPlaying; }, [syncIsPlaying]);
  useEffect(() => { isOwnerRef.current = isOwner; }, [isOwner]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);

  /* ── Watch-Party sync (combined seek → play, avoids race condition) ── */
  // Two separate effects (seek + play) had a race: canplay fired at position 0
  // BEFORE the seek happened → video.play() interrupted by seek → silent rejection.
  // Fix: combine into one effect — seek first, play only after data is ready.
  useEffect(() => {
    if (isOwner) return;
    const video = videoRef.current;
    if (!video) return;

    const needsSeek = syncTime !== undefined && Math.abs(video.currentTime - syncTime) > 2;

    const applyPlay = () => {
      if (syncIsPlaying === true) void video.play().catch(() => {});
      else if (syncIsPlaying === false) video.pause();
    };

    const cleanup: (() => void)[] = [];

    if (video.readyState >= 3) {
      // Enough data buffered — act immediately
      if (needsSeek) {
        video.currentTime = syncTime!;
        video.addEventListener('seeked', applyPlay, { once: true });
        cleanup.push(() => video.removeEventListener('seeked', applyPlay));
      } else {
        applyPlay();
      }
    } else if (video.readyState >= 1) {
      // Metadata known (can seek), but not enough data to play yet
      if (needsSeek) {
        video.currentTime = syncTime!;
        // Seek triggers HLS to load new segment → canplay fires when ready
      }
      const onCanPlay = () => applyPlay();
      video.addEventListener('canplay', onCanPlay, { once: true });
      cleanup.push(() => video.removeEventListener('canplay', onCanPlay));
    } else {
      // No metadata yet — wait for it, then seek+play
      const onMetadata = () => {
        if (needsSeek) video.currentTime = syncTime!;
        video.addEventListener('canplay', applyPlay, { once: true });
      };
      video.addEventListener('loadedmetadata', onMetadata, { once: true });
      cleanup.push(() => video.removeEventListener('loadedmetadata', onMetadata));
    }

    return () => cleanup.forEach((fn) => fn());
  }, [isOwner, syncTime, syncIsPlaying]);

  /* ── Non-owner guard: block headphones + PiP controls ──────── */
  // Media Session intercepts headphone buttons and PiP overlay controls.
  // Direct listeners catch any other path that bypasses Media Session.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        if (isOwnerRef.current) {
          void video.play().catch(() => {});
          onPlayRef.current?.();
        } else if (syncIsPlayingRef.current === true) {
          // Owner is playing — keep member in sync
          void video.play().catch(() => {});
        }
        // else: owner is paused — ignore play request from member
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (isOwnerRef.current) {
          video.pause();
          onPauseRef.current?.();
        } else if (syncIsPlayingRef.current === true) {
          // Owner is playing — refuse pause, re-enforce play
          void video.play().catch(() => {});
        }
        // else: owner is paused — video is already paused, no-op
      });
    }

    // Fallback: catch direct pause/play on video element (some PiP implementations)
    const onDirectPause = () => {
      if (!isOwnerRef.current && syncIsPlayingRef.current === true) {
        void video.play().catch(() => {});
      }
    };
    const onDirectPlay = () => {
      if (!isOwnerRef.current && syncIsPlayingRef.current === false) {
        video.pause();
      }
    };

    video.addEventListener('pause', onDirectPause);
    video.addEventListener('play', onDirectPlay);

    return () => {
      video.removeEventListener('pause', onDirectPause);
      video.removeEventListener('play', onDirectPlay);
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
        } catch { /* ignore */ }
      }
    };
  }, []);

  /* ── Fullscreen listener ────────────────────────────────────── */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  /* ── Helpers ─────────────────────────────────────────────────── */
  const showHint = useCallback((msg: string) => {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 1200);
  }, []);

  const flashSkip = useCallback((dir: 'left' | 'right') => {
    setSkipFlash(dir);
    setTimeout(() => setSkipFlash(null), 550);
  }, []);

  const showControlsTemp = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  /* ── Actions ─────────────────────────────────────────────────── */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isOwner) return;
    if (video.paused) { void video.play().catch((e) => logger.error('Play failed', e)); onPlay?.(); }
    else { video.pause(); onPause?.(); }
  }, [isOwner, onPlay, onPause]);

  const skip = useCallback((sec: number) => {
    const video = videoRef.current;
    if (!video || !isOwner) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + sec));
    onSeek?.(video.currentTime);
    flashSkip(sec > 0 ? 'right' : 'left');
    showHint(sec > 0 ? `+${sec}s` : `${sec}s`);
  }, [isOwner, onSeek, flashSkip, showHint]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) void containerRef.current.requestFullscreen();
    else void document.exitFullscreen();
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch { /* not supported in this browser */ }
  }, []);

  const applySpeed = useCallback((s: number) => {
    const video = videoRef.current;
    if (!video || !isOwner) return;
    video.playbackRate = s;
    setSpeed(s);
    setShowSettings(false);
    showHint(`${s}x`);
  }, [isOwner, showHint]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !isOwner || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pct * video.duration;
    if (!isFinite(time)) return;
    video.currentTime = time;
    onSeek?.(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; }
    setIsMuted(v === 0);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const pct  = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime({ time: pct * duration, x });
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isOwner) return;
    const rect = containerRef.current.getBoundingClientRect();
    skip(e.clientX - rect.left < rect.width / 2 ? -10 : 10);
  };

  /* ── Keyboard shortcuts ─────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      switch (e.code) {
        case 'Space':
        case 'KeyK':   e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft':  e.preventDefault(); skip(-10); break;
        case 'ArrowRight': e.preventDefault(); skip(10);  break;
        case 'ArrowUp': {
          e.preventDefault();
          const v = Math.min(1, volume + 0.1);
          setVolume(v);
          if (video) { video.volume = v; video.muted = false; }
          setIsMuted(false);
          showHint(`🔊 ${Math.round(v * 100)}%`);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const v = Math.max(0, volume - 0.1);
          setVolume(v);
          if (video) { video.volume = v; }
          showHint(`🔊 ${Math.round(v * 100)}%`);
          break;
        }
        case 'KeyF': toggleFullscreen(); break;
        case 'KeyM': toggleMute(); break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [togglePlay, skip, toggleFullscreen, toggleMute, volume, showHint]);

  /* ── Derived values ─────────────────────────────────────────── */
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const VolumeIcon  = isMuted || volume === 0 ? FaVolumeMute : volume < 0.5 ? FaVolumeDown : FaVolumeUp;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden select-none"
      onMouseMove={showControlsTemp}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); setHoverTime(null); }}
      onDoubleClick={handleDoubleClick}
      onClick={() => { if (showSettings) setShowSettings(false); }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          setCurrentTime(v.currentTime);
          if (v.buffered.length > 0)
            setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
        }}
        onDurationChange={() => { const v = videoRef.current; if (v) setDuration(v.duration); }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onEnded={onEnded}
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
      />

      {/* Skip flash: left */}
      {skipFlash === 'left' && (
        <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center pointer-events-none z-20">
          <div className="flex flex-col items-center gap-1 text-white/80 animate-pulse">
            <MdReplay10 size={52} />
            <span className="text-sm font-bold -mt-1">-10s</span>
          </div>
        </div>
      )}
      {/* Skip flash: right */}
      {skipFlash === 'right' && (
        <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center pointer-events-none z-20">
          <div className="flex flex-col items-center gap-1 text-white/80 animate-pulse">
            <MdForward10 size={52} />
            <span className="text-sm font-bold -mt-1">+10s</span>
          </div>
        </div>
      )}

      {/* Shortcut hint badge */}
      {hint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/70 text-white text-sm px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm pointer-events-none">
          {hint}
        </div>
      )}

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-14 h-14 border-4 border-white/20 border-t-[#7C3AED] rounded-full animate-spin" />
        </div>
      )}

      {/* Big play button overlay — owner only */}
      {!isPlaying && !isBuffering && isOwner && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="w-20 h-20 rounded-full bg-[#7C3AED]/25 border-2 border-[#7C3AED]/80 flex items-center justify-center shadow-[0_0_60px_rgba(124,58,237,0.9)] hover:scale-110 transition-transform backdrop-blur-sm">
            <FaPlay size={28} className="text-white ml-1 fill-current" />
          </div>
        </button>
      )}

      {/* Paused indicator for non-owners */}
      {!isPlaying && !isBuffering && !isOwner && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-black/50 px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10">
            <FaPause size={22} className="text-white/60" />
            <span className="text-white/60 text-xs font-medium">Egasi toxtatdi</span>
          </div>
        </div>
      )}

      {/* Controls layer */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

        {/* Title top-left */}
        {title && (
          <div className="absolute top-3 left-4 z-10 max-w-[60%]">
            <p className="text-white text-sm font-medium truncate drop-shadow-lg">{title}</p>
          </div>
        )}

        {/* PiP top-right */}
        <div className="absolute top-3 right-4 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); void togglePiP(); }}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Picture in Picture"
          >
            <MdPictureInPictureAlt size={18} />
          </button>
        </div>

        {/* Bottom controls */}
        <div className="relative z-10 px-3 pb-2">

          {/* Progress bar */}
          <div
            ref={progressRef}
            className={`relative h-6 flex items-center group/prog mb-0.5 ${isOwner ? 'cursor-pointer' : 'cursor-default'}`}
            onMouseMove={isOwner ? handleProgressHover : undefined}
            onMouseLeave={() => setHoverTime(null)}
            onClick={isOwner ? handleSeek : undefined}
          >
            {/* Hover time tooltip */}
            {hoverTime && (
              <div
                className="absolute -top-8 bg-black/90 text-white text-[11px] px-2 py-1 rounded pointer-events-none z-30 -translate-x-1/2 whitespace-nowrap"
                style={{ left: hoverTime.x }}
              >
                {formatTime(hoverTime.time)}
              </div>
            )}
            {/* Track */}
            <div className="w-full h-1 group-hover/prog:h-1.5 transition-all duration-150 rounded-full bg-white/25 relative overflow-visible">
              {/* Buffered */}
              <div
                className="absolute inset-y-0 left-0 bg-white/35 rounded-full transition-all"
                style={{ width: `${buffered}%` }}
              />
              {/* Played */}
              <div
                className="absolute inset-y-0 left-0 bg-[#7C3AED] rounded-full shadow-[0_0_8px_rgba(124,58,237,0.8)]"
                style={{ width: `${progressPct}%` }}
              />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_12px_rgba(124,58,237,1)] opacity-0 group-hover/prog:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPct}% - 7px)` }}
              />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-2">

            {/* Left group */}
            <div className="flex items-center gap-0.5">
              {/* Play/Pause */}
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="flex items-center justify-center h-9 w-9 rounded-lg text-white hover:bg-white/10 transition-all"
              >
                {isPlaying ? <FaPause size={15} /> : <FaPlay size={15} />}
              </button>

              {/* Skip back */}
              <button
                onClick={(e) => { e.stopPropagation(); skip(-10); }}
                className="flex items-center justify-center h-9 w-9 rounded-lg text-white hover:bg-white/10 transition-all"
                title="Rewind 10s"
              >
                <MdReplay10 size={22} />
              </button>

              {/* Skip forward */}
              <button
                onClick={(e) => { e.stopPropagation(); skip(10); }}
                className="flex items-center justify-center h-9 w-9 rounded-lg text-white hover:bg-white/10 transition-all"
                title="Forward 10s"
              >
                <MdForward10 size={22} />
              </button>

              {/* Volume group */}
              <div
                className="flex items-center gap-1"
                onMouseEnter={() => setShowVolSlider(true)}
                onMouseLeave={() => setShowVolSlider(false)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="flex items-center justify-center h-9 w-9 rounded-lg text-white hover:bg-white/10 transition-all"
                >
                  <VolumeIcon size={16} />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${showVolSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}
                >
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 h-1 rounded-full cursor-pointer accent-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Time */}
              <span className="text-white text-[11px] tabular-nums ml-1 hidden sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right group */}
            <div className="flex items-center gap-0.5 relative">

              {/* Speed / Settings — owner only */}
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                    className="flex items-center gap-1 h-9 px-2 rounded-lg text-white hover:bg-white/10 transition-all text-xs font-semibold"
                    title="Playback speed"
                  >
                    <MdSpeed size={19} />
                    {speed !== 1 && <span className="text-[10px]">{speed}x</span>}
                  </button>

                  {/* Speed dropdown */}
                  {showSettings && (
                    <div
                      className="absolute bottom-12 right-0 bg-[#111118] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 w-32"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2 text-[10px] text-white/40 font-semibold uppercase tracking-widest border-b border-white/10">
                        Speed
                      </div>
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => applySpeed(s)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            speed === s
                              ? 'text-[#7C3AED] bg-[#7C3AED]/10 font-semibold'
                              : 'text-white hover:bg-white/5'
                          }`}
                        >
                          {s === 1 ? 'Normal' : `${s}x`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="flex items-center justify-center h-9 w-9 rounded-lg text-white hover:bg-white/10 transition-all"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <FaCompress size={15} /> : <FaExpand size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
