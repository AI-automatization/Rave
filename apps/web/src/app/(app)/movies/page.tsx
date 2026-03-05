'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaFilter, FaSortAmountUp } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { MovieCard } from '@/components/movie/MovieCard';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

const GENRES = ['Action', 'Drama', 'Comedy', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Animation'];

function MoviesContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('movies');
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [genre, setGenre] = useState(searchParams.get('genre') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'createdAt');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef    = useRef(1);

  const SORT_OPTIONS = [
    { value: 'createdAt',  label: t('sortNew') },
    { value: 'rating',     label: t('sortRating') },
    { value: 'viewCount',  label: t('sortPopular') },
    { value: 'year',       label: t('sortYear') },
  ];

  const loadMovies = useCallback(async (p: number, reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: '20',
        sort,
        ...(genre ? { genre } : {}),
      });
      const res = await apiClient.get<ApiResponse<{ movies: IMovie[]; pagination: { pages: number } }>>(
        `/movies?${params.toString()}`,
      );
      const { movies: newMovies, pagination } = res.data.data;
      setMovies((prev) => (reset ? newMovies : [...prev, ...newMovies]));
      const more = p < pagination.pages;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (err) {
      logger.error('Filmlar yuklashda xato', err);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [sort, genre]);

  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    setPage(1);
    setMovies([]);
    void loadMovies(1, true);
  }, [sort, genre, loadMovies]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          const next = pageRef.current + 1;
          pageRef.current = next;
          setPage(next);
          void loadMovies(next, false);
        }
      },
      { threshold: 0.5 },
    );
    observerRef.current = observer;
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMovies]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-3xl font-display">{t('title')}</h1>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FaSortAmountUp size={18} className="text-base-content/50" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="select select-sm select-bordered bg-base-200"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter size={18} className="text-base-content/50" />
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="select select-sm select-bordered bg-base-200"
            >
              <option value="">{t('allGenres')}</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setGenre('')}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${genre === '' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
        >
          {t('all')}
        </button>
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${genre === g ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {g}
          </button>
        ))}
      </div>

      {movies.length === 0 && !loading ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">{t('notFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
          {loading &&
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card bg-base-200 animate-pulse">
                <div className="aspect-[2/3] bg-base-300 rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-base-300 rounded w-3/4" />
                  <div className="h-3 bg-base-300 rounded w-1/2" />
                </div>
              </div>
            ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-8 w-24 bg-base-200 animate-pulse rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card bg-base-200 animate-pulse">
              <div className="aspect-[2/3] bg-base-300 rounded-t-2xl" />
            </div>
          ))}
        </div>
      </div>
    }>
      <MoviesContent />
    </Suspense>
  );
}
