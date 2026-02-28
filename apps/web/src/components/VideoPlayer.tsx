'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings } from 'lucide-react';
import { logger } from '@/lib/logger';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onProgress?: (progress: number, currentTime: number) => void;
  onEnded?: () => void;
  syncTime?: number;
  isOwner?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function VideoPlayer({
  src,
  poster,
  onProgress,
  onEnded,
  syncTime,
  isOwner = true,
  onPlay,
  onPause,
  onSeek,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // HLS setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          logger.error('HLS fatal error', { type: data.type, details: data.details });
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      logger.error('HLS supported emas bu brauzerda');
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  // Progress tracking (har 5 sek)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;

    progressIntervalRef.current = setInterval(() => {
      if (video.duration > 0) {
        const pct = (video.currentTime / video.duration) * 100;
        onProgress(pct, video.currentTime);
      }
    }, 5000);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [onProgress]);

  // Watch Party sync (±2s threshold)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || syncTime === undefined) return;
    if (Math.abs(video.currentTime - syncTime) > 2) {
      video.currentTime = syncTime;
      logger.info('Watch Party sync', { syncTime, diff: Math.abs(video.currentTime - syncTime) });
    }
  }, [syncTime]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isOwner) return;
    if (video.paused) {
      void video.play().catch((err) => logger.error('Play failed', err));
      onPlay?.();
    } else {
      video.pause();
      onPause?.();
    }
  }, [isOwner, onPlay, onPause]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !isOwner) return;
    const time = (parseFloat(e.target.value) / 100) * video.duration;
    video.currentTime = time;
    onSeek?.(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          video.currentTime -= 10;
          break;
        case 'ArrowRight':
          video.currentTime += 10;
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'KeyM':
          toggleMute();
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [togglePlay]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (v) setCurrentTime(v.currentTime);
        }}
        onDurationChange={() => {
          const v = videoRef.current;
          if (v) setDuration(v.duration);
        }}
        onEnded={onEnded}
        onClick={togglePlay}
      />

      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress bar */}
        <div className="px-4 pb-1">
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="range range-xs range-primary w-full cursor-pointer"
            aria-label="Video progress"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="btn btn-ghost btn-sm btn-circle text-white"
              aria-label={isPlaying ? 'Pauza' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="btn btn-ghost btn-sm btn-circle text-white"
              aria-label={isMuted ? 'Ovoz yoq' : 'Ovoz o\'chir'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="range range-xs range-primary w-20 hidden md:block cursor-pointer"
              aria-label="Ovoz balandligi"
            />
            <span className="text-xs text-white/80 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-sm btn-circle text-white"
              aria-label="Sifat sozlamalari"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="btn btn-ghost btn-sm btn-circle text-white"
              aria-label={isFullscreen ? 'Kichraytirish' : 'To\'liq ekran'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Play button overlay (center) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <div className="btn btn-circle btn-primary btn-lg opacity-90">
            <Play className="w-8 h-8 fill-current" />
          </div>
        </button>
      )}
    </div>
  );
}
