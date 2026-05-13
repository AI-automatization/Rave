import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Trophy, Clock, Users } from 'lucide-react';
import { battlesApi } from '../api/battles.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterTabs } from '../components/ui/FilterTabs';
import type { AdminBattle, PaginationMeta } from '../types';

const STATUS_TABS = [
  { value: '',          label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'pending',   label: 'Pending' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_MAP: Record<AdminBattle['status'], { variant: 'green' | 'yellow' | 'blue' | 'gray' | 'red'; label: string }> = {
  active:    { variant: 'green',  label: 'Active' },
  pending:   { variant: 'yellow', label: 'Pending' },
  completed: { variant: 'blue',   label: 'Completed' },
  cancelled: { variant: 'gray',   label: 'Cancelled' },
  rejected:  { variant: 'red',    label: 'Rejected' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });
}

function SkeletonRow() {
  return (
    <tr>
      {[35, 14, 10, 12, 12, 14, 8].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 shimmer-bg rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function BattlesPage() {
  const navigate = useNavigate();

  const [battles, setBattles]   = useState<AdminBattle[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);

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

  const totalParticipants = (b: AdminBattle) => b.participants?.length ?? 0;
  const acceptedCount     = (b: AdminBattle) => b.participants?.filter((p) => p.hasAccepted).length ?? 0;
  const topScore          = (b: AdminBattle) => b.participants ? Math.max(0, ...b.participants.map((p) => p.score)) : 0;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader title="Battles" meta={`${meta.total.toLocaleString('en')} total`} />

      <FilterTabs
        options={STATUS_TABS}
        value={statusFilter}
        onChange={(v) => { setStatusFilter(v); setPage(1); }}
      />

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Title', 'Status', 'Duration', 'Participants', 'Top score', 'End date', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em] last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : battles.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                        <Swords size={20} className="text-text-dim" />
                      </div>
                      <p className="text-text-muted text-sm font-medium">No battles found</p>
                    </div>
                  </td>
                </tr>
              )
              : battles.map((battle) => {
                const sm = STATUS_MAP[battle.status];
                return (
                  <tr key={battle._id} className="tr-hover group cursor-pointer" onClick={() => setDetailModal(battle)}>
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-medium text-white">{battle.title}</p>
                      <p className="text-[10px] text-text-dim font-mono mt-0.5">{battle.creatorId.slice(-10)}</p>
                    </td>

                    <td className="px-5 py-4">
                      <Badge variant={sm.variant} dot>{sm.label}</Badge>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-[12px] text-text-muted tabular-nums">{battle.duration}d</span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-text-dim" />
                        <span className="text-[12px] text-white tabular-nums">{acceptedCount(battle)}</span>
                        <span className="text-[12px] text-text-dim">/{totalParticipants(battle)}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {topScore(battle) > 0 ? (
                        <div className="flex items-center gap-1">
                          <Trophy size={11} className="text-amber-400 shrink-0" />
                          <span className="text-[12px] text-amber-400 font-semibold tabular-nums">{topScore(battle)}</span>
                        </div>
                      ) : <span className="text-text-dim text-[12px]">—</span>}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-text-dim" />
                        <span className="text-[12px] text-text-muted whitespace-nowrap">{formatDate(battle.endDate)}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {battle.status === 'active' && (
                          <Button size="xs" variant="danger" loading={actionLoading === battle._id}
                            onClick={() => setActionModal({ battle, action: 'end' })}>
                            End
                          </Button>
                        )}
                        {battle.status === 'pending' && (
                          <Button size="xs" variant="secondary" loading={actionLoading === battle._id}
                            onClick={() => setActionModal({ battle, action: 'cancel' })}>
                            Cancel
                          </Button>
                        )}
                      </div>
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

      {/* Detail modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.title ?? 'Battle'} size="md">
        {detailModal && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Status',   value: <Badge variant={STATUS_MAP[detailModal.status].variant} dot>{STATUS_MAP[detailModal.status].label}</Badge> },
                { label: 'Duration', value: `${detailModal.duration} days` },
                { label: 'Start',    value: formatDate(detailModal.startDate) },
                { label: 'End',      value: formatDate(detailModal.endDate) },
              ].map((item) => (
                <div key={item.label} className="bg-surface rounded-xl px-3 py-2.5 border border-white/[0.04]">
                  <p className="text-[10px] text-text-dim uppercase tracking-[0.08em] mb-1.5">{item.label}</p>
                  {typeof item.value === 'string'
                    ? <p className="text-[13px] text-white font-medium">{item.value}</p>
                    : item.value}
                </div>
              ))}
              <div className="col-span-2 bg-surface rounded-xl px-3 py-2.5 border border-white/[0.04]">
                <p className="text-[10px] text-text-dim uppercase tracking-[0.08em] mb-1.5">Creator ID</p>
                <p className="text-[12px] text-white font-mono">{detailModal.creatorId}</p>
              </div>
              {detailModal.winnerId && (
                <div className="col-span-2 bg-amber-500/[0.06] rounded-xl px-3 py-2.5 border border-amber-500/20">
                  <p className="text-[10px] text-amber-400/60 uppercase tracking-[0.08em] mb-1.5">🏆 Winner</p>
                  <p className="text-[12px] text-amber-400 font-mono">{detailModal.winnerId}</p>
                </div>
              )}
            </div>

            {/* Participants */}
            {!!detailModal.participants?.length && (
              <div>
                <p className="text-[10px] text-text-dim uppercase tracking-[0.08em] mb-2">
                  Participants ({detailModal.participants.length})
                </p>
                <div className="flex flex-col gap-1">
                  {[...detailModal.participants].sort((a, b) => b.score - a.score).map((p, i) => (
                    <div key={p.userId} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                      i === 0 && p.score > 0
                        ? 'bg-amber-500/[0.06] border border-amber-500/20'
                        : 'bg-surface border border-white/[0.04]'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[11px] font-bold w-4 text-center ${i === 0 && p.score > 0 ? 'text-amber-400' : 'text-text-dim'}`}>
                          {i + 1}
                        </span>
                        <div>
                          <button
                            className="text-[12px] font-mono text-text-muted hover:text-white transition-colors"
                            onClick={() => { setDetailModal(null); navigate(`/user-activity?userId=${p.userId}`); }}
                          >
                            {p.userId.slice(-12)}
                          </button>
                          <div className="flex gap-3 text-[10px] text-text-dim mt-0.5">
                            <span>{p.moviesWatched} movies</span>
                            <span>{Math.floor(p.minutesWatched / 60)}h {p.minutesWatched % 60}m</span>
                            {!p.hasAccepted && <span className="text-amber-400/70">not accepted</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[13px] font-bold tabular-nums ${i === 0 && p.score > 0 ? 'text-amber-400' : 'text-white'}`}>
                        {p.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1 border-t border-white/[0.05]">
              <Button variant="ghost" onClick={() => setDetailModal(null)}>Close</Button>
              {detailModal.status === 'pending' && (
                <Button variant="secondary" loading={actionLoading === detailModal._id}
                  onClick={() => { setDetailModal(null); setActionModal({ battle: detailModal, action: 'cancel' }); }}>
                  Cancel battle
                </Button>
              )}
              {detailModal.status === 'active' && (
                <Button variant="danger" loading={actionLoading === detailModal._id}
                  onClick={() => { setDetailModal(null); setActionModal({ battle: detailModal, action: 'end' }); }}>
                  End battle
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm modal */}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)}
        title={actionModal?.action === 'end' ? 'End battle' : 'Cancel battle'}>
        {actionModal && (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-text-muted">
              {actionModal.action === 'end'
                ? 'Force-end this battle? Winner will be determined by current scores.'
                : 'Cancel this battle?'}{' '}
              <span className="text-white font-medium">"{actionModal.battle.title}"</span>
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button
                variant={actionModal.action === 'end' ? 'danger' : 'secondary'}
                loading={!!actionLoading}
                onClick={() => void handleAction()}
              >
                {actionModal.action === 'end' ? 'End battle' : 'Cancel battle'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
