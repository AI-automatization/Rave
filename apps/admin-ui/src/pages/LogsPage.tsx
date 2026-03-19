import { useEffect, useState, useCallback } from 'react';
import { logsApi } from '../api/logs.api';
import { Pagination } from '../components/ui/Pagination';
import type { ApiLog, PaginationMeta } from '../types';

// ── helpers ─────────────────────────────────────────────────

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return '—';
  if (/iPhone/.test(userAgent)) {
    const ios = userAgent.match(/OS ([\d_]+)/);
    return `iPhone · iOS ${ios ? ios[1].replace(/_/g, '.') : ''}`;
  }
  if (/iPad/.test(userAgent)) return 'iPad (iOS)';
  if (/Android/.test(userAgent)) {
    const ver = userAgent.match(/Android ([\d.]+)/);
    const device = userAgent.match(/;\s*([^;)]+)\s*Build/);
    return `${device ? device[1].trim() : 'Android'} · Android ${ver ? ver[1] : ''}`;
  }
  if (/Expo/.test(userAgent)) return 'Expo Dev Client';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Macintosh/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  return userAgent.slice(0, 40);
}

function statusColor(code: number | null): string {
  if (!code) return 'text-text-dim';
  if (code < 300) return 'text-emerald-400';
  if (code < 500) return 'text-amber-400';
  return 'text-red-400';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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

// ── component ────────────────────────────────────────────────

export function LogsPage() {
  const [logs, setLogs]         = useState<ApiLog[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // filters
  const [level,   setLevel]   = useState('');
  const [service, setService] = useState('');
  const [userId,  setUserId]  = useState('');
  const [page,    setPage]    = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logsApi.list({
        page, limit: 50,
        level:   level   || undefined,
        service: service || undefined,
        userId:  userId  || undefined,
      });
      setLogs(res.data);
      setMeta(res.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, level, service, userId]);

  useEffect(() => { void load(); }, [load]);

  const errorCount = logs.filter(l => l.level === 'error').length;
  const affectedUsers = new Set(logs.filter(l => l.level === 'error' && l.userId).map(l => l.userId)).size;

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">Logs</h1>
          <p className="text-xs text-text-dim mt-0.5 font-mono">{meta.total.toLocaleString()} entries · 30-day TTL</p>
        </div>
        <button
          onClick={() => void load()}
          className="text-xs text-text-muted hover:text-white px-3 py-1.5 rounded-md border border-border hover:border-border-light transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          <span className="text-text-muted">Errors this page</span>
          <span className="font-mono font-semibold text-white">{errorCount}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span className="text-text-muted">Users affected</span>
          <span className="font-mono font-semibold text-white">{affectedUsers}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-xs">
          <span className="text-text-muted">Total</span>
          <span className="font-mono font-semibold text-white">{meta.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Level tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden text-xs">
          {['', 'error', 'warn', 'info'].map(v => (
            <button
              key={v}
              onClick={() => { setLevel(v); setPage(1); }}
              className={`px-3 py-1.5 border-r border-border last:border-r-0 transition-colors ${
                level === v ? 'bg-overlay text-white' : 'text-text-muted hover:text-white hover:bg-overlay/50'
              }`}
            >
              {v === '' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Service..."
          value={service}
          onChange={e => { setService(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-border-light w-32 font-mono"
        />

        <input
          type="text"
          placeholder="User ID..."
          value={userId}
          onChange={e => { setUserId(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-border-light w-44 font-mono"
        />

        {(level || service || userId) && (
          <button
            onClick={() => { setLevel(''); setService(''); setUserId(''); setPage(1); }}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-text-dim font-medium whitespace-nowrap w-28">Time</th>
                <th className="text-left px-3 py-2.5 text-text-dim font-medium w-16">Level</th>
                <th className="text-left px-3 py-2.5 text-text-dim font-medium w-24">Service</th>
                <th className="text-left px-3 py-2.5 text-text-dim font-medium w-24">Status</th>
                <th className="text-left px-3 py-2.5 text-text-dim font-medium w-36">User</th>
                <th className="text-left px-3 py-2.5 text-text-dim font-medium w-44">Device</th>
                <th className="text-left px-3 py-2.5 text-text-dim font-medium">Message</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-text-dim">Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-text-dim">No logs found</td>
                </tr>
              ) : logs.map((log) => (
                <>
                  <tr
                    key={log._id}
                    onClick={() => toggle(log._id)}
                    className={`border-b border-border/40 cursor-pointer transition-colors ${
                      expanded === log._id ? 'bg-overlay' : 'hover:bg-overlay/50'
                    } ${log.level === 'error' ? 'border-l-2 border-l-red-500/50' : ''}`}
                  >
                    {/* Time */}
                    <td className="px-4 py-2.5 font-mono text-text-dim whitespace-nowrap">
                      <span title={new Date(log.timestamp).toLocaleString()}>
                        {relativeTime(log.timestamp)}
                      </span>
                    </td>

                    {/* Level */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${LEVEL_COLOR[log.level]}`}>
                        {log.level}
                      </span>
                    </td>

                    {/* Service */}
                    <td className={`px-3 py-2.5 font-mono ${serviceColor(log.service)}`}>
                      {log.service ?? '—'}
                    </td>

                    {/* Status + Method */}
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                      {log.method && (
                        <span className="text-text-dim mr-1">{log.method}</span>
                      )}
                      {log.statusCode ? (
                        <span className={statusColor(log.statusCode)}>{log.statusCode}</span>
                      ) : '—'}
                    </td>

                    {/* User ID */}
                    <td className="px-3 py-2.5 font-mono">
                      {log.userId ? (
                        <span className="text-accent" title={log.userId}>
                          {log.userId.slice(-8)}
                        </span>
                      ) : (
                        <span className="text-text-dim">—</span>
                      )}
                    </td>

                    {/* Device */}
                    <td className="px-3 py-2.5 text-text-muted max-w-[176px] truncate" title={log.userAgent ?? ''}>
                      {parseDevice(log.userAgent)}
                    </td>

                    {/* Message */}
                    <td className="px-3 py-2.5 text-white max-w-xs truncate" title={log.message}>
                      {log.message}
                    </td>

                    {/* Expand chevron */}
                    <td className="px-3 py-2.5">
                      <svg
                        className={`w-3 h-3 text-text-dim transition-transform ${expanded === log._id ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </td>
                  </tr>

                  {/* Expanded detail */}
                  {expanded === log._id && (
                    <tr key={`${log._id}-detail`} className="border-b border-border/40 bg-overlay">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">

                          {/* Left: metadata */}
                          <div className="flex flex-col gap-2">
                            <p className="text-text-dim uppercase tracking-wider text-[10px] mb-1">Details</p>

                            <div className="flex gap-2">
                              <span className="text-text-dim w-20">User ID</span>
                              <span className="text-white break-all">{log.userId ?? '—'}</span>
                            </div>

                            <div className="flex gap-2">
                              <span className="text-text-dim w-20">IP</span>
                              <span className="text-white">{log.ip ?? '—'}</span>
                            </div>

                            {log.url && (
                              <div className="flex gap-2">
                                <span className="text-text-dim w-20">URL</span>
                                <span className="text-white break-all">{log.method} {log.url}</span>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <span className="text-text-dim w-20">Duration</span>
                              <span className="text-white">{log.duration != null ? `${log.duration}ms` : '—'}</span>
                            </div>

                            <div className="flex gap-2">
                              <span className="text-text-dim w-20">Timestamp</span>
                              <span className="text-white">{new Date(log.timestamp).toISOString()}</span>
                            </div>

                            {log.userAgent && (
                              <div className="flex gap-2">
                                <span className="text-text-dim w-20 shrink-0">UA</span>
                                <span className="text-text-muted break-all">{log.userAgent}</span>
                              </div>
                            )}
                          </div>

                          {/* Right: meta JSON */}
                          <div>
                            <p className="text-text-dim uppercase tracking-wider text-[10px] mb-1">Meta</p>
                            {Object.keys(log.meta ?? {}).length > 0 ? (
                              <pre className="text-white bg-bg rounded-lg p-3 overflow-x-auto text-[11px] leading-relaxed max-h-48">
                                {JSON.stringify(log.meta, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-text-dim">—</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
