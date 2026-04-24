import { useEffect, useState, useCallback } from 'react';
import { Search, Film, Star, Eye, EyeOff, Trash2 } from 'lucide-react';
import { moviesApi } from '../api/movies.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import type { AdminMovie, PaginationMeta } from '../types';

const GENRES = ['action', 'comedy', 'drama', 'horror', 'thriller', 'romance', 'sci-fi', 'animation', 'documentary', 'fantasy'];

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
    if (!confirm(`Удалить "${movie.title}"? Действие необратимо.`)) return;
    setActionLoading(movie._id);
    try { await moviesApi.delete(movie._id); await load(); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Контент</h1>
          <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString('ru')} фильмов в библиотеке</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по названию..."
            className="w-full bg-surface border border-border hover:border-border-md rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          />
        </div>
        <select
          value={publishedFilter}
          onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все статусы</option>
          <option value="true">Опубликован</option>
          <option value="false">Черновик</option>
        </select>
        <select
          value={genreFilter}
          onChange={(e) => { setGenreFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все жанры</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Фильм', 'Жанр', 'Год / Длит.', 'Рейтинг', 'Просмотры', 'Статус', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${55 + (i * j * 7) % 35}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : movies.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-text-muted">Фильмы не найдены</td>
              </tr>
            ) : movies.map((movie) => (
              <tr key={movie._id} className="tr-hover">
                {/* Poster + title */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {movie.posterUrl ? (
                      <img src={movie.posterUrl} alt="" className="w-8 h-11 rounded-lg object-cover bg-overlay shrink-0" />
                    ) : (
                      <div className="w-8 h-11 rounded-lg bg-overlay/80 flex items-center justify-center shrink-0">
                        <Film size={14} className="text-text-dim" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white line-clamp-1">{movie.title}</p>
                      <Badge variant="gray">{movie.type}</Badge>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-text-muted text-xs">{movie.genre.slice(0, 2).join(', ')}</td>

                <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">
                  {movie.year} · {movie.duration}мин
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-amber-400 font-mono text-xs font-semibold">{movie.rating.toFixed(1)}</span>
                  </div>
                </td>

                <td className="px-5 py-4 text-text-muted text-xs">
                  {movie.viewCount.toLocaleString('ru')}
                </td>

                <td className="px-5 py-4">
                  {movie.isPublished
                    ? <Badge variant="green" dot>Опубликован</Badge>
                    : <Badge variant="gray" dot>Черновик</Badge>}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => void handleTogglePublish(movie)}
                      disabled={actionLoading === movie._id}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                        movie.isPublished
                          ? 'text-text-dim hover:text-amber-400 hover:bg-amber-400/10'
                          : 'text-text-dim hover:text-emerald-400 hover:bg-emerald-400/10'
                      }`}
                      title={movie.isPublished ? 'Скрыть' : 'Опубликовать'}
                    >
                      {movie.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => void handleDelete(movie)}
                        disabled={actionLoading === movie._id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={15} />
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
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
