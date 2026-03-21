import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { battlesApi } from '../api/battles.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { AdminBattle, PaginationMeta } from '../types';

type BadgeVariant = 'green' | 'yellow' | 'blue' | 'gray' | 'red';

function statusBadge(status: AdminBattle['status']) {
  const map: Record<AdminBattle['status'], BadgeVariant> = {
    active:    'green',
    pending:   'yellow',
    completed: 'blue',
    cancelled: 'gray',
    rejected:  'red',
  };
  const labels: Record<AdminBattle['status'], string> = {
    active:    'Active',
    pending:   'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected:  'Rejected',
  };
  return <Badge variant={map[status]}>{labels[status]}</Badge>;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function durationLabel(d: number): string {
  return `${d} kun`;
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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
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
    } finally {
      setActionLoading(null);
    }
  };

  const totalParticipants = (b: AdminBattle) => b.participants?.length ?? 0;
  const acceptedParticipants = (b: AdminBattle) =>
    b.participants?.filter((p) => p.hasAccepted).length ?? 0;
  const topScore = (b: AdminBattle) =>
    b.participants ? Math.max(0, ...b.participants.map((p) => p.score)) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">Battles</h1>
        <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString()} jami</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha statuslar</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Sarlavha</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Davomiylik</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Ishtirokchilar</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Top ball</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Tugash sanasi</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">Yuklanmoqda...</td>
                </tr>
              ) : battles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">Battle topilmadi</td>
                </tr>
              ) : battles.map((battle) => (
                <tr
                  key={battle._id}
                  className="border-b border-border/50 hover:bg-overlay/50 transition-colors cursor-pointer"
                  onClick={() => setDetailModal(battle)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-white font-medium">{battle.title}</span>
                      <div className="text-text-dim text-xs font-mono mt-0.5">
                        {battle.creatorId.slice(-10)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(battle.status)}</td>
                  <td className="px-4 py-3 text-text-muted">{durationLabel(battle.duration)}</td>
                  <td className="px-4 py-3">
                    <span className="text-white">{acceptedParticipants(battle)}</span>
                    <span className="text-text-dim">/{totalParticipants(battle)}</span>
                  </td>
                  <td className="px-4 py-3 text-amber-400 font-mono">
                    {topScore(battle) > 0 ? topScore(battle) : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(battle.endDate)}</td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {battle.status === 'active' && (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={actionLoading === battle._id}
                          onClick={() => setActionModal({ battle, action: 'end' })}
                        >
                          Force End
                        </Button>
                      )}
                      {battle.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={actionLoading === battle._id}
                          onClick={() => setActionModal({ battle, action: 'cancel' })}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setDetailModal(battle)}
                      >
                        Ko'rish
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Detail Modal */}
      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={detailModal?.title ?? 'Battle'}
      >
        {detailModal && (
          <div className="flex flex-col gap-4">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-text-dim text-xs">Status</span>
                <div className="mt-1">{statusBadge(detailModal.status)}</div>
              </div>
              <div>
                <span className="text-text-dim text-xs">Davomiylik</span>
                <div className="text-white mt-1">{durationLabel(detailModal.duration)}</div>
              </div>
              <div>
                <span className="text-text-dim text-xs">Boshlanish</span>
                <div className="text-white mt-1">{formatDate(detailModal.startDate)}</div>
              </div>
              <div>
                <span className="text-text-dim text-xs">Tugash</span>
                <div className="text-white mt-1">{formatDate(detailModal.endDate)}</div>
              </div>
              <div className="col-span-2">
                <span className="text-text-dim text-xs">Creator ID</span>
                <div className="text-white font-mono text-xs mt-1">{detailModal.creatorId}</div>
              </div>
              {detailModal.winnerId && (
                <div className="col-span-2">
                  <span className="text-text-dim text-xs">G'olib</span>
                  <div className="text-amber-400 font-mono text-xs mt-1">{detailModal.winnerId}</div>
                </div>
              )}
            </div>

            {/* Participants */}
            <div>
              <h3 className="text-text-muted text-xs font-medium mb-2">
                ISHTIROKCHILAR ({detailModal.participants?.length ?? 0})
              </h3>
              {!detailModal.participants || detailModal.participants.length === 0 ? (
                <p className="text-text-dim text-xs">Ishtirokchi yo'q</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {[...detailModal.participants]
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => (
                      <div
                        key={p.userId}
                        className="flex items-center justify-between bg-bg rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-bold w-4 ${i === 0 ? 'text-amber-400' : 'text-text-dim'}`}>
                            {i + 1}
                          </span>
                          <div>
                            <button
                              className="font-mono text-text-muted hover:text-white transition-colors"
                              onClick={() => {
                                setDetailModal(null);
                                navigate(`/user-activity?userId=${p.userId}`);
                              }}
                            >
                              {p.userId.slice(-12)}
                            </button>
                            <div className="flex gap-3 text-text-dim mt-0.5">
                              <span>{p.moviesWatched} film</span>
                              <span>{Math.floor(p.minutesWatched / 60)}h {p.minutesWatched % 60}m</span>
                              {!p.hasAccepted && (
                                <span className="text-amber-400">qabul qilmagan</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`font-bold ${i === 0 ? 'text-amber-400' : 'text-white'}`}>
                          {p.score} ball
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button onClick={() => setDetailModal(null)}>Yopish</Button>
              {detailModal.status === 'pending' && (
                <Button
                  variant="secondary"
                  loading={actionLoading === detailModal._id}
                  onClick={() => {
                    setDetailModal(null);
                    setActionModal({ battle: detailModal, action: 'cancel' });
                  }}
                >
                  Cancel
                </Button>
              )}
              {detailModal.status === 'active' && (
                <Button
                  variant="danger"
                  loading={actionLoading === detailModal._id}
                  onClick={() => {
                    setDetailModal(null);
                    setActionModal({ battle: detailModal, action: 'end' });
                  }}
                >
                  Force End
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Action Modal */}
      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.action === 'end' ? 'Battle ni yakunlash' : 'Battle ni bekor qilish'}
      >
        {actionModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              {actionModal.action === 'end'
                ? 'Bu battle ni majburiy yakunlaysizmi? Hozirgi natija bo\'yicha g\'olib aniqlanadi.'
                : 'Bu pending battle ni bekor qilasizmi?'}
              {' '}
              <span className="text-white font-medium">"{actionModal.battle.title}"</span>
            </p>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setActionModal(null)}>Bekor qilish</Button>
              <Button
                variant={actionModal.action === 'end' ? 'danger' : 'secondary'}
                loading={!!actionLoading}
                onClick={() => void handleAction()}
              >
                {actionModal.action === 'end' ? 'Yakunlash' : 'Bekor qilish'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
