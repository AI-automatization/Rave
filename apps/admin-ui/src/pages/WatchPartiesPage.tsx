import { useEffect, useState, useCallback } from 'react';
import { watchPartiesApi } from '../api/watchparties.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { AdminWatchParty, PaginationMeta } from '../types';

type BadgeVariant = 'green' | 'yellow' | 'gray';

function statusBadge(status: AdminWatchParty['status']) {
  const map: Record<AdminWatchParty['status'], BadgeVariant> = {
    playing: 'green',
    waiting: 'yellow',
    paused:  'yellow',
    ended:   'gray',
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

export function WatchPartiesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [rooms, setRooms]       = useState<AdminWatchParty[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);

  const [confirmModal, setConfirmModal] = useState<{ room: AdminWatchParty } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await watchPartiesApi.list(params);
      setRooms(res.data);
      setMeta(res.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleForceClose = async () => {
    if (!confirmModal) return;
    setActionLoading(confirmModal.room._id);
    try {
      await watchPartiesApi.closeRoom(confirmModal.room._id);
      setConfirmModal(null);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">Watch Parties</h1>
        <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString()} total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="waiting">Waiting</option>
          <option value="playing">Playing</option>
          <option value="paused">Paused</option>
          <option value="ended">Ended</option>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Room Code</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Owner ID</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Movie ID</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Members</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Created At</th>
                {isSuperAdmin && (
                  <th className="text-right px-4 py-3 text-text-muted font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isSuperAdmin ? 7 : 6} className="px-4 py-8 text-center text-text-muted">Loading...</td></tr>
              ) : rooms.length === 0 ? (
                <tr><td colSpan={isSuperAdmin ? 7 : 6} className="px-4 py-8 text-center text-text-muted">No watch parties found</td></tr>
              ) : rooms.map((room) => (
                <tr key={room._id} className="border-b border-border/50 hover:bg-overlay/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-white text-xs font-medium">{room.code}</td>
                  <td className="px-4 py-3 font-mono text-text-muted text-xs">
                    {room.ownerId.slice(-8)}
                  </td>
                  <td className="px-4 py-3">{statusBadge(room.status)}</td>
                  <td className="px-4 py-3 font-mono text-text-muted text-xs">
                    {room.movieId ? room.movieId.slice(-8) : '—'}
                  </td>
                  <td className="px-4 py-3 text-white">
                    {room.members.length}/{room.maxMembers}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(room.createdAt).toLocaleDateString()}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {room.status !== 'ended' && (
                          <Button
                            size="sm"
                            variant="danger"
                            loading={actionLoading === room._id}
                            onClick={() => setConfirmModal({ room })}
                          >
                            Force Close
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
      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)} title="Force Close Room">
        {confirmModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Are you sure you want to force close room{' '}
              <span className="text-white font-mono">{confirmModal.room.code}</span>?
              This will end the watch party for all members.
            </p>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button variant="danger" loading={!!actionLoading} onClick={() => void handleForceClose()}>
                Force Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
