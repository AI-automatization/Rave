'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaPlay, FaStar, FaClock } from 'react-icons/fa';
import type { IMovie } from '@/types';

interface MovieCardProps {
  movie: IMovie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const durationHours = Math.floor(movie.duration / 60);
  const durationMins = movie.duration % 60;
  const durationLabel =
    durationHours > 0 ? `${durationHours}s ${durationMins}d` : `${durationMins}d`;

  const posterSrc = movie.posterUrl ?? movie.poster;

  return (
    <Link href={`/movies/${movie._id}`} className="group block">
      <div className="bg-slate-800 rounded-lg overflow-hidden transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-cyan-500/20 border border-slate-700">
        <figure className="relative aspect-[2/3]">
          {posterSrc ? (
            <Image
              src={posterSrc}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
              <span className="text-slate-400 text-4xl font-bold">{movie.title[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <Link
                href={`/watch/${movie._id}`}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 w-full transition-all font-medium active:scale-95"
                onClick={(e) => e.stopPropagation()}
              >
                <FaPlay size={14} className="fill-current" />
                Ko&apos;rish
              </Link>
            </div>
          </div>
        </figure>
        <div className="p-4 gap-2">
          <h3 className="text-base font-semibold line-clamp-2 leading-tight text-white mb-2">{movie.title}</h3>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <FaStar size={13} className="fill-amber-400 text-amber-400" />
              <span className="text-amber-400 font-semibold">{(movie.rating ?? 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaClock size={15} />
              <span>{durationLabel}</span>
            </div>
            <span>{movie.year}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
