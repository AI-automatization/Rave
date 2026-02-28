'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

// HLS player SSR=false (browser only)
const VideoPlayer = dynamic(
  () => import('@/components/VideoPlayer').then((m) => m.VideoPlayer),
  { ssr: false, loading: () => <div className="aspect-video w-full bg-black rounded-xl animate-pulse" /> },
);

export default function WatchPage() {
  const { movieId } = useParams<{ movieId: string }>();
  const user = useAuthStore((s) => s.user);
  const [movie, setMovie] = useState<IMovie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<ApiResponse<IMovie>>(`/movies/${movieId}`);
        setMovie(res.data.data);
      } catch (err) {
        logger.error('Film yuklashda xato', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [movieId]);

  const handleProgress = async (progress: number, currentTime: number) => {
    if (!user) return;
    try {
      await apiClient.post(`/movies/${movieId}/watch-history`, {
        progress,
        currentTime,
      });
    } catch (err) {
      logger.warn('Progress saqlashda xato', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-video w-full bg-base-200 animate-pulse rounded-xl" />
        <div className="h-6 bg-base-200 rounded w-48 animate-pulse" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-20">
        <p className="text-base-content/40 mb-4">Film topilmadi</p>
        <Link href="/movies" className="btn btn-primary">Filmlar ro&apos;yxati</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link href={`/movies/${movie.slug}`} className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft className="w-4 h-4" />
          Orqaga
        </Link>
        <Link href={`/party/create?movieId=${movie._id}`} className="btn btn-outline btn-sm gap-2">
          <Users className="w-4 h-4" />
          Watch Party
        </Link>
      </div>

      {/* Player */}
      {movie.videoUrl ? (
        <VideoPlayer
          src={movie.videoUrl}
          poster={movie.backdrop ?? movie.poster}
          onProgress={(progress, currentTime) => void handleProgress(progress, currentTime)}
        />
      ) : (
        <div className="aspect-video w-full bg-base-200 rounded-xl flex items-center justify-center">
          <p className="text-base-content/40">Video mavjud emas</p>
        </div>
      )}

      {/* Movie info */}
      <div className="space-y-1">
        <h1 className="text-xl font-display">{movie.title.toUpperCase()}</h1>
        <div className="flex gap-3 text-sm text-base-content/50 flex-wrap">
          {movie.genres.map((g) => (
            <span key={g} className="badge badge-ghost text-xs">{g}</span>
          ))}
          <span>{movie.year}</span>
        </div>
      </div>

      <p className="text-base-content/70 text-sm">{movie.description}</p>
    </div>
  );
}
