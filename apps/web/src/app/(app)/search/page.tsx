'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { MovieCard } from '@/components/movie/MovieCard';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<IMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await apiClient.get<ApiResponse<{ movies: IMovie[] }>>(
        `/movies/search?q=${encodeURIComponent(q)}&limit=20`,
      );
      setResults(res.data.data?.movies ?? []);
    } catch (err) {
      logger.error('Qidiruv xatosi', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void doSearch(query);
      if (query.trim()) {
        router.replace(`/search?q=${encodeURIComponent(query.trim())}`, { scroll: false });
      } else {
        router.replace('/search', { scroll: false });
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Initial search from URL
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (initialQ) void doSearch(initialQ); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">QIDIRISH</h1>

      {/* Search input */}
      <div className="relative max-w-xl">
        <FaSearch size={23} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Film nomi, janr, rejissyor, aktyor..."
          className="input input-bordered w-full pl-10 pr-10 bg-base-200"
          autoFocus
          aria-label="Qidiruv"
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
            onClick={() => setQuery('')}
            aria-label="Tozalash"
          >
            <FaTimes size={18} />
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
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

      {/* Results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20">
          <FaSearch size={55} className="text-base-content/20 mx-auto mb-4" />
          <p className="text-base-content/40">&quot;{query}&quot; bo&apos;yicha natija topilmadi</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-sm text-base-content/50">
            {results.length} ta natija: &quot;{query}&quot;
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </>
      )}

      {/* Empty state (no search yet) */}
      {!loading && !searched && (
        <div className="text-center py-20">
          <FaSearch size={74} className="text-base-content/10 mx-auto mb-4" />
          <p className="text-base-content/40">Film nomini kiriting</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-8 w-24 bg-base-200 animate-pulse rounded" />
        <div className="h-12 bg-base-200 animate-pulse rounded max-w-xl" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
