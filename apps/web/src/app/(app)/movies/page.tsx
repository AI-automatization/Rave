'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, SortAsc } from 'lucide-react';
import { MovieCard } from '@/components/movie/MovieCard';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

const GENRES = ['Action', 'Drama', 'Comedy', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Animation'];
const SORT_OPTIONS = [
  { value: 'createdAt',  label: 'Yangi' },
  { value: 'rating',     label: 'Reyting' },
  { value: 'viewCount',  label: 'Mashhur' },
  { value: 'year',       label: 'Yil' },
];

function MoviesContent() {
  const searchParams = useSearchParams();
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [genre, setGenre] = useState(searchParams.get('genre') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'createdAt');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMovies = useCallback(async (p: number, reset: boolean) => {
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
      setHasMore(p < pagination.pages);
    } catch (err) {
      logger.error('Filmlar yuklashda xato', err);
    } finally {
      setLoading(false);
    }
  }, [sort, genre]);

  // Reset when filters change
  useEffect(() => {
    setPage(1);
    setMovies([]);
    void loadMovies(1, true);
  }, [sort, genre, loadMovies]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          const next = page + 1;
          setPage(next);
          void loadMovies(next, false);
        }
      },
      { threshold: 0.5 },
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, page, loadMovies]);

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-3xl font-display">FILMLAR</h1>
        <div className="flex gap-3 flex-wrap">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-base-content/50" />
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
          {/* Genre */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-base-content/50" />
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="select select-sm select-bordered bg-base-200"
            >
              <option value="">Barcha janrlar</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Genre pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setGenre('')}
          className={`btn btn-xs rounded-full ${genre === '' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Barchasi
        </button>
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`btn btn-xs rounded-full ${genre === g ? 'btn-primary' : 'btn-ghost'}`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Grid */}
      {movies.length === 0 && !loading ? (
        <div className="text-center py-20 text-base-content/40">
          <p className="text-lg">Film topilmadi</p>
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

      {/* Infinite scroll sentinel */}
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
