'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
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

function getYouTubeId(url: string): string | null {
  // Handles: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

function getVkEmbedUrl(url: string): string | null {
  const match = url.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (!match) return null;
  return `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=1`;
}

function getRutubeEmbedUrl(url: string): string | null {
  const match = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  return `https://rutube.ru/play/embed/${match[1]}/`;
}

export function VideoPlayer({ onPlay, onPause, onSeek, onHeartbeat, onBufferStart, onBufferEnd }: Props) {
  const room = useWatchPartyStore((s) => s.room);
  const isConnected = useWatchPartyStore((s) => s.isConnected);
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = !!(room && currentUser && room.ownerId === currentUser._id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isRemoteAction = useRef(false);

  const videoUrl = room?.videoUrl ?? '';
  const ytId = getYouTubeId(videoUrl);
  const vkEmbedUrl = !ytId ? getVkEmbedUrl(videoUrl) : null;
  const rutubeEmbedUrl = !ytId && !vkEmbedUrl ? getRutubeEmbedUrl(videoUrl) : null;
  const isEmbed = !!(ytId || vkEmbedUrl || rutubeEmbedUrl);

  // Sync incoming state to HTML5 video element (not applicable to embeds)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;

    isRemoteAction.current = true;

    if (Math.abs(video.currentTime - syncState.currentTime) > 2) {
      video.currentTime = syncState.currentTime;
    }

    if (syncState.isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!syncState.isPlaying && !video.paused) {
      video.pause();
    }

    setTimeout(() => { isRemoteAction.current = false; }, 200);
  }, [syncState.currentTime, syncState.isPlaying, isEmbed]);

  // Owner sends heartbeat every 2s so peers can do drift correction
  useEffect(() => {
    const video = videoRef.current;
    if (!isOwner || isEmbed || !video) return;
    const id = setInterval(() => {
      if (!video.paused) onHeartbeat(video.currentTime);
    }, 2000);
    return () => clearInterval(id);
  }, [isOwner, isEmbed, onHeartbeat]);

  // Non-owner: apply drift correction when heartbeat arrives
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

  // Room is loading (REST fetch in progress or socket not yet joined)
  if (!room) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-violet-400" />
      </div>
    );
  }

  // Room loaded but no video URL set
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

  // YouTube embed
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

  // VK embed
  if (vkEmbedUrl) {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={vkEmbedUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          title="VK player"
        />
      </div>
    );
  }

  // Rutube embed
  if (rutubeEmbedUrl) {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={rutubeEmbedUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          title="Rutube player"
        />
      </div>
    );
  }

  // HTML5 video (direct .mp4 / .m3u8 links)
  // playsInline prevents macOS from opening video in a separate app/fullscreen
  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full"
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeeked}
        onWaiting={onBufferStart}
        onCanPlay={onBufferEnd}
      />
    </div>
  );
}
