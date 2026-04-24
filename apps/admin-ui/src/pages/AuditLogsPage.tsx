import { useEffect, useState, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { auditApi } from '../api/audit.api';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import type { AuditLog, PaginationMeta } from '../types';

const ACTION_CONFIG: Record<string, { label: string; variant: 'red' | 'yellow' | 'blue' | 'gray' | 'green' }> = {
  block_user:             { label: 'Блок',        variant: 'red' },
  unblock_user:           { label: 'Разблок',     variant: 'green' },
  change_role:            { label: 'Роль',        variant: 'blue' },
  delete_user:            { label: 'Удалён',      variant: 'red' },
  close_watchparty:       { label: 'WP закрыт',   variant: 'yellow' },
  control_watchparty:     { label: 'WP контроль', variant: 'gray' },
  kick_member:            { label: 'Выгнан',      variant: 'yellow' },
  end_battle:             { label: 'Battle',      variant: 'yellow' },
  broadcast_notification: { label: 'Broadcast',   variant: 'blue' },
};

function formatDetails(details: Record<string, unknown>): string {
  const parts: string[] = [];
  if (details.reason)  parts.push(`причина: "${String(details.reason)}"`);
  if (details.newRole) parts.push(`роль: ${String(details.newRole)}`);
  if (details.action)  parts.push(`действие: ${String(details.action)}`);
  if (details.userId)  parts.push(`user: …${String(details.userId).slice(-8)}`);
  return parts.join(' · ') || '—';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return 'только что';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}м назад`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}ч назад`;
  return `${Math.floor(diff / 86_400_000)}д назад`;
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Аудит логи</h1>
          <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString('ru')} действий</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dim bg-card rounded-xl px-3 py-2 border border-white/[0.06]">
          <Shield size={13} />
          <span>История действий</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все действия</option>
          <option value="block_user">Блокировка</option>
          <option value="unblock_user">Разблокировка</option>
          <option value="change_role">Смена роли</option>
          <option value="delete_user">Удаление</option>
          <option value="close_watchparty">WP закрыт</option>
          <option value="control_watchparty">WP контроль</option>
          <option value="kick_member">Выгнан участник</option>
          <option value="end_battle">Battle завершён</option>
          <option value="broadcast_notification">Broadcast</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Время', 'Админ', 'Действие', 'Цель', 'Детали'].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${50 + (i * j * 9) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-text-muted">Логи не найдены</td>
              </tr>
            ) : logs.map((log) => {
              const cfg = ACTION_CONFIG[log.action] ?? { label: log.action, variant: 'gray' as const };
              return (
                <tr key={log._id} className="tr-hover">
                  <td className="px-5 py-4">
                    <p className="text-white text-xs font-medium">{relativeTime(log.createdAt)}</p>
                    <p className="text-text-dim text-[11px] mt-0.5">
                      {new Date(log.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white text-xs">{log.adminEmail}</p>
                    <p className="text-text-dim font-mono text-[11px] mt-0.5">…{log.adminId.slice(-8)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    {log.targetId ? (
                      <div>
                        <p className="text-text-muted font-mono text-xs">…{log.targetId.slice(-10)}</p>
                        {log.targetType && <p className="text-text-dim text-[11px] mt-0.5">{log.targetType}</p>}
                      </div>
                    ) : (
                      <span className="text-text-dim text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-text-muted text-xs max-w-xs truncate">
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
