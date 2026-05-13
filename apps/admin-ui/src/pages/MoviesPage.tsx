import { useEffect, useState, useCallback } from 'react';
import { Search, Film, Star, Eye, EyeOff, Trash2 } from 'lucide-react';
import { moviesApi } from '../api/movies.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterTabs } from '../components/ui/FilterTabs';
import type { AdminMovie, PaginationMeta } from '../types';

const GENRES = ['action','comedy','drama','horror','thriller','romance','sci-fi','animation','documentary','fantasy'];

const PUBLISHED_TABS = [
  { value: '',      label: 'All' },
  { value: 'true',  label: 'Published' },
  { value: 'false', label: 'Draft' },
];

function SkeletonRow() {
  return (
    <tr>
      {[40, 15, 14, 10, 10, 10, 8].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 shimmer-bg rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function MoviesPage() {
  const currentUser  = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [movies, setMovies]   = useState<AdminMovie[]>([]);
  const [meta, setMeta]       = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [genreFilter, setGenreFilter]         = useState('');
  const [page, setPage]       = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof moviesApi.list>[0] = { page, limit: 20 };
      if (search) params.search = search;
      if (genreFilter) params.genre = genreFilter;
      if (publishedFilter !== '') params.isPublished = publishedFilter === 'true';
      const res = await moviesApi.list(params);
      setMovies(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, search, publishedFilter, genreFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleTogglePublish = async (movie: AdminMovie) => {
    setActionLoading(movie._id);
    try {
      if (movie.isPublished) await moviesApi.unpublish(movie._id);
      else await moviesApi.publish(movie._id);
      await load();
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (movie: AdminMovie) => {
    if (!confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;
    setActionLoading(movie._id);
    try { await moviesApi.delete(movie._id); await load(); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Content"
        meta={`${meta.total.toLocaleString('en')} titles`}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search titles..."
            className="input-base pl-9"
          />
        </div>

        <FilterTabs
          options={PUBLISHED_TABS}
          value={publishedFilter}
          onChange={(v) => { setPublishedFilter(v); setPage(1); }}
        />

        <select
          value={genreFilter}
          onChange={(e) => { setGenreFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-[9px] text-[12px] text-white focus:outline-none focus:ring-2 focus:ring-accent/25 transition-all"
        >
          <option value="">All genres</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Title', 'Genre', 'Year', 'Rating', 'Views', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em] last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading
              ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
              : movies.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                        <Film size={20} className="text-text-dim" />
                      </div>
                      <p className="text-text-muted text-sm font-medium">No titles found</p>
                      <p className="text-text-dim text-xs">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )
              : movies.map((movie) => (
                <tr key={movie._id} className="tr-hover group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {movie.posterUrl ? (
                        <img src={movie.posterUrl} alt="" className="w-8 h-11 rounded-lg object-cover bg-overlay shrink-0" />
                      ) : (
                        <div className="w-8 h-11 rounded-lg bg-overlay/60 flex items-center justify-center shrink-0">
                          <Film size={13} className="text-text-dim" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-white truncate max-w-[200px]">{movie.title}</p>
                        <span className="text-[10px] text-text-dim font-medium uppercase tracking-wide">{movie.type}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-text-muted">{movie.genre.slice(0, 2).join(', ') || '—'}</span>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-text-muted tabular-nums whitespace-nowrap">{movie.year} · {movie.duration}m</span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                      <span className="text-[12px] text-amber-400 font-semibold tabular-nums">{movie.rating.toFixed(1)}</span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-text-muted tabular-nums">{movie.viewCount.toLocaleString('en')}</span>
                  </td>

                  <td className="px-5 py-3.5">
                    {movie.isPublished
                      ? <Badge variant="green" dot>Published</Badge>
                      : <Badge variant="gray" dot>Draft</Badge>}
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => void handleTogglePublish(movie)}
                        disabled={actionLoading === movie._id}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                          movie.isPublished
                            ? 'text-text-dim hover:text-amber-400 hover:bg-amber-400/10'
                            : 'text-text-dim hover:text-emerald-400 hover:bg-emerald-400/10'
                        }`}
                        title={movie.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {movie.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => void handleDelete(movie)}
                          disabled={actionLoading === movie._id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {meta.totalPages > 1 && (
          <div className="px-5 border-t border-white/[0.04]">
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={(p) => { setPage(p); }} />
          </div>
        )}
      </div>
    </div>
  );
}
