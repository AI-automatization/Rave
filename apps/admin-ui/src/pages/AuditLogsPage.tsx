import { useEffect, useState, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { auditApi } from '../api/audit.api';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import type { AuditLog, PaginationMeta } from '../types';

const ACTION_TABS = [
  { value: '',                         label: 'All' },
  { value: 'block_user',               label: 'Block' },
  { value: 'unblock_user',             label: 'Unblock' },
  { value: 'change_role',              label: 'Role' },
  { value: 'delete_user',              label: 'Delete' },
  { value: 'close_watchparty',         label: 'WP close' },
  { value: 'end_battle',               label: 'Battle' },
  { value: 'broadcast_notification',   label: 'Broadcast' },
];

const ACTION_CONFIG: Record<string, { label: string; variant: 'red' | 'yellow' | 'blue' | 'gray' | 'green' }> = {
  block_user:             { label: 'Block',      variant: 'red' },
  unblock_user:           { label: 'Unblock',    variant: 'green' },
  change_role:            { label: 'Role',       variant: 'blue' },
  delete_user:            { label: 'Deleted',    variant: 'red' },
  close_watchparty:       { label: 'WP closed',  variant: 'yellow' },
  control_watchparty:     { label: 'WP control', variant: 'gray' },
  kick_member:            { label: 'Kicked',     variant: 'yellow' },
  end_battle:             { label: 'Battle',     variant: 'yellow' },
  broadcast_notification: { label: 'Broadcast',  variant: 'blue' },
};

function formatDetails(details: Record<string, unknown> | undefined | null): string {
  if (!details) return '—';
  const parts: string[] = [];
  if (details.reason)  parts.push(`reason: "${String(details.reason)}"`);
  if (details.newRole) parts.push(`role: ${String(details.newRole)}`);
  if (details.action)  parts.push(`action: ${String(details.action)}`);
  if (details.userId)  parts.push(`user: …${String(details.userId).slice(-8)}`);
  return parts.join(' · ') || '—';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return 'just now';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function SkeletonRow() {
  return (
    <tr>
      {[14, 18, 10, 16, 24].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 shimmer-bg rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function AuditLogsPage() {
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [meta, setMeta]       = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]         = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof auditApi.list>[0] = { page, limit: 20 };
      if (actionFilter) params.action = actionFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo)   params.dateTo   = dateTo;
      const res = await auditApi.list(params);
      setLogs(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, actionFilter, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Audit Logs"
        meta={`${meta.total.toLocaleString('en')} actions`}
        actions={
          <div className="flex items-center gap-2 text-[12px] text-text-dim bg-card rounded-xl px-3 py-2 border border-white/[0.06]">
            <Shield size={13} />
            <span>Admin history</span>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="inline-flex items-center gap-px bg-surface rounded-xl p-1">
          {ACTION_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActionFilter(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-[9px] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                actionFilter === tab.value
                  ? 'bg-raised text-white shadow-xs'
                  : 'text-[#6b6b8a] hover:text-[#c4c3dc] hover:bg-white/[0.03]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all [color-scheme:dark]"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all [color-scheme:dark]"
        />
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Time', 'Admin', 'Action', 'Target', 'Details'].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : logs.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-text-muted text-[13px]">
                    No logs found
                  </td>
                </tr>
              )
              : logs.map((log) => {
                const cfg = ACTION_CONFIG[log.action] ?? { label: log.action, variant: 'gray' as const };
                return (
                  <tr key={log._id} className="tr-hover">
                    <td className="px-5 py-4">
                      <p className="text-white text-[12px] font-medium">{relativeTime(log.createdAt)}</p>
                      <p className="text-text-dim text-[11px] mt-0.5">
                        {new Date(log.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white text-[12px]">{log.adminEmail}</p>
                      <p className="text-text-dim font-mono text-[11px] mt-0.5">…{log.adminId.slice(-8)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {log.targetId ? (
                        <div>
                          <p className="text-text-muted font-mono text-[12px]">…{log.targetId.slice(-10)}</p>
                          {log.targetType && <p className="text-text-dim text-[11px] mt-0.5">{log.targetType}</p>}
                        </div>
                      ) : (
                        <span className="text-text-dim text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-text-muted text-[12px] max-w-xs truncate">
                      {formatDetails(log.details)}
                    </td>
                  </tr>
                );
              })}
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
