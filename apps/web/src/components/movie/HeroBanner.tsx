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
    <div className="relative w-full h-[55vh] min-h-[380px] overflow-hidden rounded-2xl">
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
        <div className="absolute inset-0 bg-bg-elevated" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-base-100/90 via-base-100/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-xl">
        <div className="flex gap-2 mb-3 flex-wrap">
          {movie.genres.slice(0, 3).map((g) => (
            <span key={g} className="badge badge-ghost text-xs">
              {g}
            </span>
          ))}
          <span className="badge badge-ghost text-xs">{movie.year}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display text-base-content mb-2 leading-tight">
          {movie.title.toUpperCase()}
        </h1>
        <p className="text-base-content/70 text-sm md:text-base mb-5 line-clamp-3">
          {movie.description}
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href={`/watch/${movie._id}`} className="btn btn-primary gap-2">
            <FaPlay size={18} className="fill-current" />
            Ko&apos;rish
          </Link>
          <Link
            href={`/party/create?movieId=${movie._id}`}
            className="btn btn-outline gap-2"
          >
            <FaUsers size={18} />
            Watch Party
          </Link>
          <Link href={`/movies/${movie.slug}`} className="btn btn-ghost gap-2">
            <FaInfoCircle size={18} />
            Batafsil
          </Link>
        </div>
      </div>
    </div>
  );
}
