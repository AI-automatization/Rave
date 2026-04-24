import { Fragment, useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { logsApi } from '../api/logs.api';
import { Pagination } from '../components/ui/Pagination';
import type { ApiLog, PaginationMeta } from '../types';

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return '—';
  if (/iPhone/.test(userAgent)) {
    const ios = userAgent.match(/OS ([\d_]+)/);
    return `iPhone · iOS ${ios ? ios[1].replace(/_/g, '.') : ''}`;
  }
  if (/iPad/.test(userAgent))     return 'iPad (iOS)';
  if (/Android/.test(userAgent)) {
    const ver    = userAgent.match(/Android ([\d.]+)/);
    const device = userAgent.match(/;\s*([^;)]+)\s*Build/);
    return `${device ? device[1].trim() : 'Android'} · ${ver ? ver[1] : ''}`;
  }
  if (/Expo/.test(userAgent))       return 'Expo Dev Client';
  if (/Windows/.test(userAgent))    return 'Windows';
  if (/Macintosh/.test(userAgent))  return 'macOS';
  if (/Linux/.test(userAgent))      return 'Linux';
  return userAgent.slice(0, 40);
}

function statusColor(code: number | null): string {
  if (!code)     return 'text-text-dim';
  if (code < 300) return 'text-emerald-400';
  if (code < 400) return 'text-blue-400';
  if (code < 500) return 'text-amber-400';
  return 'text-red-400';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}с`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}м`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}ч`;
  return `${Math.floor(h / 24)}д`;
}

const LEVEL_COLOR: Record<ApiLog['level'], string> = {
  info:  'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  warn:  'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  error: 'bg-red-500/10 text-red-400 ring-red-500/20',
};

const SERVICE_COLORS = [
  'text-violet-400', 'text-sky-400', 'text-teal-400', 'text-orange-400',
  'text-pink-400', 'text-lime-400', 'text-cyan-400',
];
const serviceColorCache = new Map<string, string>();
function serviceColor(name: string): string {
  if (!serviceColorCache.has(name)) {
    serviceColorCache.set(name, SERVICE_COLORS[serviceColorCache.size % SERVICE_COLORS.length]);
  }
  return serviceColorCache.get(name)!;
}

export function LogsPage() {
  const [logs, setLogs]         = useState<ApiLog[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [level,    setLevel]    = useState('');
  const [service,  setService]  = useState('');
  const [userId,   setUserId]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [page,     setPage]     = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logsApi.list({ page, limit: 50, level: level || undefined, service: service || undefined, userId: userId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
      setLogs(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, level, service, userId, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);

  const errorCount    = logs.filter((l) => l.level === 'error').length;
  const affectedUsers = new Set(logs.filter((l) => l.level === 'error' && l.userId).map((l) => l.userId)).size;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Логи</h1>
          <p className="text-text-muted text-sm mt-0.5 font-mono">{meta.total.toLocaleString('ru')} записей · TTL 30 дней</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-text-dim hover:text-white px-3 py-2 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-white/[0.06] shadow-card text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span className="text-text-muted">Ошибок на странице</span>
          <span className="font-mono font-semibold text-white">{errorCount}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-white/[0.06] shadow-card text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-text-muted">Задетых юзеров</span>
          <span className="font-mono font-semibold text-white">{affectedUsers}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-white/[0.06] shadow-card text-xs">
          <span className="text-text-muted">Всего</span>
          <span className="font-mono font-semibold text-white">{meta.total.toLocaleString('ru')}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-xl border border-white/[0.07] overflow-hidden text-xs">
          {['', 'error', 'warn', 'info'].map((v) => (
            <button
              key={v}
              onClick={() => { setLevel(v); setPage(1); }}
              className={`px-3 py-2 border-r border-white/[0.07] last:border-r-0 transition-colors ${
                level === v ? 'bg-accent/20 text-white' : 'text-text-muted hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {v === '' ? 'Все' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {[
          { placeholder: 'Сервис...', value: service, set: setService, cls: 'w-32' },
          { placeholder: 'User ID...', value: userId, set: setUserId, cls: 'w-44' },
        ].map(({ placeholder, value, set, cls }) => (
          <input
            key={placeholder}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => { set(e.target.value); setPage(1); }}
            className={`${cls} px-3 py-2 text-xs bg-surface border border-border rounded-xl text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono transition-all`}
          />
        ))}

        {[
          { value: dateFrom, set: setDateFrom, title: 'От' },
          { value: dateTo,   set: setDateTo,   title: 'До' },
        ].map(({ value, set, title }) => (
          <input
            key={title}
            type="date"
            value={value}
            title={title}
            onChange={(e) => { set(e.target.value); setPage(1); }}
            className="w-36 px-3 py-2 text-xs bg-surface border border-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono [color-scheme:dark] transition-all"
          />
        ))}

        {(level || service || userId || dateFrom || dateTo) && (
          <button
            onClick={() => { setLevel(''); setService(''); setUserId(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            className="px-3 py-2 text-xs text-text-dim hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Время', 'Level', 'Сервис', 'Status', 'User', 'Устройство', 'Сообщение', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-text-dim uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-text-dim">Загрузка...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-text-dim">Логи не найдены</td></tr>
              ) : logs.map((log) => (
                <Fragment key={log._id}>
                  <tr
                    onClick={() => setExpanded((p) => p === log._id ? null : log._id)}
                    className={`border-b border-white/[0.03] cursor-pointer transition-colors ${
                      expanded === log._id ? 'bg-overlay/60' : 'hover:bg-white/[0.02]'
                    } ${log.level === 'error' ? 'border-l-2 border-l-red-500/40' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-text-dim whitespace-nowrap" title={new Date(log.timestamp).toLocaleString()}>
                      {relativeTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${LEVEL_COLOR[log.level]}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 font-mono ${serviceColor(log.service)}`}>{log.service ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                      {log.method && <span className="text-text-dim mr-1">{log.method}</span>}
                      {log.statusCode ? <span className={statusColor(log.statusCode)}>{log.statusCode}</span> : '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      {log.userId
                        ? <span className="text-accent" title={log.userId}>…{log.userId.slice(-8)}</span>
                        : <span className="text-text-dim">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted max-w-[160px] truncate" title={log.userAgent ?? ''}>
                      {parseDevice(log.userAgent)}
                    </td>
                    <td className="px-4 py-2.5 text-white max-w-xs truncate" title={log.message}>{log.message}</td>
                    <td className="px-4 py-2.5">
                      <ChevronDown size={12} className={`text-text-dim transition-transform ${expanded === log._id ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>

                  {expanded === log._id && (
                    <tr key={`${log._id}-exp`} className="border-b border-white/[0.03] bg-overlay/40">
                      <td colSpan={8} className="px-5 py-4">
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          <div className="flex flex-col gap-1.5">
                            <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Детали</p>
                            {[
                              { label: 'User ID',   value: log.userId ?? '—' },
                              { label: 'IP',        value: log.ip ?? '—' },
                              { label: 'URL',       value: log.url ? `${log.method ?? ''} ${log.url}` : '—' },
                              { label: 'Duration',  value: log.duration != null ? `${log.duration}ms` : '—' },
                              { label: 'Timestamp', value: new Date(log.timestamp).toISOString() },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex gap-2">
                                <span className="text-text-dim w-20 shrink-0">{label}</span>
                                <span className="text-white break-all">{value}</span>
                              </div>
                            ))}
                            {log.userAgent && (
                              <div className="flex gap-2">
                                <span className="text-text-dim w-20 shrink-0">UA</span>
                                <span className="text-text-muted break-all">{log.userAgent}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Meta</p>
                            {Object.keys(log.meta ?? {}).length > 0 ? (
                              <pre className="text-white bg-bg/80 rounded-xl p-3 overflow-x-auto text-[11px] leading-relaxed max-h-48 border border-white/[0.04]">
                                {JSON.stringify(log.meta, null, 2)}
                              </pre>
                            ) : <span className="text-text-dim">—</span>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 border-t border-white/[0.04]">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
