'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaSearch, FaTimes, FaFire, FaStar, FaFilm } from 'react-icons/fa';
import { MdTune } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { MovieCard } from '@/components/movie/MovieCard';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

const GENRES = [
  'Action', 'Drama', 'Comedy', 'Horror',
  'Sci-Fi', 'Romance', 'Thriller', 'Animation',
  'Documentary', 'Adventure',
];

const SORT_OPTIONS = [
  { value: 'createdAt',  label: 'New',     icon: FaFire },
  { value: 'rating',     label: 'Rating',  icon: FaStar },
  { value: 'viewCount',  label: 'Popular', icon: FaFilm },
];

async function fetchMovies(params: URLSearchParams): Promise<{ movies: IMovie[]; total: number }> {
  try {
    const res = await fetch(`/api/content/movies?${params.toString()}`);
    if (!res.ok) return { movies: [], total: 0 };
    const json: ApiResponse<IMovie[]> = await res.json() as ApiResponse<IMovie[]>;
    return {
      movies: json.data ?? [],
      total: json.meta?.total ?? json.pagination?.total ?? (json.data?.length ?? 0),
    };
  } catch (err) {
    logger.error('Movies fetch error', err);
    return { movies: [], total: 0 };
  }
}

async function searchMovies(q: string): Promise<IMovie[]> {
  try {
    const res = await fetch(`/api/content/movies?q=${encodeURIComponent(q)}&limit=40`);
    if (!res.ok) return [];
    const json: ApiResponse<IMovie[]> = await res.json() as ApiResponse<IMovie[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#111118] border border-white/[0.06] animate-pulse">
      <div className="aspect-[2/3] bg-white/[0.04]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-white/[0.06] rounded w-3/4" />
        <div className="h-3 bg-white/[0.04] rounded w-1/2" />
      </div>
    </div>
  );
}

function MoviesContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const t            = useTranslations('movies');

  const initialQ    = searchParams.get('q') ?? '';
  const initialSort = searchParams.get('sort') ?? 'createdAt';
  const initialGenre = searchParams.get('genre') ?? '';

  const [query,    setQuery]    = useState(initialQ);
  const [sort,     setSort]     = useState(initialSort);
  const [genre,    setGenre]    = useState(initialGenre);
  const [movies,   setMovies]   = useState<IMovie[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);
  const [loading,  setLoading]  = useState(true);
  const [isSearch, setIsSearch] = useState(!!initialQ);

  const sentinelRef  = useRef<HTMLDivElement>(null);
  const pageRef      = useRef(1);
  const hasMoreRef   = useRef(true);
  const loadingRef   = useRef(false);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Update URL on filter change ─────────────────── */
  const syncUrl = useCallback((q: string, s: string, g: string) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (s && s !== 'createdAt') p.set('sort', s);
    if (g) p.set('genre', g);
    router.replace(p.toString() ? `/movies?${p.toString()}` : '/movies', { scroll: false });
  }, [router]);

  /* ── Load browse movies (paginated) ─────────────── */
  const loadBrowse = useCallback(async (p: number, reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p), limit: '20', sort,
      ...(genre ? { genre } : {}),
    });
    const { movies: next, total: t } = await fetchMovies(params);
    setMovies((prev) => reset ? next : [...prev, ...next]);
    setTotal(t);
    const more = next.length === 20;
    hasMoreRef.current = more;
    setHasMore(more);
    loadingRef.current = false;
    setLoading(false);
  }, [sort, genre]);

  /* ── Trigger on sort / genre change ─────────────── */
  useEffect(() => {
    if (isSearch) return;
    pageRef.current = 1;
    hasMoreRef.current = true;
    setPage(1);
    setMovies([]);
    void loadBrowse(1, true);
    syncUrl(query, sort, genre);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, genre]);

  /* ── Search debounce ─────────────────────────────── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const q = query.trim();
      syncUrl(q, sort, genre);
      if (!q) {
        setIsSearch(false);
        setMovies([]);
        pageRef.current = 1;
        hasMoreRef.current = true;
        void loadBrowse(1, true);
        return;
      }
      setIsSearch(true);
      setLoading(true);
      const results = await searchMovies(q);
      setMovies(results);
      setTotal(results.length);
      setHasMore(false);
      setLoading(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /* ── Infinite scroll observer ────────────────────── */
  useEffect(() => {
    if (!sentinelRef.current || isSearch) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMoreRef.current && !loadingRef.current) {
        const next = pageRef.current + 1;
        pageRef.current = next;
        setPage(next);
        void loadBrowse(next, false);
      }
    }, { threshold: 0.3 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadBrowse, isSearch]);

  const clearSearch = () => setQuery('');

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <FaFilm size={22} className="text-[#7C3AED]" />
        <h1 className="text-3xl font-display text-white">{t('title')}</h1>
        {!loading && total > 0 && (
          <span className="ml-auto text-sm text-zinc-600">{total.toLocaleString()} films</span>
        )}
      </div>

      {/* ── Search bar ──────────────────────────────── */}
      <div className="relative max-w-2xl">
        <FaSearch
          size={14}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, genres, directors…"
          className="w-full h-11 pl-11 pr-10 rounded-xl bg-[#111118] border border-white/[0.08] text-zinc-300 placeholder-zinc-600 text-sm focus:outline-none focus:border-[#7C3AED]/50 focus:shadow-[0_0_0_1px_rgba(124,58,237,0.25)] transition-all"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <FaTimes size={13} />
          </button>
        )}
      </div>

      {/* ── Sort + Genre filters ─────────────────────── */}
      {!isSearch && (
        <div className="space-y-3">
          {/* Sort tabs */}
          <div className="flex items-center gap-2">
            <MdTune size={17} className="text-zinc-600 flex-shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSort(value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sort === value
                      ? 'bg-[#7C3AED] text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]'
                      : 'bg-white/[0.05] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300 border border-white/[0.06]'
                  }`}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre pills */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setGenre('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                genre === ''
                  ? 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/40'
                  : 'bg-white/[0.04] text-zinc-600 border border-white/[0.06] hover:border-white/10 hover:text-zinc-400'
              }`}
            >
              {t('all')}
            </button>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  genre === g
                    ? 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/40'
                    : 'bg-white/[0.04] text-zinc-600 border border-white/[0.06] hover:border-white/10 hover:text-zinc-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Search label ─────────────────────────────── */}
      {isSearch && query.trim() && !loading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <FaSearch size={12} />
          <span>
            {movies.length > 0
              ? `${movies.length} results for "${query}"`
              : `No results for "${query}"`}
          </span>
          <button
            onClick={clearSearch}
            className="ml-2 text-[#7C3AED] hover:text-violet-400 text-xs font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────── */}
      {!loading && movies.length === 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-[#111118] border border-white/[0.06] flex items-center justify-center mb-5">
              <FaFilm size={32} className="text-zinc-700" />
            </div>
            <p className="text-zinc-500 text-sm">{t('notFound')}</p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Grid ─────────────────────────────────────── */}
      {movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {movies.map((movie, i) => (
            <motion.div
              key={movie._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.03 }}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Loading skeletons ────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Load more indicator */}
      {!isSearch && !hasMore && movies.length > 0 && !loading && (
        <p className="text-center text-xs text-zinc-700 py-4">— All movies loaded —</p>
      )}

      {/* Loading more indicator */}
      {!loading && page > 1 && hasMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-white/10 border-t-[#7C3AED] rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-8 w-40 bg-white/[0.05] animate-pulse rounded" />
        <div className="h-11 bg-white/[0.05] animate-pulse rounded-xl max-w-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    }>
      <MoviesContent />
    </Suspense>
  );
}
