'use client';

import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { MovieCard } from '@/components/movie/MovieCard';
import type { IMovie } from '@/types';

interface Props {
  sectionKey: 'trending' | 'topRated' | 'recent';
  href: string;
  movies: IMovie[];
}

export function HomeSection({ sectionKey, href, movies }: Props) {
  const t = useTranslations('home');
  if (movies.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display">{t(sectionKey).toUpperCase()}</h2>
        <Link href={href} className="flex items-center gap-1 text-sm text-primary hover:underline">
          {t('seeAll')} <FaChevronRight size={18} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.slice(0, 10).map((movie) => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
