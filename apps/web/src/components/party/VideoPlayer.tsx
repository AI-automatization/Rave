'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWatchPartyStore } from '@/store/watch-party.store';

interface Props {
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
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

export function VideoPlayer({ onPlay, onPause, onSeek }: Props) {
  const room = useWatchPartyStore((s) => s.room);
  const syncState = useWatchPartyStore((s) => s.syncState);
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

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex items-center justify-center">
        <p className="text-slate-500 text-sm">Video mavjud emas</p>
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
  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full h-full"
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeeked}
      />
    </div>
  );
}
