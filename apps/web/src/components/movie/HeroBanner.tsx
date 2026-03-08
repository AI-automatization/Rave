'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaPlay, FaUsers, FaStar, FaClock, FaInfoCircle } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import type { IMovie } from '@/types';

interface Props { movie: IMovie }

export function HeroBanner({ movie }: Props) {
  const t     = useTranslations('movie');
  const bg    = movie.backdropUrl ?? movie.posterUrl ?? movie.backdrop ?? movie.poster;
  const genres = (movie.genre ?? movie.genres ?? []).slice(0, 3);
  const slug  = movie.slug ?? movie._id;
  const dH    = Math.floor((movie.duration ?? 0) / 60);
  const dM    = (movie.duration ?? 0) % 60;

  return (
    <div className="relative w-full h-[58vh] min-h-[400px] max-h-[600px] overflow-hidden rounded-2xl">

      {/* Backdrop */}
      {bg ? (
        <Image
          src={bg}
          alt={movie.title}
          fill
          className="object-cover scale-105"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-[#0e0e1a]" />
      )}

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-[#0A0A0F]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/30 to-transparent" />
      {/* Violet tint */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_100%,rgba(124,58,237,0.18),transparent)]" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 max-w-2xl">

        {/* Genre + Year badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {genres.map((g) => (
            <span
              key={g}
              className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30"
            >
              {g}
            </span>
          ))}
          <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/[0.08] text-zinc-400 border border-white/[0.08]">
            {movie.year}
          </span>
          {dH > 0 && (
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/[0.08] text-zinc-400 border border-white/[0.08] flex items-center gap-1">
              <FaClock size={9} /> {dH}h {dM}m
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-4xl md:text-6xl font-display text-white leading-none mb-3 uppercase"
          style={{ textShadow: '0 0 60px rgba(124,58,237,0.35)' }}
        >
          {movie.title}
        </h1>

        {/* Rating + views */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((s) => (
              <FaStar
                key={s}
                size={13}
                className={s <= Math.round((movie.rating ?? 0) / 2) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700 fill-zinc-700'}
              />
            ))}
            <span className="text-amber-400 text-sm font-semibold ml-1">{(movie.rating ?? 0).toFixed(1)}</span>
            <span className="text-zinc-600 text-xs ml-0.5">/ 10</span>
          </div>
          {movie.viewCount > 0 && (
            <span className="text-zinc-600 text-xs">{movie.viewCount.toLocaleString()} views</span>
          )}
        </div>

        {/* Description */}
        {movie.description && (
          <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-2 max-w-lg">
            {movie.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/watch/${movie._id}`}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#6D28D9] hover:shadow-[0_0_32px_rgba(124,58,237,0.7)] transition-all active:scale-95 shadow-[0_0_20px_rgba(124,58,237,0.4)]"
          >
            <FaPlay size={13} className="fill-current" />
            {t('watch')}
          </Link>
          <Link
            href={`/party/create?movieId=${movie._id}`}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-white/20 text-zinc-300 font-semibold text-sm hover:bg-white/[0.06] hover:border-white/30 transition-all active:scale-95"
          >
            <FaUsers size={13} />
            Watch Party
          </Link>
          <Link
            href={`/movies/${slug}`}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all text-sm"
          >
            <FaInfoCircle size={13} />
            <span className="hidden sm:inline">{t('details')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
