'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Clock } from 'lucide-react';
import type { IMovie } from '@/types';

interface MovieCardProps {
  movie: IMovie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const durationHours = Math.floor(movie.duration / 60);
  const durationMins = movie.duration % 60;
  const durationLabel =
    durationHours > 0 ? `${durationHours}s ${durationMins}d` : `${durationMins}d`;

  return (
    <Link href={`/movies/${movie.slug}`} className="group block">
      <div className="card bg-base-200 overflow-hidden transition-transform duration-300 group-hover:scale-105">
        <figure className="relative aspect-[2/3]">
          <Image
            src={movie.poster || '/placeholder.jpg'}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base-100/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <Link
                href={`/watch/${movie._id}`}
                className="btn btn-primary btn-sm w-full gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Play className="w-3 h-3 fill-current" />
                Ko&apos;rish
              </Link>
            </div>
          </div>
        </figure>
        <div className="card-body p-3 gap-1">
          <h3 className="text-sm font-medium line-clamp-2 leading-tight">{movie.title}</h3>
          <div className="flex items-center justify-between text-xs text-base-content/60">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-accent text-accent" />
              <span className="text-accent font-medium">{movie.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{durationLabel}</span>
            </div>
            <span>{movie.year}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
