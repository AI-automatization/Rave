'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FaArrowLeft, FaUsers, FaStar, FaClock,
  FaPlay, FaFilm,
} from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

const VideoPlayer = dynamic(
  () => import('@/components/VideoPlayer').then((m) => m.VideoPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full bg-[#0A0A0F] rounded-xl animate-pulse flex items-center justify-center">
        <FaPlay size={32} className="text-zinc-700" />
      </div>
    ),
  },
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
        setMovie(res.data.data ?? null);
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
      await apiClient.post(`/movies/${movieId}/progress`, { progress, currentTime });
    } catch (err) {
      logger.warn('Progress saqlashda xato', err);
    }
  };

  /* ── Loading skeleton ───────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="h-7 w-32 bg-white/[0.05] rounded animate-pulse" />
        <div className="aspect-video w-full bg-[#111118] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="h-6 w-64 bg-white/[0.05] rounded animate-pulse" />
            <div className="h-4 w-full bg-white/[0.04] rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-white/[0.04] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ──────────────────────────────────────── */
  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#111118] border border-white/[0.06] flex items-center justify-center mb-5">
          <FaFilm size={32} className="text-zinc-700" />
        </div>
        <p className="text-zinc-400 text-sm mb-4">Film topilmadi</p>
        <Link
          href="/movies"
          className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#7B72F8] text-white text-sm font-semibold hover:bg-[#6B63E8] transition-all"
        >
          Filmlar ro&apos;yxatiga qaytish
        </Link>
      </div>
    );
  }

  const genres  = (movie.genre ?? movie.genres ?? []);
  const rating  = (movie.rating ?? 0).toFixed(1);
  const dH      = Math.floor((movie.duration ?? 0) / 60);
  const dM      = (movie.duration ?? 0) % 60;
  const poster  = movie.posterUrl ?? movie.poster;
  const backdrop = movie.backdropUrl ?? movie.backdrop ?? poster;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">

      {/* ── Top nav ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/movies"
          className="inline-flex items-center gap-2 h-8 px-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-all text-sm"
        >
          <FaArrowLeft size={13} />
          Orqaga
        </Link>
        <Link
          href={`/party/create?movieId=${movie._id}`}
          className="inline-flex items-center gap-2 h-8 px-4 rounded-xl border border-[#7B72F8]/40 text-[#7B72F8] hover:bg-[#7B72F8]/10 hover:border-[#7B72F8]/70 transition-all text-sm font-semibold"
        >
          <FaUsers size={13} />
          Watch Party
        </Link>
      </div>

      {/* ── Player ────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">
        {movie.videoUrl ? (
          <VideoPlayer
            src={movie.videoUrl}
            poster={backdrop}
            title={movie.title}
            onProgress={(progress, currentTime) => void handleProgress(progress, currentTime)}
          />
        ) : (
          <div className="aspect-video w-full bg-[#111118] flex flex-col items-center justify-center gap-3 rounded-2xl">
            <FaPlay size={40} className="text-zinc-700" />
            <p className="text-zinc-600 text-sm">Video hali yuklanmagan</p>
          </div>
        )}
      </div>

      {/* ── Info + sidebar ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — movie info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Title + badges */}
          <div>
            <h1
              className="text-2xl md:text-3xl font-display text-white uppercase leading-none mb-2"
              style={{ textShadow: '0 0 40px rgba(123,114,248,0.25)' }}
            >
              {movie.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {genres.map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#7B72F8]/20 text-[#7B72F8] border border-[#7B72F8]/30"
                >
                  {g}
                </span>
              ))}
              {movie.year && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.06] text-zinc-500 border border-white/[0.08]">
                  {movie.year}
                </span>
              )}
              {dH > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.06] text-zinc-500 border border-white/[0.08]">
                  <FaClock size={9} /> {dH}h {dM}m
                </span>
              )}
            </div>
          </div>

          {/* Rating row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <FaStar
                  key={s}
                  size={13}
                  className={s <= Math.round((movie.rating ?? 0) / 2) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700 fill-zinc-700'}
                />
              ))}
              <span className="text-amber-400 text-sm font-semibold ml-1">{rating}</span>
              <span className="text-zinc-600 text-xs ml-0.5">/ 10</span>
            </div>
            {(movie.viewCount ?? 0) > 0 && (
              <span className="text-zinc-600 text-xs">
                {movie.viewCount.toLocaleString()} ta tomosha
              </span>
            )}
          </div>

          {/* Description */}
          {movie.description && (
            <p className="text-zinc-400 text-sm leading-relaxed">{movie.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <Link
              href={`/movies/${movie.slug ?? movie._id}`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.10] text-zinc-400 hover:text-zinc-200 hover:border-white/20 hover:bg-white/[0.04] transition-all text-sm"
            >
              <FaFilm size={13} />
              Film sahifasi
            </Link>
          </div>
        </div>

        {/* Right — poster card */}
        <div className="hidden lg:block">
          <div className="rounded-2xl overflow-hidden bg-[#111118] border border-white/[0.06]">
            {poster && (
              <div className="relative aspect-[2/3] w-full">
                <Image
                  src={poster}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-transparent to-transparent" />
              </div>
            )}
            <div className="p-4 -mt-8 relative space-y-3">
              <h3 className="text-sm font-semibold text-zinc-300 line-clamp-1">{movie.title}</h3>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
                  <p className="text-lg font-display text-[#7B72F8]">{rating}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Reyting</p>
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
                  <p className="text-lg font-display text-zinc-300">
                    {dH > 0 ? `${dH}h${dM > 0 ? ` ${dM}m` : ''}` : `${dM}m`}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Davomiylik</p>
                </div>
              </div>

              {/* Watch party CTA */}
              <Link
                href={`/party/create?movieId=${movie._id}`}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#7B72F8]/15 border border-[#7B72F8]/30 text-[#7B72F8] text-sm font-semibold hover:bg-[#7B72F8]/25 hover:border-[#7B72F8]/50 transition-all"
              >
                <FaUsers size={13} />
                Watch Party boshlash
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
