import { Fragment, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, Ban, CheckCircle } from 'lucide-react';
import { logsApi } from '../api/logs.api';
import { usersApi } from '../api/users.api';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { BlockReasonPicker } from '../components/ui/BlockReasonPicker';
import type { ApiLog, PaginationMeta } from '../types';

interface ActionInfo { label: string; color: string; dot: string; }

function resolveAction(method: string | null, url: string | null): ActionInfo {
  if (!method || !url) return { label: 'Request', color: 'text-text-muted', dot: 'bg-text-dim' };
  const m = method.toUpperCase();
  const u = url.replace(/\?.*$/, '');

  if (m === 'POST' && /\/auth\/login/.test(u))    return { label: 'Login',             color: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (m === 'POST' && /\/auth\/register/.test(u)) return { label: 'Register',          color: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (m === 'POST' && /\/auth\/logout/.test(u))   return { label: 'Logout',            color: 'text-text-muted',  dot: 'bg-text-dim' };
  if (m === 'POST' && /\/auth\/refresh/.test(u))  return { label: 'Token refresh',     color: 'text-text-dim',    dot: 'bg-text-dim' };
  if (m === 'POST' && /\/auth\/telegram/.test(u)) return { label: 'Telegram login',    color: 'text-sky-400',     dot: 'bg-sky-400' };
  if (m === 'POST' && /\/auth\/google/.test(u))   return { label: 'Google login',      color: 'text-sky-400',     dot: 'bg-sky-400' };
  if (/\/auth\/verify-email/.test(u))             return { label: 'Email verified',    color: 'text-blue-400',    dot: 'bg-blue-400' };
  if (/\/auth\/forgot-password/.test(u))          return { label: 'Password reset',    color: 'text-amber-400',   dot: 'bg-amber-400' };
  if (/\/auth\/reset-password/.test(u))           return { label: 'Password changed',  color: 'text-amber-400',   dot: 'bg-amber-400' };

  if (m === 'POST' && /\/content\/movies\/[^/]+\/progress/.test(u)) return { label: 'Watched movie',   color: 'text-violet-400', dot: 'bg-violet-400' };
  if (m === 'GET'  && /\/content\/movies\/[^/]+/.test(u))           return { label: 'Opened movie',    color: 'text-violet-300', dot: 'bg-violet-300' };
  if (m === 'GET'  && /\/content\/trending/.test(u))                return { label: 'Trending',        color: 'text-text-dim',   dot: 'bg-text-dim' };
  if (m === 'GET'  && /\/content\/search/.test(u))                  return { label: 'Search',          color: 'text-sky-300',    dot: 'bg-sky-300' };
  if (/\/content\/extract/.test(u))                                 return { label: 'Loaded video',    color: 'text-orange-400', dot: 'bg-orange-400' };

  if (m === 'POST'   && /\/watch-party\/rooms$/.test(u))              return { label: 'Created WP',  color: 'text-pink-400',   dot: 'bg-pink-400' };
  if (m === 'POST'   && /\/watch-party\/rooms\/[^/]+\/join/.test(u))  return { label: 'Joined WP',   color: 'text-pink-300',   dot: 'bg-pink-300' };
  if (m === 'POST'   && /\/watch-party\/rooms\/[^/]+\/leave/.test(u)) return { label: 'Left WP',     color: 'text-text-muted', dot: 'bg-text-dim' };
  if (m === 'DELETE' && /\/watch-party\/rooms\/[^/]+$/.test(u))       return { label: 'Closed WP',   color: 'text-red-400',    dot: 'bg-red-400' };

  if (m === 'POST' && /\/battles$/.test(u))               return { label: 'Started Battle',  color: 'text-amber-400',   dot: 'bg-amber-400' };
  if (m === 'POST' && /\/battles\/[^/]+\/accept/.test(u)) return { label: 'Accepted Battle', color: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (m === 'POST' && /\/battles\/[^/]+\/reject/.test(u)) return { label: 'Rejected Battle', color: 'text-red-400',     dot: 'bg-red-400' };

  if ((m === 'PATCH' || m === 'PUT') && /\/user\/profile/.test(u)) return { label: 'Updated profile', color: 'text-teal-400',   dot: 'bg-teal-400' };
  if (m === 'POST' && /\/user\/friends/.test(u))                   return { label: 'Added friend',    color: 'text-teal-300',   dot: 'bg-teal-300' };
  if (m === 'DELETE' && /\/user\/friends/.test(u))                 return { label: 'Removed friend',  color: 'text-text-muted', dot: 'bg-text-dim' };
  if (/\/user\/avatar/.test(u))                                    return { label: 'Changed avatar',  color: 'text-teal-400',   dot: 'bg-teal-400' };
  if (/\/health/.test(u)) return { label: 'Health check', color: 'text-text-dim', dot: 'bg-text-dim' };

  if (m === 'GET')    return { label: `View: ${u.split('/').slice(-2).join('/')}`,   color: 'text-text-dim',  dot: 'bg-text-dim' };
  if (m === 'POST')   return { label: `Create: ${u.split('/').slice(-2).join('/')}`, color: 'text-blue-300',  dot: 'bg-blue-300' };
  if (m === 'PATCH')  return { label: `Update: ${u.split('/').slice(-2).join('/')}`, color: 'text-teal-300',  dot: 'bg-teal-300' };
  if (m === 'DELETE') return { label: `Delete: ${u.split('/').slice(-2).join('/')}`, color: 'text-red-300',   dot: 'bg-red-300' };
  return { label: `${m} ${u.split('/').slice(-1)[0]}`, color: 'text-text-muted', dot: 'bg-text-dim' };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function parseDevice(ua: string | null): string {
  if (!ua) return '—';
  if (/iPhone/.test(ua))    return 'iPhone';
  if (/iPad/.test(ua))      return 'iPad';
  if (/Android/.test(ua)) {
    const d = ua.match(/;\s*([^;)]+)\s*Build/);
    return d ? d[1].trim() : 'Android';
  }
  if (/Expo/.test(ua))      return 'Expo Dev';
  if (/Windows/.test(ua))   return 'Windows';
  if (/Macintosh/.test(ua)) return 'macOS';
  return ua.slice(0, 20);
}

function statusColor(code: number | null): string {
  if (!code)     return 'text-text-dim';
  if (code < 300) return 'text-emerald-400';
  if (code < 400) return 'text-blue-400';
  if (code < 500) return 'text-amber-400';
  return 'text-red-400';
}

export function UserActivityPage() {
  const [searchParams] = useSearchParams();

  const [logs, setLogs]         = useState<ApiLog[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const urlUserId = searchParams.get('userId') ?? '';
  const [userIdInput, setUserIdInput]     = useState(urlUserId);
  const [appliedUserId, setAppliedUserId] = useState(urlUserId);
  const [page, setPage] = useState(1);

  const [blockModal, setBlockModal]   = useState<'block' | 'unblock' | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockSuccess, setBlockSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof logsApi.list>[0] = { page, limit: 50 };
      if (appliedUserId) params.userId = appliedUserId;
      const res = await logsApi.list(params);
      setLogs(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, appliedUserId]);

  useEffect(() => { void load(); }, [load]);

  const handleSearch = () => { setAppliedUserId(userIdInput.trim()); setPage(1); };
  const handleClear  = () => { setUserIdInput(''); setAppliedUserId(''); setPage(1); };

  const handleBlock = async () => {
    if (!appliedUserId) return;
    setBlockLoading(true);
    try {
      await usersApi.block(appliedUserId, blockReason || undefined);
      setBlockModal(null); setBlockReason('');
      setBlockSuccess('User blocked');
      setTimeout(() => setBlockSuccess(null), 3000);
    } finally { setBlockLoading(false); }
  };

  const handleUnblock = async () => {
    if (!appliedUserId) return;
    setBlockLoading(true);
    try {
      await usersApi.unblock(appliedUserId);
      setBlockModal(null);
      setBlockSuccess('User unblocked');
      setTimeout(() => setBlockSuccess(null), 3000);
    } finally { setBlockLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="User Activity"
        meta={appliedUserId
          ? `${meta.total.toLocaleString('en')} actions · …${appliedUserId.slice(-12)}`
          : `${meta.total.toLocaleString('en')} actions — all users`}
        actions={appliedUserId ? (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setBlockModal('unblock')}>
              <CheckCircle size={13} className="mr-1.5" /> Unblock
            </Button>
            <Button size="sm" variant="danger" onClick={() => setBlockModal('block')}>
              <Ban size={13} className="mr-1.5" /> Block
            </Button>
          </div>
        ) : undefined}
      />

      {blockSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle size={14} /> {blockSuccess}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          <input
            type="text"
            placeholder="User ID (optional)..."
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="input-base pl-9 font-mono"
          />
        </div>
        <Button variant="primary" onClick={handleSearch}>Search</Button>
        {appliedUserId && <Button variant="ghost" onClick={handleClear}>All users</Button>}
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Time', 'Action', 'Status', 'Device', 'IP', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    {[10, 22, 8, 14, 10, 4].map((w, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 shimmer-bg rounded" style={{ width: `${w + i * 2}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No activity found</td></tr>
              ) : logs.map((log) => {
                const action    = resolveAction(log.method, log.url);
                const isExpanded = expanded === log._id;
                const isError   = log.level === 'error' || (log.statusCode !== null && log.statusCode >= 500);

                return (
                  <Fragment key={log._id}>
                    <tr
                      onClick={() => setExpanded((p) => p === log._id ? null : log._id)}
                      className={`border-b border-white/[0.03] cursor-pointer transition-colors ${
                        isExpanded ? 'bg-overlay/60' : 'hover:bg-white/[0.02]'
                      } ${isError ? 'border-l-2 border-l-red-500/40' : ''}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-text-dim whitespace-nowrap" title={new Date(log.timestamp).toLocaleString()}>
                        {relativeTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${action.dot}`} />
                          <span className={`font-medium ${action.color}`}>{action.label}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-2.5 font-mono ${statusColor(log.statusCode)}`}>
                        {log.statusCode ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-text-muted" title={log.userAgent ?? ''}>
                        {parseDevice(log.userAgent)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-text-dim">{log.ip ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <ChevronDown size={12} className={`text-text-dim transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${log._id}-exp`} className="border-b border-white/[0.03] bg-overlay/40">
                        <td colSpan={6} className="px-5 py-3">
                          <div className="flex flex-wrap gap-x-8 gap-y-1.5 text-xs font-mono">
                            {[
                              { label: 'Time',     value: new Date(log.timestamp).toLocaleString('en-US') },
                              { label: 'URL',      value: `${log.method ?? ''} ${log.url ?? '—'}` },
                              { label: 'Service',  value: log.service },
                              { label: 'Duration', value: log.duration != null ? `${log.duration}ms` : '—' },
                              { label: 'Message',  value: log.message },
                            ].filter((i) => i.value).map(({ label, value }) => (
                              <div key={label} className="flex gap-2">
                                <span className="text-text-dim w-20 shrink-0">{label}</span>
                                <span className="text-white break-all">{value}</span>
                              </div>
                            ))}
                            {log.userAgent && (
                              <div className="flex gap-2 w-full">
                                <span className="text-text-dim w-20 shrink-0">UA</span>
                                <span className="text-text-dim break-all">{log.userAgent}</span>
                              </div>
                            )}
                            {Object.keys(log.meta ?? {}).length > 0 && (
                              <div className="flex gap-2 w-full">
                                <span className="text-text-dim w-20 shrink-0">Meta</span>
                                <pre className="text-white bg-bg/80 rounded-lg px-2 py-1 overflow-x-auto text-[11px] leading-relaxed max-h-32 border border-white/[0.04]">
                                  {JSON.stringify(log.meta, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 border-t border-white/[0.04]">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      </div>

      <Modal open={blockModal === 'block'} onClose={() => { setBlockModal(null); setBlockReason(''); }} title="Block user">
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-text-muted">
            ID: <span className="text-white font-mono text-xs">…{appliedUserId.slice(-12)}</span>
          </p>
          <BlockReasonPicker value={blockReason} onChange={setBlockReason} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setBlockModal(null); setBlockReason(''); }}>Cancel</Button>
            <Button variant="danger" loading={blockLoading} disabled={blockReason.trim().length < 3}
              onClick={() => void handleBlock()}>
              Block
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={blockModal === 'unblock'} onClose={() => setBlockModal(null)} title="Unblock user">
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-text-muted">
            Unblock <span className="text-white font-mono">…{appliedUserId.slice(-12)}</span>?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setBlockModal(null)}>Cancel</Button>
            <Button variant="primary" loading={blockLoading} onClick={() => void handleUnblock()}>Unblock</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
