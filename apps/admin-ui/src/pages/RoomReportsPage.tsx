import { useEffect, useState, useCallback } from 'react';
import { Flag, Search, ChevronDown } from 'lucide-react';
import { moderationApi, RoomReport, ReportStatus } from '../api/moderation.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { PaginationMeta } from '../types';

const REASON_LABEL: Record<string, string> = {
  prohibited_content: 'Запрещённый контент',
  spam: 'Спам',
  violence: 'Насилие',
  harassment: 'Оскорбления',
  copyright: 'Авт. права',
  other: 'Другое',
};

const STATUS_VARIANT: Record<ReportStatus, 'gray' | 'yellow' | 'green' | 'blue' | 'red'> = {
  pending: 'yellow',
  reviewed: 'blue',
  dismissed: 'gray',
  actioned: 'green',
};
const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Ожидает',
  reviewed: 'Рассмотрено',
  dismissed: 'Отклонено',
  actioned: 'Меры приняты',
};

export function RoomReportsPage() {
  const [reports, setReports]   = useState<RoomReport[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');

  const [modal, setModal] = useState<{ report: RoomReport } | null>(null);
  const [note, setNote]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await moderationApi.listReports({ page, limit: 20, status: statusFilter || undefined });
      setReports(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (status: ReportStatus) => {
    if (!modal) return;
    setActionLoading(true);
    try {
      await moderationApi.reviewReport(modal.report._id, status, note || undefined);
      setModal(null);
      setNote('');
      void load();
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const filtered = search
    ? reports.filter(r => r.roomId.includes(search) || r.reporterId.includes(search))
    : reports;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Flag size={16} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-none">Жалобы на комнаты</h1>
            <p className="text-text-dim text-xs mt-0.5">{meta.total} всего</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder="Поиск по ID комнаты..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-surface border border-white/[0.08] rounded-lg text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent/50 w-64"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2 bg-surface border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-accent/50"
          >
            <option value="">Все статусы</option>
            <option value="pending">Ожидают</option>
            <option value="reviewed">Рассмотрены</option>
            <option value="dismissed">Отклонены</option>
            <option value="actioned">Меры приняты</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-text-dim text-sm">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Flag size={32} className="text-text-dim opacity-40" />
            <p className="text-text-dim text-sm">Жалоб нет</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Комната', 'От', 'Причина', 'Статус', 'Дата', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-text-dim font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[120px] truncate">{r.roomId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[120px] truncate">{r.reporterId}</td>
                  <td className="px-4 py-3">
                    <Badge variant="orange">{REASON_LABEL[r.reason] ?? r.reason}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-dim">
                    {new Date(r.createdAt).toLocaleDateString('ru')}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <Button size="sm" variant="ghost" onClick={() => { setModal({ report: r }); setNote(''); }}>
                        Рассмотреть
                      </Button>
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
        <Modal open={!!modal} title="Рассмотрение жалобы" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-white/[0.04] rounded-lg p-3 space-y-2">
              <p className="text-xs text-text-dim">Комната: <span className="text-white font-mono">{modal.report.roomId}</span></p>
              <p className="text-xs text-text-dim">Причина: <span className="text-white">{REASON_LABEL[modal.report.reason] ?? modal.report.reason}</span></p>
              {modal.report.comment && (
                <p className="text-xs text-text-dim">Комментарий: <span className="text-white">{modal.report.comment}</span></p>
              )}
            </div>
            <div>
              <label className="text-xs text-text-dim block mb-1.5">Примечание (необязательно)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                className="w-full bg-[#0a0a12] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent/50 resize-none"
                placeholder="Заметка для команды..."
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => handleAction('dismissed')} disabled={actionLoading}>
                Отклонить
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => handleAction('reviewed')} disabled={actionLoading}>
                Рассмотрено
              </Button>
              <Button variant="primary" className="flex-1 bg-red-500/80 hover:bg-red-500" onClick={() => handleAction('actioned')} disabled={actionLoading}>
                Меры приняты
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
