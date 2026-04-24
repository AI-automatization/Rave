import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, User, X, AlertTriangle, Clock, Smartphone, ChevronDown, ChevronRight } from 'lucide-react';
import { errorsApi, MobileIssue, MobileEvent, IssueStatus, ErrorStats } from '../api/errors.api';
import { usersApi } from '../api/users.api';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import type { AdminUser } from '../types';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}с назад`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG: Record<IssueStatus, { label: string; variant: 'red' | 'yellow' | 'green' | 'gray' }> = {
  new:         { label: 'Новая',    variant: 'red' },
  in_progress: { label: 'В работе', variant: 'yellow' },
  resolved:    { label: 'Решено',   variant: 'green' },
  ignored:     { label: 'Игнор',    variant: 'gray' },
};

const PLATFORM_ICON: Record<string, string> = { ios: '🍎', android: '🤖', unknown: '📱' };

// ── Stat filter button ────────────────────────────────────────────────────────

function StatFilter({ value, label, active, onClick, color }: {
  value: number; label: string; active: boolean; onClick: () => void;
  color: 'red' | 'amber' | 'green' | 'gray';
}) {
  const colors = {
    red:   { dot: 'bg-red-400',     ring: 'ring-red-500/30',     bg: 'bg-red-500/10' },
    amber: { dot: 'bg-amber-400',   ring: 'ring-amber-500/30',   bg: 'bg-amber-500/10' },
    green: { dot: 'bg-emerald-400', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10' },
    gray:  { dot: 'bg-text-muted',  ring: 'ring-white/10',       bg: 'bg-white/5' },
  }[color];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all border w-full shadow-card
        ${active
          ? `${colors.bg} ring-1 ${colors.ring} border-white/[0.08]`
          : 'bg-card border-white/[0.06] hover:border-white/[0.1]'
        }`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
      <div>
        <p className="text-xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ── UserCard ─────────────────────────────────────────────────────────────────

function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    usersApi.getById(userId).then(setUser).catch(() => {});
  }, [userId]);

  if (!user) return (
    <div className="flex items-center gap-2 text-xs text-text-dim">
      <User size={13} />
      <span className="font-mono">{userId.slice(-12)}</span>
    </div>
  );

  const hue = (user.email.charCodeAt(0) * 137) % 360;
  return (
    <div className="flex items-center gap-3 bg-accent/[0.06] border border-accent/15 rounded-xl px-3 py-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: `hsl(${hue},40%,20%)`, color: `hsl(${hue},70%,70%)` }}
      >
        {(user.username || user.email).slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{user.username || user.email}</p>
        <p className="text-[11px] text-text-muted truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={`mailto:${user.email}`}
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          <Mail size={11} /> Связаться
        </a>
        <Link
          to={`/users/${user._id}`}
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-white/[0.06] text-text-muted hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          <User size={11} /> Профиль
        </Link>
      </div>
    </div>
  );
}

// ── InfoBlock ─────────────────────────────────────────────────────────────────

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg/60 rounded-lg px-3 py-2 border border-white/[0.04]">
      <p className="text-[10px] text-text-dim uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs text-white font-medium truncate">{value}</p>
    </div>
  );
}

// ── EventDrawer ───────────────────────────────────────────────────────────────

function EventDrawer({ issue, onClose }: { issue: MobileIssue; onClose: () => void }) {
  const [events, setEvents]   = useState<MobileEvent[]>([]);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedRaw, setExpandedRaw] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    errorsApi.getEvents(issue.id, page)
      .then((r) => { setEvents(r.data); setTotal(r.meta.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [issue.id, page]);

  return (
    <div className="fixed inset-0 z-40 flex animate-fade-in">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[640px] bg-bg border-l border-white/[0.07] flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-dim">{PLATFORM_ICON[issue.platform]} {issue.platform}</span>
              {issue.appVersion && <span className="text-xs text-text-dim">v{issue.appVersion}</span>}
              <Badge variant={STATUS_CONFIG[issue.status]?.variant ?? 'gray'} dot>
                {STATUS_CONFIG[issue.status]?.label ?? issue.status}
              </Badge>
            </div>
            <h2 className="text-sm font-semibold text-white">{issue.title}</h2>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">{issue.message}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-white hover:bg-white/[0.07] transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>

        {/* Meta row */}
        <div className="px-5 py-2.5 border-b border-white/[0.04] flex flex-wrap gap-x-5 gap-y-1 shrink-0">
          {[
            { icon: AlertTriangle, label: 'Событий',   value: String(issue.count) },
            { icon: User,          label: 'Юзеров',    value: String(issue.affectedUsers) },
            { icon: Clock,         label: 'Первый',    value: relativeTime(issue.firstSeen) },
            { icon: Clock,         label: 'Последний', value: relativeTime(issue.lastSeen) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-text-muted">
              <Icon size={11} className="text-text-dim" />
              <span>{label}:</span>
              <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {loading && Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 bg-card rounded-2xl animate-pulse" />
          ))}
          {!loading && events.length === 0 && (
            <div className="text-center py-12 text-text-muted text-sm">Нет событий</div>
          )}
          {events.map((ev) => {
            const ctx = ev.context as {
              device?: { model?: string; name?: string; year_class?: number; screen_width?: number; screen_height?: number; screen_density?: number; color_scheme?: string };
              os?: { name?: string; version?: string };
              app?: { app_version?: string; build_number?: string; app_name?: string; ownership?: string };
              runtime?: { expo_sdk?: string; js_engine?: string };
              componentStack?: string;
            } | null;
            const stackFrames = (ev.stackTrace as { values?: { stacktrace?: { frames?: Array<{ filename?: string; function?: string; lineno?: number }> } }[] }).values?.[0]?.stacktrace?.frames ?? [];
            const isRawExpanded = expandedRaw === ev.id;

            return (
              <div key={ev.id} className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden shadow-card">

                {/* Event header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] bg-overlay/40">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      ev.level === 'fatal' ? 'bg-red-500/20 text-red-400' :
                      ev.level === 'error' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{ev.level}</span>
                    <span className="text-xs text-text-dim">{PLATFORM_ICON[ev.platform] ?? '📱'} {ev.platform}</span>
                  </div>
                  <span className="text-xs text-text-dim font-mono">{relativeTime(ev.timestamp)}</span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  {/* Device grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <InfoBlock label="Устройство" value={ctx?.device?.model ?? ev.device ?? '—'} />
                    <InfoBlock label="ОС" value={ctx?.os ? `${ctx.os.name ?? ''} ${ctx.os.version ?? ''}`.trim() : ev.osVersion ?? '—'} />
                    <InfoBlock label="Версия" value={ctx?.app?.app_version ?? ev.appVersion ?? '—'} />
                    <InfoBlock label="Build" value={ctx?.app?.build_number ?? '—'} />
                    <InfoBlock label="Экран" value={ctx?.device?.screen_width ? `${ctx.device.screen_width}×${ctx.device.screen_height} @${ctx.device.screen_density}x` : '—'} />
                    <InfoBlock label="Год устройства" value={ctx?.device?.year_class ? String(ctx.device.year_class) : '—'} />
                    <InfoBlock label="Тема" value={ctx?.device?.color_scheme ?? '—'} />
                    <InfoBlock label="JS Engine" value={ctx?.runtime?.js_engine ?? '—'} />
                    <InfoBlock label="Expo SDK" value={ctx?.runtime?.expo_sdk ?? '—'} />
                    <InfoBlock label="Ownership" value={ctx?.app?.ownership ?? '—'} />
                  </div>

                  {/* User */}
                  {ev.userId && <UserCard userId={ev.userId} />}

                  {/* Stack trace */}
                  {stackFrames.length > 0 && (
                    <div>
                      <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5 font-medium">Stack trace ({stackFrames.length})</p>
                      <div className="bg-bg rounded-xl p-3 text-xs font-mono overflow-x-auto max-h-48 border border-white/[0.04]">
                        {[...stackFrames].reverse().map((f, i) => (
                          <div key={i} className={`py-0.5 ${i === 0 ? 'text-red-400' : 'text-text-muted'}`}>
                            <span className={i === 0 ? 'text-red-400' : 'text-accent/80'}>{f.function ?? '?'}</span>
                            <span className="text-text-dim"> at {f.filename ?? '?'}:{f.lineno ?? '?'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Component stack */}
                  {ctx?.componentStack && (
                    <div>
                      <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5 font-medium">Component stack</p>
                      <div className="bg-bg rounded-xl p-3 text-xs font-mono text-amber-400/80 overflow-x-auto max-h-28 whitespace-pre border border-white/[0.04]">
                        {ctx.componentStack.trim()}
                      </div>
                    </div>
                  )}

                  {/* Breadcrumbs */}
                  {ev.breadcrumbs && ev.breadcrumbs.length > 0 && (
                    <div>
                      <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5 font-medium">Breadcrumbs ({ev.breadcrumbs.length})</p>
                      <div className="bg-bg rounded-xl p-3 text-xs font-mono text-text-muted overflow-x-auto max-h-36 flex flex-col gap-0.5 border border-white/[0.04]">
                        {(ev.breadcrumbs as Array<{ type?: string; message?: string; category?: string; timestamp?: string }>)
                          .map((b, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <span className="text-text-dim shrink-0">[{b.type ?? b.category ?? 'log'}]</span>
                              <span className="flex-1 truncate">{b.message ?? ''}</span>
                              {b.timestamp && <span className="text-text-dim shrink-0 text-[10px]">{relativeTime(b.timestamp)}</span>}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Raw context toggle */}
                  <button
                    onClick={() => setExpandedRaw(isRawExpanded ? null : ev.id)}
                    className="flex items-center gap-1.5 text-[11px] text-text-dim hover:text-text-muted transition-colors"
                  >
                    {isRawExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Raw context
                  </button>
                  {isRawExpanded && (
                    <div className="bg-bg rounded-xl p-3 text-xs font-mono text-text-muted overflow-x-auto max-h-40 whitespace-pre border border-white/[0.04]">
                      {JSON.stringify(ev.context, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {total > 10 && (
          <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
            <Pagination page={page} totalPages={Math.ceil(total / 10)} total={total} limit={10} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ErrorsPage() {
  const [issues, setIssues]     = useState<MobileIssue[]>([]);
  const [stats, setStats]       = useState<ErrorStats>({ new: 0, in_progress: 0, resolved: 0, ignored: 0 });
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<MobileIssue | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    errorsApi.stats().then(setStats).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await errorsApi.list({ page, limit: 20, status: statusFilter || undefined, search: search || undefined });
      setIssues(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (issue: MobileIssue, newStatus: IssueStatus) => {
    setUpdating(issue.id);
    try {
      const updated = await errorsApi.updateStatus(issue.id, newStatus);
      setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, status: updated.status } : i));
      loadStats();
    } catch { /* silent */ }
    finally { setUpdating(null); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ошибки</h1>
          <p className="text-text-muted text-sm mt-0.5">Мобильные краши и исключения</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dim bg-card rounded-xl px-3 py-2 border border-white/[0.06]">
          <Smartphone size={13} />
          <span>{total.toLocaleString('ru')} всего</span>
        </div>
      </div>

      {/* Stat filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatFilter value={stats.new}         label="Новые"        color="red"   active={statusFilter === 'new'}         onClick={() => { setStatusFilter(statusFilter === 'new' ? '' : 'new'); setPage(1); }} />
        <StatFilter value={stats.in_progress} label="В работе"     color="amber" active={statusFilter === 'in_progress'} onClick={() => { setStatusFilter(statusFilter === 'in_progress' ? '' : 'in_progress'); setPage(1); }} />
        <StatFilter value={stats.resolved}    label="Исправлено"   color="green" active={statusFilter === 'resolved'}    onClick={() => { setStatusFilter(statusFilter === 'resolved' ? '' : 'resolved'); setPage(1); }} />
        <StatFilter value={stats.ignored}     label="Игнорируется" color="gray"  active={statusFilter === 'ignored'}     onClick={() => { setStatusFilter(statusFilter === 'ignored' ? '' : 'ignored'); setPage(1); }} />
      </div>

      {/* Search + status */}
      <div className="flex flex-wrap items-center gap-2.5">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по ошибке, сообщению..."
            className="w-full bg-surface border border-border hover:border-border-md rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as IssueStatus | ''); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все статусы</option>
          <option value="new">Новые</option>
          <option value="in_progress">В работе</option>
          <option value="resolved">Исправлено</option>
          <option value="ignored">Игнорируется</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Ошибка', 'Платформа', 'Событий', 'Юзеров', 'Последний', 'Статус'].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${50 + (i * j * 11) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : issues.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-text-muted">Ошибок нет 🎉</td>
              </tr>
            ) : issues.map((issue) => (
              <tr key={issue.id} className="tr-hover cursor-pointer" onClick={() => setSelected(issue)}>
                <td className="px-5 py-4 max-w-xs">
                  <p className="font-medium text-white truncate">{issue.title}</p>
                  <p className="text-xs text-text-muted truncate mt-0.5">{issue.message || '—'}</p>
                </td>
                <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">
                  {PLATFORM_ICON[issue.platform]} {issue.platform}
                  {issue.appVersion && <span className="ml-1 text-text-dim">v{issue.appVersion}</span>}
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono font-semibold text-white">{issue.count}</span>
                </td>
                <td className="px-5 py-4 text-text-muted">{issue.affectedUsers}</td>
                <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">{relativeTime(issue.lastSeen)}</td>
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={issue.status}
                    disabled={updating === issue.id}
                    onChange={(e) => void handleStatusChange(issue, e.target.value as IssueStatus)}
                    className={`text-xs rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer transition-all appearance-none ${
                      issue.status === 'new'         ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      issue.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      issue.status === 'resolved'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-white/5 text-text-muted border-white/10'
                    }`}
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

        {totalPages > 1 && (
          <div className="px-5 border-t border-white/[0.04]">
            <Pagination page={page} totalPages={totalPages} total={total} limit={20} onChange={setPage} />
          </div>
        )}
      </div>

      {selected && <EventDrawer issue={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
