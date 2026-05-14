import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, ShieldOff, ShieldCheck, Globe, AlertTriangle, Plus, X } from 'lucide-react';
import { domainsApi, type DomainEntry, type DomainsMeta } from '../api/domains.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterTabs } from '../components/ui/FilterTabs';

type Filter = 'all' | 'flagged' | 'blocked';

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'flagged', label: 'Auto-flagged' },
  { value: 'blocked', label: 'Blocked' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

function SkeletonRow() {
  return (
    <tr>
      {[30, 8, 12, 14, 10, 10, 8].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 shimmer-bg rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function DomainsPage() {
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [meta, setMeta]       = useState<DomainsMeta>({ total: 0, page: 1, limit: 50, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Filter>('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addInput, setAddInput]       = useState('');
  const [addLoading, setAddLoading]   = useState(false);
  const [addError, setAddError]       = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

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

  const openAddForm = () => {
    setAddInput(''); setAddError(''); setShowAddForm(true);
    setTimeout(() => addInputRef.current?.focus(), 50);
  };

  const handleAdd = async () => {
    const val = addInput.trim();
    if (!val) { setAddError('Enter a domain'); return; }
    setAddLoading(true); setAddError('');
    try {
      await domainsApi.add(val);
      setShowAddForm(false);
      setAddInput('');
      await load();
    } catch {
      setAddError('Failed to add domain');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader title="Domains" meta={`${meta.total.toLocaleString('en')} domains`} />

      {/* Add domain form */}
      {showAddForm && (
        <div className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input
              ref={addInputRef}
              value={addInput}
              onChange={(e) => { setAddInput(e.target.value); setAddError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); if (e.key === 'Escape') setShowAddForm(false); }}
              placeholder="example.com"
              className="input-base pl-9 w-full"
            />
          </div>
          {addError && <span className="text-red-400 text-xs shrink-0">{addError}</span>}
          <Button variant="danger" size="sm" loading={addLoading} onClick={() => void handleAdd()}>
            Block
          </Button>
          <button onClick={() => setShowAddForm(false)} className="text-text-dim hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search domain..."
            className="input-base pl-9"
          />
        </div>
        <FilterTabs
          options={FILTER_TABS}
          value={filter}
          onChange={(v) => { setFilter(v as Filter); setPage(1); }}
        />
        <Button variant="primary" size="sm" onClick={openAddForm}>
          <Plus size={13} className="mr-1.5" />
          Add Domain
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Domain', 'Country', 'Visits', 'Last seen', 'Flags', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em] last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : domains.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                        <Globe size={20} className="text-text-dim" />
                      </div>
                      <p className="text-text-muted text-sm font-medium">No domains found</p>
                      <p className="text-text-dim text-xs">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )
              : domains.map((d) => (
                <tr key={d.domain} className={`tr-hover group ${d.blocked ? 'bg-red-500/[0.02]' : ''}`}>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[13px] text-white">{d.domain}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] text-text-muted uppercase tabular-nums">
                      {d.country === 'XX' ? '—' : d.country}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-semibold text-white tabular-nums">{d.count.toLocaleString('en')}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] text-text-muted">{timeAgo(d.lastSeen)}</span>
                  </td>
                  <td className="px-5 py-4">
                    {d.flagged && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} />
                        Auto
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {d.blocked
                      ? <Badge variant="red" dot>Blocked</Badge>
                      : <Badge variant="green" dot>Allowed</Badge>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {d.blocked ? (
                      <Button variant="ghost" size="sm" loading={actionLoading === d.domain}
                        onClick={() => void handleUnblock(d.domain)}>
                        <ShieldCheck size={13} className="mr-1.5 text-emerald-400" />
                        Allow
                      </Button>
                    ) : (
                      <Button variant="danger" size="sm" loading={actionLoading === d.domain}
                        onClick={() => void handleBlock(d.domain)}>
                        <ShieldOff size={13} className="mr-1.5" />
                        Block
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
