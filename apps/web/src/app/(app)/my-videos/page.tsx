'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FaPlay, FaLink, FaClock, FaCheck, FaTimes, FaPlus,
  FaStar, FaTrash,
} from 'react-icons/fa';
import { CreateRoomModal } from '@/components/party/CreateRoomModal';
import { apiClient } from '@/lib/axios';
import type { ApiResponse, IExternalVideo, VideoPlatform } from '@/types';

const STATUS_CONFIG = {
  pending:  { label: 'Kutilmoqda', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  approved: { label: 'Tasdiqlangan', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  rejected: { label: 'Rad etilgan', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const PLATFORM_ICON: Record<VideoPlatform, string> = {
  youtube:     '▶',
  vimeo:       '🎬',
  twitch:      '📡',
  dailymotion: '🎥',
  direct:      '📎',
  other:       '🌐',
};

function StatusBadge({ status }: { status: IExternalVideo['status'] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = status === 'approved' ? FaCheck : status === 'rejected' ? FaTimes : FaClock;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

function VideoCard({ video, onWatch }: { video: IExternalVideo; onWatch: (video: IExternalVideo) => void }) {
  return (
    <div className="group bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-900">
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            {PLATFORM_ICON[video.platform]}
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
          <button
            onClick={() => onWatch(video)}
            className="w-12 h-12 rounded-full bg-[#7C3AED]/80 flex items-center justify-center hover:bg-[#7C3AED] transition-colors"
          >
            <FaPlay size={16} className="text-white ml-0.5" />
          </button>
        </div>
        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={video.status} />
        </div>
        {/* Rating */}
        {video.ratingCount > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-xs text-amber-400">
            <FaStar size={10} />
            <span>{video.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="text-sm text-white font-medium line-clamp-2 leading-snug">
          {video.title || 'Sarlavhasiz'}
        </p>

        <div className="flex items-center justify-between gap-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors truncate max-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            <FaLink size={9} />
            <span className="truncate">{new URL(video.url).hostname.replace('www.', '')}</span>
          </a>

          <span className="shrink-0 text-[10px] text-slate-600">
            {new Date(video.createdAt).toLocaleDateString('uz-UZ')}
          </span>
        </div>

        {video.status === 'rejected' && video.rejectionReason && (
          <p className="text-[11px] text-red-400/70 bg-red-500/5 border border-red-500/10 rounded-lg px-2 py-1.5 leading-snug">
            {video.rejectionReason}
          </p>
        )}

        <button
          onClick={() => onWatch(video)}
          className="w-full h-8 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] text-xs font-semibold hover:bg-[#7C3AED]/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <FaPlay size={10} />
          Watch Party boshlash
        </button>
      </div>
    </div>
  );
}

export default function MyVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<IExternalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchVideo, setWatchVideo] = useState<IExternalVideo | null>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse<IExternalVideo[]>>('/external-videos/my')
      .then((r) => setVideos(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleWatch = (video: IExternalVideo) => {
    const params = new URLSearchParams({ videoUrl: video.url });
    if (video.title)     params.set('videoTitle', video.title);
    if (video.thumbnail) params.set('videoThumbnail', video.thumbnail);
    params.set('videoPlatform', video.platform);
    router.push(`/party/create?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-white/[0.06] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111118] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-white/[0.04]" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-white/[0.04] rounded w-3/4" />
                <div className="h-3 bg-white/[0.04] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Mening videolarim</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Siz qo&apos;shgan videolar — {videos.length} ta
          </p>
        </div>
        <button
          onClick={() => setWatchVideo({ _id: '', url: '', title: '', description: '', thumbnail: '', platform: 'other', submittedBy: '', status: 'pending', isPublic: false, viewCount: 0, rating: 0, ratingCount: 0, createdAt: '', updatedAt: '' })}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors"
        >
          <FaPlus size={12} />
          Yangi video qo&apos;shish
        </button>
      </div>

      {/* Empty state */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <FaLink size={24} className="text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-medium">Hali video qo&apos;shmagansiz</p>
            <p className="text-sm text-slate-600 mt-1">
              Istalgan platformadan link qo&apos;shib, do&apos;stlar bilan birga tomosha qiling
            </p>
          </div>
          <button
            onClick={() => setWatchVideo({ _id: '', url: '', title: '', description: '', thumbnail: '', platform: 'other', submittedBy: '', status: 'pending', isPublic: false, viewCount: 0, rating: 0, ratingCount: 0, createdAt: '', updatedAt: '' })}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[#7C3AED]/30 text-[#7C3AED] text-sm hover:bg-[#7C3AED]/10 transition-colors"
          >
            <FaPlus size={12} />
            Video qo&apos;shish
          </button>
        </div>
      ) : (
        <>
          {/* Status tabs summary */}
          <div className="flex gap-3 flex-wrap">
            {(['pending', 'approved', 'rejected'] as const).map((s) => {
              const count = videos.filter((v) => v.status === s).length;
              if (count === 0) return null;
              return (
                <div key={s} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${STATUS_CONFIG[s].color}`}>
                  {STATUS_CONFIG[s].label}: <strong>{count}</strong>
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} onWatch={handleWatch} />
            ))}
          </div>
        </>
      )}

      {/* Add URL modal / Watch party modal */}
      {watchVideo !== null && (
        <CreateRoomModal onClose={() => setWatchVideo(null)} />
      )}
    </div>
  );
}
