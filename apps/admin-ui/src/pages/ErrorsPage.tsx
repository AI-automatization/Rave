import { useEffect, useState, useCallback } from 'react';
import { errorsApi, MobileIssue, MobileEvent, IssueStatus, ErrorStats } from '../api/errors.api';
import { Pagination } from '../components/ui/Pagination';

// ── helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG: Record<IssueStatus, { label: string; cls: string }> = {
  new:         { label: 'Новая',      cls: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30' },
  in_progress: { label: 'В работе',  cls: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' },
  resolved:    { label: 'Решено',    cls: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' },
  ignored:     { label: 'Игнор',     cls: 'bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30' },
};

const PLATFORM_ICON: Record<string, string> = {
  ios: '🍎',
  android: '🤖',
  unknown: '📱',
};

// ── StatCard ───────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, active, onClick }: {
  icon: string; value: number; label: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all w-full ${
        active
          ? 'bg-accent/10 border-accent/40'
          : 'bg-surface border-border hover:border-border/80 hover:bg-overlay'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ── EventDrawer ────────────────────────────────────────────────────────────

function EventDrawer({ issue, onClose }: { issue: MobileIssue; onClose: () => void }) {
  const [events, setEvents] = useState<MobileEvent[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    errorsApi.getEvents(issue.id, page)
      .then((r) => { setEvents(r.data); setTotal(r.meta.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [issue.id, page]);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-[600px] bg-bg border-l border-border flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-text-muted mb-1">{PLATFORM_ICON[issue.platform]} {issue.platform} · v{issue.appVersion}</p>
            <h2 className="text-base font-semibold text-white truncate">{issue.title}</h2>
            <p className="text-sm text-text-muted mt-0.5 line-clamp-2">{issue.message}</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-white transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Meta */}
        <div className="px-5 py-3 border-b border-border flex gap-6 text-xs text-text-muted">
          <span>Всего: <span className="text-white font-medium">{issue.count}</span></span>
          <span>Пользователей: <span className="text-white font-medium">{issue.affectedUsers}</span></span>
          <span>Первый: <span className="text-white font-medium">{relativeTime(issue.firstSeen)}</span></span>
          <span>Последний: <span className="text-white font-medium">{relativeTime(issue.lastSeen)}</span></span>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {loading && <p className="text-text-muted text-sm">Загрузка...</p>}
          {!loading && events.length === 0 && <p className="text-text-muted text-sm">Нет событий</p>}
          {events.map((ev) => (
            <div key={ev.id} className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{ev.device} · {ev.osVersion}</span>
                <span className="text-xs text-text-dim">{relativeTime(ev.timestamp)}</span>
              </div>
              {ev.userId && (
                <p className="text-xs text-text-muted">User: <span className="text-white font-mono">{ev.userId}</span></p>
              )}
              {/* Stack trace */}
              {ev.stackTrace && (ev.stackTrace as { values?: { stacktrace?: { frames?: unknown[] } }[] }).values?.[0]?.stacktrace?.frames && (
                <div>
                  <p className="text-xs text-text-dim mb-1">Stack trace</p>
                  <div className="bg-overlay rounded p-2 text-xs font-mono text-text-muted overflow-x-auto max-h-40">
                    {((ev.stackTrace as { values?: { stacktrace?: { frames?: Array<{ filename?: string; function?: string; lineno?: number }> } }[] }).values?.[0]?.stacktrace?.frames ?? [])
                      .slice(-8).reverse().map((f, i) => (
                        <div key={i} className="py-0.5">
                          <span className="text-accent">{f.function ?? '?'}</span>
                          <span className="text-text-dim"> at {f.filename ?? '?'}:{f.lineno ?? '?'}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {/* Breadcrumbs */}
              {ev.breadcrumbs && ev.breadcrumbs.length > 0 && (
                <div>
                  <p className="text-xs text-text-dim mb-1">Breadcrumbs ({ev.breadcrumbs.length})</p>
                  <div className="bg-overlay rounded p-2 text-xs font-mono text-text-muted overflow-x-auto max-h-32 flex flex-col gap-1">
                    {(ev.breadcrumbs as Array<{ type?: string; message?: string; category?: string }>)
                      .slice(-6).map((b, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-text-dim shrink-0">[{b.type ?? b.category ?? 'log'}]</span>
                          <span>{b.message ?? ''}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {total > 10 && (
          <div className="px-5 py-3 border-t border-border">
            <Pagination page={page} totalPages={Math.ceil(total / 10)} total={total} limit={10} onChange={(p) => setPage(p)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function ErrorsPage() {
  const [issues, setIssues] = useState<MobileIssue[]>([]);
  const [stats, setStats] = useState<ErrorStats>({ new: 0, in_progress: 0, resolved: 0, ignored: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<MobileIssue | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    errorsApi.stats().then(setStats).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await errorsApi.list({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setIssues(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (issue: MobileIssue, newStatus: IssueStatus) => {
    setUpdating(issue.id);
    try {
      const updated = await errorsApi.updateStatus(issue.id, newStatus);
      setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, status: updated.status } : i));
      loadStats();
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Mobile Errors</h1>
        <p className="text-text-muted text-sm mt-0.5">Ошибки приложения — анализ и управление</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="🔴" value={stats.new} label="Новые"
          active={statusFilter === 'new'} onClick={() => { setStatusFilter(statusFilter === 'new' ? '' : 'new'); setPage(1); }} />
        <StatCard icon="🟡" value={stats.in_progress} label="В работе"
          active={statusFilter === 'in_progress'} onClick={() => { setStatusFilter(statusFilter === 'in_progress' ? '' : 'in_progress'); setPage(1); }} />
        <StatCard icon="🟢" value={stats.resolved} label="Решено"
          active={statusFilter === 'resolved'} onClick={() => { setStatusFilter(statusFilter === 'resolved' ? '' : 'resolved'); setPage(1); }} />
        <StatCard icon="⚪" value={stats.ignored} label="Игнорируется"
          active={statusFilter === 'ignored'} onClick={() => { setStatusFilter(statusFilter === 'ignored' ? '' : 'ignored'); setPage(1); }} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[220px]">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по ошибке, сообщению..."
            className="flex-1 h-9 rounded-lg bg-surface border border-border px-3 text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button type="submit" className="h-9 px-3 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm hover:bg-accent/20 transition-colors">
            Поиск
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as IssueStatus | ''); setPage(1); }}
          className="h-9 rounded-lg bg-surface border border-border px-3 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors"
        >
          <option value="">Все статусы</option>
          <option value="new">Новые</option>
          <option value="in_progress">В работе</option>
          <option value="resolved">Решено</option>
          <option value="ignored">Игнорируется</option>
        </select>
        <span className="text-xs text-text-dim ml-auto">Всего: {total}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Ошибка</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Платформа</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-text-muted">Кол-во</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-text-muted">Юзеров</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Последний раз</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted text-sm">Загрузка...</td></tr>
            )}
            {!loading && issues.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted text-sm">Ошибок нет 🎉</td></tr>
            )}
            {issues.map((issue) => (
              <tr
                key={issue.id}
                className="hover:bg-overlay/50 transition-colors cursor-pointer"
                onClick={() => setSelected(issue)}
              >
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium text-white truncate">{issue.title}</p>
                  <p className="text-xs text-text-muted truncate mt-0.5">{issue.message || '—'}</p>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {PLATFORM_ICON[issue.platform]} {issue.platform}
                  {issue.appVersion && <span className="ml-1 text-text-dim text-xs">v{issue.appVersion}</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-mono font-semibold text-white">{issue.count}</span>
                </td>
                <td className="px-4 py-3 text-center text-text-muted">
                  {issue.affectedUsers}
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  {relativeTime(issue.lastSeen)}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={issue.status}
                    disabled={updating === issue.id}
                    onChange={(e) => handleStatusChange(issue, e.target.value as IssueStatus)}
                    className={`text-xs rounded-md px-2 py-1 border-0 focus:outline-none cursor-pointer transition-all ${STATUS_CONFIG[issue.status].cls}`}
                  >
                    {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} total={total} limit={20} onChange={setPage} />
      )}

      {/* Event Drawer */}
      {selected && <EventDrawer issue={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
