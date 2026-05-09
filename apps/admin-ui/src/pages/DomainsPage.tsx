import { useEffect, useState, useCallback } from 'react';
import { Search, ShieldOff, ShieldCheck, Globe, AlertTriangle } from 'lucide-react';
import { domainsApi, type DomainEntry, type DomainsMeta } from '../api/domains.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';

type Filter = 'all' | 'flagged' | 'blocked';

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',     label: 'Все' },
  { value: 'flagged', label: 'Авто-флаг' },
  { value: 'blocked', label: 'Заблокированные' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)   return `${m}м назад`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}ч назад`;
  return `${Math.floor(h / 24)}д назад`;
}

export function DomainsPage() {
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [meta, setMeta]       = useState<DomainsMeta>({ total: 0, page: 1, limit: 50, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Filter>('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await domainsApi.list({ page, limit: 50, filter, search: search || undefined });
      setDomains(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, filter, search]);

  useEffect(() => { void load(); }, [load]);

  const handleBlock = async (domain: string) => {
    setActionLoading(domain);
    try { await domainsApi.block(domain); await load(); }
    finally { setActionLoading(null); }
  };

  const handleUnblock = async (domain: string) => {
    setActionLoading(domain);
    try { await domainsApi.unblock(domain); await load(); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Домены</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {meta.total.toLocaleString('ru')} доменов — посещения пользователей через WebView
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по домену..."
            className="w-full bg-surface border border-border hover:border-border-md rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex bg-surface border border-border rounded-xl overflow-hidden">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setPage(1); }}
              className={`px-4 py-2.5 text-sm transition-colors ${
                filter === tab.value
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-text-muted hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Домен', 'Страна', 'Визиты', 'Последнее посещение', 'Флаги', 'Статус', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${50 + (i * j * 9) % 45}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : domains.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-text-muted">
                  <Globe size={32} className="mx-auto mb-3 opacity-30" />
                  Домены не найдены
                </td>
              </tr>
            ) : domains.map((d) => (
              <tr
                key={d.domain}
                className={`tr-hover ${d.blocked ? 'bg-red-500/[0.03]' : ''}`}
              >
                {/* Domain */}
                <td className="px-5 py-4">
                  <span className="font-mono text-sm text-white">{d.domain}</span>
                </td>

                {/* Country */}
                <td className="px-5 py-4 text-text-muted text-xs uppercase">
                  {d.country === 'XX' ? '—' : d.country}
                </td>

                {/* Count */}
                <td className="px-5 py-4">
                  <span className="font-semibold text-white">{d.count.toLocaleString('ru')}</span>
                </td>

                {/* Last seen */}
                <td className="px-5 py-4 text-text-muted text-xs">
                  {timeAgo(d.lastSeen)}
                </td>

                {/* Flags */}
                <td className="px-5 py-4">
                  {d.flagged && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={10} />
                      Авто
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  {d.blocked
                    ? <Badge variant="red" dot>Заблокирован</Badge>
                    : <Badge variant="green" dot>Разрешён</Badge>}
                </td>

                {/* Action */}
                <td className="px-5 py-4">
                  {d.blocked ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={actionLoading === d.domain}
                      onClick={() => void handleUnblock(d.domain)}
                    >
                      <ShieldCheck size={13} className="mr-1.5 text-emerald-400" />
                      Разрешить
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={actionLoading === d.domain}
                      onClick={() => void handleBlock(d.domain)}
                    >
                      <ShieldOff size={13} className="mr-1.5" />
                      Блок
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {meta.pages > 1 && (
          <div className="px-5 border-t border-white/[0.04]">
            <Pagination page={page} totalPages={meta.pages} total={meta.total} limit={meta.limit} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
