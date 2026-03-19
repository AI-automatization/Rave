import { useEffect, useState, useCallback } from 'react';
import { battlesApi } from '../api/battles.api';
import { useAuthStore } from '../store/auth.store';
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
  return <Badge variant={map[status]}>{status}</Badge>;
}

export function BattlesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [battles, setBattles]   = useState<AdminBattle[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);

  const [confirmModal, setConfirmModal] = useState<{ battle: AdminBattle } | null>(null);
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

  const handleForceEnd = async () => {
    if (!confirmModal) return;
    setActionLoading(confirmModal.battle._id);
    try {
      await battlesApi.endBattle(confirmModal.battle._id);
      setConfirmModal(null);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">Battles</h1>
        <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString()} total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">ID</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Creator ID</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Duration</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">End Date</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Participants</th>
                {isSuperAdmin && (
                  <th className="text-right px-4 py-3 text-text-muted font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isSuperAdmin ? 7 : 6} className="px-4 py-8 text-center text-text-muted">Loading...</td></tr>
              ) : battles.length === 0 ? (
                <tr><td colSpan={isSuperAdmin ? 7 : 6} className="px-4 py-8 text-center text-text-muted">No battles found</td></tr>
              ) : battles.map((battle) => (
                <tr key={battle._id} className="border-b border-border/50 hover:bg-overlay/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-text-muted text-xs">
                    {battle._id.slice(-8)}
                  </td>
                  <td className="px-4 py-3 font-mono text-text-muted text-xs">
                    {battle.creatorId.slice(-8)}
                  </td>
                  <td className="px-4 py-3">{statusBadge(battle.status)}</td>
                  <td className="px-4 py-3 text-white">{battle.duration} days</td>
                  <td className="px-4 py-3 text-text-muted">
                    {battle.endDate ? new Date(battle.endDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-white">
                    {battle.participants?.length ?? 0}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {battle.status === 'active' && (
                          <Button
                            size="sm"
                            variant="danger"
                            loading={actionLoading === battle._id}
                            onClick={() => setConfirmModal({ battle })}
                          >
                            Force End
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      </div>

      {/* Confirm modal */}
      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)} title="Force End Battle">
        {confirmModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Are you sure you want to force end battle{' '}
              <span className="text-white font-mono">{confirmModal.battle._id.slice(-8)}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button variant="danger" loading={!!actionLoading} onClick={() => void handleForceEnd()}>
                Force End
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
