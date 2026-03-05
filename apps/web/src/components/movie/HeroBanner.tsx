'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaPlay, FaUsers, FaInfoCircle } from 'react-icons/fa';
import type { IMovie } from '@/types';

interface HeroBannerProps {
  movie: IMovie;
}

export function HeroBanner({ movie }: HeroBannerProps) {
  const bgSrc = movie.backdrop ?? movie.poster;

  return (
    <div className="relative w-full h-[55vh] min-h-[380px] overflow-hidden rounded-xl">
      {bgSrc ? (
        <Image
          src={bgSrc}
          alt={movie.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-xl">
        <div className="flex gap-2 mb-3 flex-wrap">
          {movie.genres.slice(0, 3).map((g) => (
            <span key={g} className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-slate-700/50 border border-slate-600 text-slate-400">
              {g}
            </span>
          ))}
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-slate-700/50 border border-slate-600 text-slate-400">{movie.year}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display text-white mb-2 leading-tight">
          {movie.title.toUpperCase()}
        </h1>
        <p className="text-slate-400 text-sm md:text-base mb-5 line-clamp-3">
          {movie.description}
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href={`/watch/${movie._id}`} className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95">
            <FaPlay size={16} className="fill-current" />
            Ko&apos;rish
          </Link>
          <Link
            href={`/party/create?movieId=${movie._id}`}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium active:scale-95"
          >
            <FaUsers size={16} />
            Watch Party
          </Link>
          <Link href={`/movies/${movie.slug}`} className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all font-medium active:scale-95">
            <FaInfoCircle size={16} />
            Batafsil
          </Link>
        </div>
      </div>
    </div>
  );
}
