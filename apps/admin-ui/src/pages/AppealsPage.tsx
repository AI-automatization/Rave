import { useEffect, useState, useCallback } from 'react';
import { Scale, ChevronDown } from 'lucide-react';
import { moderationApi, Appeal, AppealStatus } from '../api/moderation.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { PaginationMeta } from '../types';

const STATUS_VARIANT: Record<AppealStatus, 'yellow' | 'green' | 'red'> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};
const STATUS_LABEL: Record<AppealStatus, string> = {
  pending: 'Ожидает',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

export function AppealsPage() {
  const [appeals, setAppeals]   = useState<Appeal[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage]         = useState(1);

  const [modal, setModal] = useState<{ appeal: Appeal } | null>(null);
  const [note, setNote]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await moderationApi.listAppeals({ page, limit: 20, status: statusFilter || undefined });
      setAppeals(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!modal) return;
    setActionLoading(true);
    try {
      await moderationApi.reviewAppeal(modal.appeal._id, status, note || undefined);
      setModal(null);
      setNote('');
      void load();
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Scale size={16} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-none">Апелляции</h1>
            <p className="text-text-dim text-xs mt-0.5">{meta.total} всего</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2 bg-surface border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-accent/50"
          >
            <option value="">Все</option>
            <option value="pending">Ожидают</option>
            <option value="approved">Одобрены</option>
            <option value="rejected">Отклонены</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-text-dim text-sm">Загрузка...</div>
        ) : appeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Scale size={32} className="text-text-dim opacity-40" />
            <p className="text-text-dim text-sm">Апелляций нет</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Пользователь', 'Причина бана', 'Сообщение', 'Статус', 'Дата', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-text-dim font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appeals.map(a => (
                <tr key={a._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[120px] truncate">{a.userId}</td>
                  <td className="px-4 py-3 text-xs text-text-dim max-w-[120px] truncate">{a.banReason ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-white max-w-[200px] truncate">{a.message}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-dim">
                    {new Date(a.createdAt).toLocaleDateString('ru')}
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'pending' && (
                      <Button size="sm" variant="ghost" onClick={() => { setModal({ appeal: a }); setNote(''); }}>
                        Рассмотреть
                      </Button>
                    )}
                    {a.status !== 'pending' && a.reviewNote && (
                      <span className="text-xs text-text-dim truncate max-w-[120px] block">{a.reviewNote}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />

      {/* Review modal */}
      {modal && (
        <Modal open={!!modal} title="Рассмотрение апелляции" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-white/[0.04] rounded-lg p-3 space-y-2">
              <p className="text-xs text-text-dim">Пользователь: <span className="text-white font-mono">{modal.appeal.userId}</span></p>
              {modal.appeal.banReason && (
                <p className="text-xs text-text-dim">Причина бана: <span className="text-white">{modal.appeal.banReason}</span></p>
              )}
              <p className="text-xs text-text-dim">Сообщение пользователя:</p>
              <p className="text-sm text-white bg-white/[0.03] rounded p-2">{modal.appeal.message}</p>
            </div>
            <div>
              <label className="text-xs text-text-dim block mb-1.5">Примечание (необязательно)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent/50 resize-none"
                placeholder="Причина решения..."
              />
            </div>
            <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2">
              Одобрение автоматически разблокирует пользователя.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleAction('rejected')}
                disabled={actionLoading}
              >
                Отклонить
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleAction('approved')}
                disabled={actionLoading}
              >
                Одобрить и разблокировать
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
