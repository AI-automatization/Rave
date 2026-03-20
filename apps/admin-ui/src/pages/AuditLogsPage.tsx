import { useEffect, useState, useCallback } from 'react';
import { auditApi } from '../api/audit.api';
import { Badge } from '../components/ui/Badge';
import { Select, Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import type { AuditLog, PaginationMeta } from '../types';

const ACTION_LABELS: Record<string, { label: string; variant: 'red' | 'yellow' | 'blue' | 'gray' | 'green' }> = {
  block_user:             { label: 'Bloklandi',       variant: 'red' },
  unblock_user:           { label: 'Razblok',         variant: 'green' },
  change_role:            { label: 'Role o\'zgartirildi', variant: 'blue' },
  delete_user:            { label: 'O\'chirildi',     variant: 'red' },
  close_watchparty:       { label: 'WP yopildi',      variant: 'yellow' },
  control_watchparty:     { label: 'WP boshqarildi',  variant: 'gray' },
  kick_member:            { label: 'Chiqarildi',      variant: 'yellow' },
  end_battle:             { label: 'Battle tugatildi', variant: 'yellow' },
  broadcast_notification: { label: 'Broadcast',       variant: 'blue' },
};

function formatDetails(details: Record<string, unknown>): string {
  const parts: string[] = [];
  if (details.reason) parts.push(`sabab: "${String(details.reason)}"`);
  if (details.newRole) parts.push(`rol: ${String(details.newRole)}`);
  if (details.action) parts.push(`harakat: ${String(details.action)}`);
  if (details.userId) parts.push(`userId: ${String(details.userId).slice(-8)}`);
  return parts.join(', ') || '—';
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return 'hozirgina';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} daqiqa oldin`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} soat oldin`;
  return `${Math.floor(diff / 86_400_000)} kun oldin`;
}

export function AuditLogsPage() {
  const [logs, setLogs]     = useState<AuditLog[]>([]);
  const [meta, setMeta]     = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof auditApi.list>[0] = { page, limit: 20 };
      if (actionFilter) params.action = actionFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await auditApi.list(params);
      setLogs(res.data);
      setMeta(res.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">Audit Loglari</h1>
        <p className="text-text-muted text-sm mt-0.5">Admin harakatlari tarixi — {meta.total.toLocaleString()} ta</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha harakatlar</option>
          <option value="block_user">Bloklandi</option>
          <option value="unblock_user">Razblok</option>
          <option value="change_role">Role o'zgartirildi</option>
          <option value="delete_user">O'chirildi</option>
          <option value="close_watchparty">WP yopildi</option>
          <option value="control_watchparty">WP boshqarildi</option>
          <option value="kick_member">A'zo chiqarildi</option>
          <option value="end_battle">Battle tugatildi</option>
          <option value="broadcast_notification">Broadcast</option>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="w-40"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="w-40"
        />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Vaqt</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Admin</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Harakat</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Nishon</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Tafsilotlar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Yuklanmoqda...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Log topilmadi</td></tr>
              ) : logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] ?? { label: log.action, variant: 'gray' as const };
                return (
                  <tr key={log._id} className="border-b border-border/50 hover:bg-overlay/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-xs">{formatRelative(log.createdAt)}</p>
                      <p className="text-text-muted text-xs">{new Date(log.createdAt).toLocaleString('ru-RU')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs">{log.adminEmail}</p>
                      <p className="text-text-muted font-mono text-xs">{log.adminId.slice(-8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {log.targetId ? (
                        <div>
                          <p className="text-text-muted font-mono text-xs">{log.targetId.slice(-10)}</p>
                          {log.targetType && (
                            <p className="text-text-muted text-xs">{log.targetType}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">{formatDetails(log.details)}</td>
                  </tr>
                );
              })}
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
