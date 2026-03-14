import { useEffect, useState, useCallback } from 'react';
import { moviesApi } from '../api/movies.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import type { AdminMovie, PaginationMeta } from '../types';

const GENRES = ['action', 'comedy', 'drama', 'horror', 'thriller', 'romance', 'sci-fi', 'animation', 'documentary', 'fantasy'];

export function MoviesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [page, setPage] = useState(1);
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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, publishedFilter, genreFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleTogglePublish = async (movie: AdminMovie) => {
    setActionLoading(movie._id);
    try {
      if (movie.isPublished) await moviesApi.unpublish(movie._id);
      else await moviesApi.publish(movie._id);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (movie: AdminMovie) => {
    if (!confirm(`"${movie.title}" filmini o'chirish?`)) return;
    setActionLoading(movie._id);
    try {
      await moviesApi.delete(movie._id);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">Kontent boshqaruv</h1>
        <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString()} ta jami film</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Film qidirish..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-64"
        />
        <Select value={publishedFilter} onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha holat</option>
          <option value="true">Nashr qilingan</option>
          <option value="false">Nashr qilinmagan</option>
        </Select>
        <Select value={genreFilter} onChange={(e) => { setGenreFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha janrlar</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Film</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Janr</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Yil / Davom.</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Reyting</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Ko'rishlar</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Holat</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">Yuklanmoqda...</td></tr>
              ) : movies.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">Film topilmadi</td></tr>
              ) : movies.map((movie) => (
                <tr key={movie._id} className="border-b border-border/50 hover:bg-overlay/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {movie.posterUrl ? (
                        <img src={movie.posterUrl} alt="" className="w-8 h-11 rounded object-cover bg-overlay shrink-0" />
                      ) : (
                        <div className="w-8 h-11 rounded bg-overlay shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-white line-clamp-1">{movie.title}</p>
                        <Badge variant="gray">{movie.type}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{movie.genre.slice(0, 2).join(', ')}</td>
                  <td className="px-4 py-3 text-text-muted">{movie.year} / {movie.duration}min</td>
                  <td className="px-4 py-3">
                    <span className="text-yellow-400 font-mono">★ {movie.rating.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{movie.viewCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {movie.isPublished
                      ? <Badge variant="green">Nashr</Badge>
                      : <Badge variant="gray">Draft</Badge>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant={movie.isPublished ? 'danger' : 'primary'}
                        loading={actionLoading === movie._id}
                        onClick={() => void handleTogglePublish(movie)}
                      >
                        {movie.isPublished ? 'Yashirish' : 'Nashr'}
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={actionLoading === movie._id}
                          onClick={() => void handleDelete(movie)}
                        >
                          O'ch
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
