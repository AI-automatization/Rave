'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaPlay, FaStar } from 'react-icons/fa';
import type { IMovie } from '@/types';

interface Props { movie: IMovie }

export function MovieCard({ movie }: Props) {
  const poster  = movie.posterUrl ?? movie.poster;
  const slug    = movie.slug ?? movie._id;
  const rating  = (movie.rating ?? 0).toFixed(1);
  const genres  = (movie.genre ?? movie.genres ?? []).slice(0, 1);

  return (
    <Link href={`/movies/${slug}`} className="group block">
      <div className="relative rounded-xl overflow-hidden bg-[#111118] border border-white/[0.06] transition-all duration-300 group-hover:border-[#7B72F8]/40 group-hover:shadow-[0_0_24px_rgba(123,114,248,0.2)] group-hover:-translate-y-0.5">

        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {poster ? (
            <Image
              src={poster}
              alt={movie.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 bg-[#1a1a2e] flex items-center justify-center">
              <span className="text-5xl font-display text-white/10">{movie.title[0]}</span>
            </div>
          )}

          {/* Rating badge — top right */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
            <FaStar size={9} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-semibold text-amber-400">{rating}</span>
          </div>

          {/* Genre badge — top left */}
          {genres[0] && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded-md">
              <span className="text-[10px] text-zinc-400 font-medium">{genres[0]}</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Link
              href={`/watch/${movie._id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#7B72F8] shadow-[0_0_32px_rgba(123,114,248,0.8)] hover:scale-110 transition-transform active:scale-95"
            >
              <FaPlay size={16} className="text-white ml-0.5 fill-current" />
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="p-2.5">
          <h3 className="text-[13px] font-medium text-zinc-200 line-clamp-1 leading-tight">
            {movie.title}
          </h3>
          <p className="text-[11px] text-zinc-600 mt-0.5">{movie.year}</p>
        </div>
      </div>
    </Link>
  );
}
