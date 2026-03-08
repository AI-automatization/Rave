'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { FaChevronRight, FaChevronLeft, FaFire, FaStar, FaClock } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { MovieCard } from '@/components/movie/MovieCard';
import type { IMovie } from '@/types';

const SECTION_ICONS = {
  trending: FaFire,
  topRated: FaStar,
  recent:   FaClock,
} as const;

const SECTION_ICON_COLORS = {
  trending: 'text-orange-400',
  topRated: 'text-amber-400',
  recent:   'text-[#7C3AED]',
} as const;

interface Props {
  sectionKey: 'trending' | 'topRated' | 'recent';
  href: string;
  movies: IMovie[];
}

export function HomeSection({ sectionKey, href, movies }: Props) {
  const t       = useTranslations('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  if (movies.length === 0) return null;

  const Icon      = SECTION_ICONS[sectionKey];
  const iconColor = SECTION_ICON_COLORS[sectionKey];

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={17} className={iconColor} />
          <h2 className="text-lg font-display text-white tracking-wide">
            {t(sectionKey).toUpperCase()}
          </h2>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-[#7C3AED] transition-colors group"
        >
          {t('seeAll')}
          <FaChevronRight
            size={10}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>

      {/* Scroll container */}
      <div className="relative group/scroll">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-3
                     w-8 h-8 rounded-full bg-[#111118] border border-white/[0.10]
                     text-zinc-400 hover:text-white hover:border-white/20
                     flex items-center justify-center
                     opacity-0 group-hover/scroll:opacity-100 transition-all
                     shadow-xl shadow-black/40"
          aria-label="Scroll left"
        >
          <FaChevronLeft size={12} />
        </button>

        {/* Cards row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {movies.slice(0, 20).map((movie) => (
            <div
              key={movie._id}
              className="flex-shrink-0 w-[140px] sm:w-[160px]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-3
                     w-8 h-8 rounded-full bg-[#111118] border border-white/[0.10]
                     text-zinc-400 hover:text-white hover:border-white/20
                     flex items-center justify-center
                     opacity-0 group-hover/scroll:opacity-100 transition-all
                     shadow-xl shadow-black/40"
          aria-label="Scroll right"
        >
          <FaChevronRight size={12} />
        </button>
      </div>
    </section>
  );
}
