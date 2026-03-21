import { Fragment, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { logsApi } from '../api/logs.api';
import { usersApi } from '../api/users.api';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import type { ApiLog, PaginationMeta } from '../types';

// ── Action mapping ────────────────────────────────────────────

interface ActionInfo {
  label: string;
  color: string;
  dot: string;
}

function resolveAction(method: string | null, url: string | null): ActionInfo {
  if (!method || !url) return { label: 'So\'rov', color: 'text-text-muted', dot: 'bg-text-dim' };

  const m = method.toUpperCase();
  const u = url.replace(/\?.*$/, ''); // strip query params

  // Auth
  if (m === 'POST' && /\/auth\/login/.test(u))    return { label: 'Kirdi',              color: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (m === 'POST' && /\/auth\/register/.test(u)) return { label: 'Ro\'yxatdan o\'tdi', color: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (m === 'POST' && /\/auth\/logout/.test(u))   return { label: 'Chiqdi',             color: 'text-text-muted',  dot: 'bg-gray-500' };
  if (m === 'POST' && /\/auth\/refresh/.test(u))  return { label: 'Token yangiladi',    color: 'text-text-dim',    dot: 'bg-gray-600' };
  if (m === 'POST' && /\/auth\/telegram/.test(u)) return { label: 'Telegram bilan kirdi', color: 'text-sky-400',   dot: 'bg-sky-400' };
  if (m === 'POST' && /\/auth\/google/.test(u))   return { label: 'Google bilan kirdi',   color: 'text-sky-400',   dot: 'bg-sky-400' };
  if (/\/auth\/verify-email/.test(u))             return { label: 'Emailni tasdiqladi', color: 'text-blue-400',    dot: 'bg-blue-400' };
  if (/\/auth\/forgot-password/.test(u))          return { label: 'Parol tiklash so\'radi', color: 'text-amber-400', dot: 'bg-amber-400' };
  if (/\/auth\/reset-password/.test(u))           return { label: 'Parol tikladi',      color: 'text-amber-400',   dot: 'bg-amber-400' };

  // Content
  if (m === 'POST' && /\/content\/movies\/[^/]+\/progress/.test(u)) return { label: 'Film davom ettirdi', color: 'text-violet-400', dot: 'bg-violet-400' };
  if (m === 'GET'  && /\/content\/movies\/[^/]+/.test(u))           return { label: 'Filmni ko\'rdi',     color: 'text-violet-300', dot: 'bg-violet-300' };
  if (m === 'GET'  && /\/content\/trending/.test(u))                return { label: 'Trending ko\'rdi',   color: 'text-text-dim',   dot: 'bg-gray-600' };
  if (m === 'GET'  && /\/content\/search/.test(u))                  return { label: 'Qidiruv qildi',      color: 'text-sky-300',    dot: 'bg-sky-300' };
  if (m === 'GET'  && /\/content\/continue-watching/.test(u))       return { label: 'Davom ettirishlarini ko\'rdi', color: 'text-text-dim', dot: 'bg-gray-600' };
  if (/\/content\/extract/.test(u))                                 return { label: 'Video extract qildi', color: 'text-orange-400', dot: 'bg-orange-400' };

  // Watch Party
  if (m === 'POST'   && /\/watch-party\/rooms$/.test(u))              return { label: 'Watch Party yaratdi',   color: 'text-pink-400',   dot: 'bg-pink-400' };
  if (m === 'POST'   && /\/watch-party\/rooms\/[^/]+\/join/.test(u))  return { label: 'Watch Party ga kirdi',  color: 'text-pink-300',   dot: 'bg-pink-300' };
  if (m === 'POST'   && /\/watch-party\/rooms\/[^/]+\/leave/.test(u)) return { label: 'Watch Party dan chiqdi', color: 'text-text-muted', dot: 'bg-gray-500' };
  if (m === 'DELETE' && /\/watch-party\/rooms\/[^/]+$/.test(u))       return { label: 'Watch Party yopdi',    color: 'text-red-400',    dot: 'bg-red-400' };

  // Battle
  if (m === 'POST' && /\/battles$/.test(u))                     return { label: 'Battle boshladi',    color: 'text-amber-400', dot: 'bg-amber-400' };
  if (m === 'POST' && /\/battles\/[^/]+\/accept/.test(u))       return { label: 'Battle qabul qildi', color: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (m === 'POST' && /\/battles\/[^/]+\/reject/.test(u))       return { label: 'Battle rad etdi',    color: 'text-red-400',   dot: 'bg-red-400' };

  // User profile
  if ((m === 'PATCH' || m === 'PUT') && /\/user\/profile/.test(u)) return { label: 'Profilni yangiladi',  color: 'text-teal-400', dot: 'bg-teal-400' };
  if (m === 'POST' && /\/user\/friends/.test(u))                   return { label: 'Do\'st qo\'shdi',    color: 'text-teal-300', dot: 'bg-teal-300' };
  if (m === 'DELETE' && /\/user\/friends/.test(u))                 return { label: 'Do\'stdan o\'chirdi', color: 'text-text-muted', dot: 'bg-gray-500' };
  if (/\/user\/avatar/.test(u))                                    return { label: 'Avatar o\'zgartirdi', color: 'text-teal-400', dot: 'bg-teal-400' };

  // Notifications
  if (m === 'POST' && /\/notification\/fcm/.test(u))  return { label: 'Push token ro\'yxatdan o\'tdi', color: 'text-text-dim', dot: 'bg-gray-600' };

  // Skip system/health noise
  if (/\/health/.test(u)) return { label: 'Health check', color: 'text-text-dim', dot: 'bg-gray-700' };

  // Generic fallback by method
  if (m === 'GET')    return { label: `Ko\'rdi: ${u.split('/').slice(-2).join('/')}`,    color: 'text-text-dim',  dot: 'bg-gray-600' };
  if (m === 'POST')   return { label: `Yaratdi: ${u.split('/').slice(-2).join('/')}`,   color: 'text-blue-300',  dot: 'bg-blue-300' };
  if (m === 'PATCH')  return { label: `Yangiladi: ${u.split('/').slice(-2).join('/')}`, color: 'text-teal-300',  dot: 'bg-teal-300' };
  if (m === 'DELETE') return { label: `O\'chirdi: ${u.split('/').slice(-2).join('/')}`, color: 'text-red-300',   dot: 'bg-red-300' };
  return { label: `${m} ${u.split('/').slice(-1)[0]}`, color: 'text-text-muted', dot: 'bg-gray-500' };
}

// ── helpers ───────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s oldin`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h oldin`;
  return `${Math.floor(h / 24)}k oldin`;
}

function parseDevice(ua: string | null): string {
  if (!ua) return '—';
  if (/iPhone/.test(ua))   return 'iPhone';
  if (/iPad/.test(ua))     return 'iPad';
  if (/Android/.test(ua)) {
    const d = ua.match(/;\s*([^;)]+)\s*Build/);
    return d ? d[1].trim() : 'Android';
  }
  if (/Expo/.test(ua))     return 'Expo Dev';
  if (/Windows/.test(ua))  return 'Windows';
  if (/Macintosh/.test(ua)) return 'macOS';
  return ua.slice(0, 20);
}

function statusColor(code: number | null): string {
  if (!code) return 'text-text-dim';
  if (code < 300) return 'text-emerald-400';
  if (code < 400) return 'text-blue-400';
  if (code < 500) return 'text-amber-400';
  return 'text-red-400';
}

// ── component ─────────────────────────────────────────────────

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

  // Block/unblock actions
  const [blockModal, setBlockModal] = useState<'block' | 'unblock' | null>(null);
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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, appliedUserId]);

  useEffect(() => { void load(); }, [load]);

  const handleSearch = () => {
    const trimmed = userIdInput.trim();
    setAppliedUserId(trimmed);
    setPage(1);
  };

  const handleClear = () => {
    setUserIdInput('');
    setAppliedUserId('');
    setPage(1);
  };

  const handleBlock = async () => {
    if (!appliedUserId) return;
    setBlockLoading(true);
    try {
      await usersApi.block(appliedUserId, blockReason || undefined);
      setBlockModal(null);
      setBlockReason('');
      setBlockSuccess('Foydalanuvchi bloklandi');
      setTimeout(() => setBlockSuccess(null), 3000);
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!appliedUserId) return;
    setBlockLoading(true);
    try {
      await usersApi.unblock(appliedUserId);
      setBlockModal(null);
      setBlockSuccess('Foydalanuvchi blokdan chiqarildi');
      setTimeout(() => setBlockSuccess(null), 3000);
    } finally {
      setBlockLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">Foydalanuvchi Harakatlari</h1>
          <p className="text-xs text-text-dim mt-0.5">
            {appliedUserId
              ? `${meta.total.toLocaleString()} ta harakat · userId: ${appliedUserId}`
              : `${meta.total.toLocaleString()} ta harakat — barcha foydalanuvchilar`}
          </p>
        </div>
        {appliedUserId && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setBlockModal('unblock')}>
              Blokdan chiqarish
            </Button>
            <Button size="sm" variant="danger" onClick={() => setBlockModal('block')}>
              Bloklash
            </Button>
          </div>
        )}
      </div>

      {/* Success toast */}
      {blockSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-2 rounded-lg">
          {blockSuccess}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="User ID (ixtiyoriy)..."
          value={userIdInput}
          onChange={e => setUserIdInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1 min-w-48 max-w-sm px-3 py-2 text-sm bg-surface border border-border rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-border-light font-mono"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          Filter
        </button>
        {appliedUserId && (
          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm text-text-muted hover:text-white border border-border rounded-lg hover:border-border-light transition-colors"
          >
            Barchasi
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-text-dim text-sm">Yuklanmoqda...</div>
        </div>
      )}

      {/* No results */}
      {!loading && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-text-muted text-sm">Log topilmadi</p>
          {appliedUserId && <p className="text-text-dim text-xs font-mono">{appliedUserId}</p>}
        </div>
      )}

      {/* Timeline */}
      {!loading && logs.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-text-dim font-medium w-32">Vaqt</th>
                  <th className="text-left px-3 py-2.5 text-text-dim font-medium">Harakat</th>
                  <th className="text-left px-3 py-2.5 text-text-dim font-medium w-20">Status</th>
                  <th className="text-left px-3 py-2.5 text-text-dim font-medium w-28">Qurilma</th>
                  <th className="text-left px-3 py-2.5 text-text-dim font-medium w-24">IP</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const action = resolveAction(log.method, log.url);
                  const isExpanded = expanded === log._id;
                  const isError = log.level === 'error' || (log.statusCode !== null && log.statusCode >= 500);

                  return (
                    <Fragment key={log._id}>
                      <tr
                        onClick={() => setExpanded(prev => prev === log._id ? null : log._id)}
                        className={`border-b border-border/40 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-overlay' : 'hover:bg-overlay/50'
                        } ${isError ? 'border-l-2 border-l-red-500/60' : ''}`}
                      >
                        {/* Time */}
                        <td className="px-4 py-2.5 font-mono">
                          <span className="text-text-dim" title={new Date(log.timestamp).toLocaleString('ru-RU')}>
                            {relativeTime(log.timestamp)}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${action.dot}`} />
                            <span className={`font-medium ${action.color}`}>{action.label}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className={`px-3 py-2.5 font-mono ${statusColor(log.statusCode)}`}>
                          {log.statusCode ?? '—'}
                        </td>

                        {/* Device */}
                        <td className="px-3 py-2.5 text-text-muted" title={log.userAgent ?? ''}>
                          {parseDevice(log.userAgent)}
                        </td>

                        {/* IP */}
                        <td className="px-3 py-2.5 font-mono text-text-dim">
                          {log.ip ?? '—'}
                        </td>

                        {/* Expand */}
                        <td className="px-3 py-2.5">
                          <svg
                            className={`w-3 h-3 text-text-dim transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </td>
                      </tr>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <tr key={`${log._id}-detail`} className="border-b border-border/40 bg-overlay">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="flex flex-wrap gap-6 text-xs font-mono">
                              <div className="flex gap-2">
                                <span className="text-text-dim w-16">Vaqt</span>
                                <span className="text-white">{new Date(log.timestamp).toLocaleString('ru-RU')}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-text-dim w-16">URL</span>
                                <span className="text-white">{log.method} {log.url ?? '—'}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-text-dim w-16">Servis</span>
                                <span className="text-teal-400">{log.service}</span>
                              </div>
                              {log.duration !== null && (
                                <div className="flex gap-2">
                                  <span className="text-text-dim w-16">Davomiylik</span>
                                  <span className="text-white">{log.duration}ms</span>
                                </div>
                              )}
                              {log.message && (
                                <div className="flex gap-2">
                                  <span className="text-text-dim w-16">Xabar</span>
                                  <span className="text-text-muted">{log.message}</span>
                                </div>
                              )}
                              {log.userAgent && (
                                <div className="flex gap-2 w-full">
                                  <span className="text-text-dim w-16 shrink-0">UA</span>
                                  <span className="text-text-dim break-all">{log.userAgent}</span>
                                </div>
                              )}
                              {Object.keys(log.meta ?? {}).length > 0 && (
                                <div className="flex gap-2 w-full">
                                  <span className="text-text-dim w-16 shrink-0">Meta</span>
                                  <pre className="text-white bg-bg rounded px-2 py-1 overflow-x-auto text-[11px] leading-relaxed max-h-32">
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
      )}

      {/* Block Modal */}
      <Modal
        open={blockModal === 'block'}
        onClose={() => { setBlockModal(null); setBlockReason(''); }}
        title="Foydalanuvchini bloklash"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            UserId: <span className="text-white font-mono">{appliedUserId}</span>
          </p>
          <input
            type="text"
            placeholder="Sabab (ixtiyoriy)..."
            value={blockReason}
            onChange={e => setBlockReason(e.target.value)}
            className="px-3 py-2 text-sm bg-bg border border-border rounded-lg text-white placeholder-text-dim focus:outline-none"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={() => { setBlockModal(null); setBlockReason(''); }}>Bekor qilish</Button>
            <Button variant="danger" loading={blockLoading} onClick={() => void handleBlock()}>
              Bloklash
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unblock Modal */}
      <Modal
        open={blockModal === 'unblock'}
        onClose={() => setBlockModal(null)}
        title="Blokdan chiqarish"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            UserId: <span className="text-white font-mono">{appliedUserId}</span> blokdan chiqarilsinmi?
          </p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setBlockModal(null)}>Bekor qilish</Button>
            <Button loading={blockLoading} onClick={() => void handleUnblock()}>
              Chiqarish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
