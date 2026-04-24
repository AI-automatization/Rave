import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Trophy, Clock, Users } from 'lucide-react';
import { battlesApi } from '../api/battles.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { AdminBattle, PaginationMeta } from '../types';

function statusBadge(status: AdminBattle['status']) {
  const map: Record<AdminBattle['status'], { variant: 'green' | 'yellow' | 'blue' | 'gray' | 'red'; label: string }> = {
    active:    { variant: 'green',  label: 'Активный' },
    pending:   { variant: 'yellow', label: 'Ожидает' },
    completed: { variant: 'blue',   label: 'Завершён' },
    cancelled: { variant: 'gray',   label: 'Отменён' },
    rejected:  { variant: 'red',    label: 'Отклонён' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function BattlesPage() {
  const navigate = useNavigate();

  const [battles, setBattles] = useState<AdminBattle[]>([]);
  const [meta, setMeta]       = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]       = useState(1);

  const [detailModal, setDetailModal] = useState<AdminBattle | null>(null);
  const [actionModal, setActionModal] = useState<{ battle: AdminBattle; action: 'end' | 'cancel' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await battlesApi.list(params);
      setBattles(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async () => {
    if (!actionModal) return;
    const { battle, action } = actionModal;
    setActionLoading(battle._id);
    try {
      if (action === 'end') await battlesApi.endBattle(battle._id);
      else await battlesApi.cancelBattle(battle._id);
      setActionModal(null);
      await load();
    } finally { setActionLoading(null); }
  };

  const totalParticipants  = (b: AdminBattle) => b.participants?.length ?? 0;
  const acceptedCount      = (b: AdminBattle) => b.participants?.filter((p) => p.hasAccepted).length ?? 0;
  const topScore           = (b: AdminBattle) => b.participants ? Math.max(0, ...b.participants.map((p) => p.score)) : 0;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Battles</h1>
          <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString('ru')} всего</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dim bg-card rounded-xl px-3 py-2 border border-white/[0.06]">
          <Swords size={13} />
          <span>Соревнования</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2.5">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="active">Активный</option>
          <option value="completed">Завершён</option>
          <option value="cancelled">Отменён</option>
          <option value="rejected">Отклонён</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Название', 'Статус', 'Длит.', 'Участники', 'Лучший балл', 'Конец', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${50 + (i * j * 13) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : battles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-text-muted">Battle не найден</td>
              </tr>
            ) : battles.map((battle) => (
              <tr key={battle._id} className="tr-hover cursor-pointer" onClick={() => setDetailModal(battle)}>
                <td className="px-5 py-4">
                  <p className="font-medium text-white">{battle.title}</p>
                  <p className="text-xs text-text-dim font-mono mt-0.5">{battle.creatorId.slice(-10)}</p>
                </td>
                <td className="px-5 py-4">{statusBadge(battle.status)}</td>
                <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">{battle.duration} дн.</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <Users size={12} className="text-text-dim" />
                    <span className="text-white">{acceptedCount(battle)}</span>
                    <span className="text-text-dim">/{totalParticipants(battle)}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {topScore(battle) > 0 ? (
                    <div className="flex items-center gap-1">
                      <Trophy size={12} className="text-amber-400" />
                      <span className="text-amber-400 font-mono text-xs font-semibold">{topScore(battle)}</span>
                    </div>
                  ) : <span className="text-text-dim">—</span>}
                </td>
                <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-text-dim" />
                    {formatDate(battle.endDate)}
                  </div>
                </td>
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    {battle.status === 'active' && (
                      <Button size="sm" variant="danger" loading={actionLoading === battle._id}
                        onClick={() => setActionModal({ battle, action: 'end' })}>
                        Завершить
                      </Button>
                    )}
                    {battle.status === 'pending' && (
                      <Button size="sm" variant="secondary" loading={actionLoading === battle._id}
                        onClick={() => setActionModal({ battle, action: 'cancel' })}>
                        Отменить
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {meta.totalPages > 1 && (
          <div className="px-5 border-t border-white/[0.04]">
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.title ?? 'Battle'} size="md">
        {detailModal && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Статус',    value: statusBadge(detailModal.status), raw: true },
                { label: 'Длит.',     value: `${detailModal.duration} дней` },
                { label: 'Начало',    value: formatDate(detailModal.startDate) },
                { label: 'Конец',     value: formatDate(detailModal.endDate) },
              ].map((item) => (
                <div key={item.label} className="bg-bg/60 rounded-lg px-3 py-2 border border-white/[0.04]">
                  <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">{item.label}</p>
                  {'raw' in item ? item.value : <p className="text-white font-medium">{item.value}</p>}
                </div>
              ))}
              <div className="col-span-2 bg-bg/60 rounded-lg px-3 py-2 border border-white/[0.04]">
                <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Creator</p>
                <p className="text-white font-mono text-xs">{detailModal.creatorId}</p>
              </div>
              {detailModal.winnerId && (
                <div className="col-span-2 bg-amber-500/[0.07] rounded-lg px-3 py-2 border border-amber-500/20">
                  <p className="text-[10px] text-amber-400/70 uppercase tracking-wider mb-1">🏆 Победитель</p>
                  <p className="text-amber-400 font-mono text-xs">{detailModal.winnerId}</p>
                </div>
              )}
            </div>

            {/* Participants */}
            <div>
              <p className="text-[10px] text-text-dim uppercase tracking-wider mb-2 font-semibold">
                Участники ({detailModal.participants?.length ?? 0})
              </p>
              {!detailModal.participants?.length ? (
                <p className="text-text-dim text-xs">Нет участников</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {[...detailModal.participants].sort((a, b) => b.score - a.score).map((p, i) => (
                    <div key={p.userId} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${i === 0 && p.score > 0 ? 'bg-amber-500/[0.07] border border-amber-500/20' : 'bg-bg/60 border border-white/[0.04]'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold w-4 text-center ${i === 0 && p.score > 0 ? 'text-amber-400' : 'text-text-dim'}`}>
                          {i + 1}
                        </span>
                        <div>
                          <button
                            className="font-mono text-text-muted hover:text-white transition-colors"
                            onClick={() => { setDetailModal(null); navigate(`/user-activity?userId=${p.userId}`); }}
                          >
                            {p.userId.slice(-12)}
                          </button>
                          <div className="flex gap-3 text-text-dim mt-0.5">
                            <span>{p.moviesWatched} фильмов</span>
                            <span>{Math.floor(p.minutesWatched / 60)}ч {p.minutesWatched % 60}м</span>
                            {!p.hasAccepted && <span className="text-amber-400/70">не принял</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`font-bold tabular-nums ${i === 0 && p.score > 0 ? 'text-amber-400' : 'text-white'}`}>
                        {p.score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-1 border-t border-white/[0.05]">
              <Button variant="ghost" onClick={() => setDetailModal(null)}>Закрыть</Button>
              {detailModal.status === 'pending' && (
                <Button variant="secondary" loading={actionLoading === detailModal._id}
                  onClick={() => { setDetailModal(null); setActionModal({ battle: detailModal, action: 'cancel' }); }}>
                  Отменить
                </Button>
              )}
              {detailModal.status === 'active' && (
                <Button variant="danger" loading={actionLoading === detailModal._id}
                  onClick={() => { setDetailModal(null); setActionModal({ battle: detailModal, action: 'end' }); }}>
                  Завершить
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm action modal */}
      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.action === 'end' ? 'Завершить battle' : 'Отменить battle'}
      >
        {actionModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              {actionModal.action === 'end'
                ? 'Принудительно завершить? Победитель определится по текущим баллам.'
                : 'Отменить этот battle?'}
              {' '}<span className="text-white font-medium">«{actionModal.battle.title}»</span>
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setActionModal(null)}>Отмена</Button>
              <Button
                variant={actionModal.action === 'end' ? 'danger' : 'secondary'}
                loading={!!actionLoading}
                onClick={() => void handleAction()}
              >
                {actionModal.action === 'end' ? 'Завершить' : 'Отменить'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
