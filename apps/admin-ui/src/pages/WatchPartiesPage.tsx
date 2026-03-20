import { useEffect, useState, useCallback } from 'react';
import { watchPartiesApi } from '../api/watchparties.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
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

function platformBadge(platform: string | null | undefined) {
  if (!platform) return <span className="text-text-muted text-xs">—</span>;
  const colors: Record<string, string> = {
    youtube: 'text-red-400',
    direct:  'text-blue-400',
    webview: 'text-purple-400',
  };
  return <span className={`text-xs font-medium ${colors[platform] ?? 'text-text-muted'}`}>{platform}</span>;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
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

  // Admin control panel
  const [adminPanel, setAdminPanel] = useState<{ room: AdminWatchParty } | null>(null);
  const [seekTime, setSeekTime] = useState('');
  const [controlLoading, setControlLoading] = useState(false);

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

  const handleAdminJoin = async (room: AdminWatchParty) => {
    setActionLoading(room._id);
    try {
      const result = await watchPartiesApi.join(room._id);
      setAdminPanel({ room: result.room });
      setSeekTime('');
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleControl = async (action: 'play' | 'pause' | 'seek') => {
    if (!adminPanel) return;
    setControlLoading(true);
    try {
      const time = action === 'seek' ? parseFloat(seekTime) || 0 : undefined;
      await watchPartiesApi.control(adminPanel.room._id, action, time);
    } catch {
      // silent
    } finally {
      setControlLoading(false);
    }
  };

  const handleKick = async (userId: string) => {
    if (!adminPanel) return;
    setControlLoading(true);
    try {
      await watchPartiesApi.kickMember(adminPanel.room._id, userId);
      setAdminPanel((prev) =>
        prev ? { room: { ...prev.room, members: prev.room.members.filter((m) => m !== userId) } } : null,
      );
    } catch {
      // silent
    } finally {
      setControlLoading(false);
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
                <th className="text-left px-4 py-3 text-text-muted font-medium">Room</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Nimani ko'ryapti</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">A'zolar</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Sana</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Yuklanmoqda...</td></tr>
              ) : rooms.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Watch party topilmadi</td></tr>
              ) : rooms.map((room) => (
                <tr key={room._id} className="border-b border-border/50 hover:bg-overlay/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-xs">{room.name ?? room.inviteCode}</p>
                    <p className="text-text-muted text-xs font-mono">{room.ownerId.slice(-8)}</p>
                  </td>
                  <td className="px-4 py-3">{statusBadge(room.status)}</td>
                  <td className="px-4 py-3">
                    <div>
                      {room.videoTitle ? (
                        <p className="text-white text-xs max-w-[200px] truncate">{room.videoTitle}</p>
                      ) : room.videoUrl ? (
                        <p className="text-text-muted text-xs max-w-[200px] truncate">{room.videoUrl}</p>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        {platformBadge(room.videoPlatform)}
                        {room.currentTime > 0 && (
                          <span className="text-text-muted text-xs">{formatTime(room.currentTime)}</span>
                        )}
                        {room.isPlaying && <span className="text-green-400 text-xs">▶</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">
                    {room.members.length}/{room.maxMembers}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {new Date(room.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {room.status !== 'ended' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={actionLoading === room._id}
                          onClick={() => void handleAdminJoin(room)}
                        >
                          Kuzatish
                        </Button>
                      )}
                      {isSuperAdmin && room.status !== 'ended' && (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={actionLoading === room._id}
                          onClick={() => setConfirmModal({ room })}
                        >
                          Yopish
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      </div>

      {/* Admin control panel modal */}
      <Modal
        open={!!adminPanel}
        onClose={() => setAdminPanel(null)}
        title="Admin — Watch Party nazorati"
      >
        {adminPanel && (
          <div className="flex flex-col gap-5">
            {/* Room info */}
            <div className="bg-overlay rounded-lg p-3 text-sm">
              <p className="text-white font-medium">{adminPanel.room.name ?? adminPanel.room.inviteCode}</p>
              {adminPanel.room.videoTitle && (
                <p className="text-text-muted text-xs mt-1">{adminPanel.room.videoTitle}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs">
                {platformBadge(adminPanel.room.videoPlatform)}
                <span className="text-text-muted">Vaqt: {formatTime(adminPanel.room.currentTime)}</span>
                <span className={adminPanel.room.isPlaying ? 'text-green-400' : 'text-text-muted'}>
                  {adminPanel.room.isPlaying ? '▶ Ijro etilmoqda' : '⏸ To\'xtatilgan'}
                </span>
              </div>
            </div>

            {/* Video controls */}
            <div>
              <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Video boshqaruvi</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  loading={controlLoading}
                  onClick={() => void handleControl('play')}
                >
                  ▶ Play
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={controlLoading}
                  onClick={() => void handleControl('pause')}
                >
                  ⏸ Pause
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Sekund (masalan 120)"
                    value={seekTime}
                    onChange={(e) => setSeekTime(e.target.value)}
                    className="w-40"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={controlLoading}
                    disabled={!seekTime}
                    onClick={() => void handleControl('seek')}
                  >
                    ⏩ Seek
                  </Button>
                </div>
              </div>
            </div>

            {/* Members */}
            <div>
              <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">
                A'zolar ({adminPanel.room.members.length}/{adminPanel.room.maxMembers})
              </p>
              {adminPanel.room.members.length === 0 ? (
                <p className="text-xs text-text-muted">A'zo yo'q</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {adminPanel.room.members.map((userId) => (
                    <div key={userId} className="flex items-center justify-between bg-overlay rounded px-3 py-1.5">
                      <span className="font-mono text-xs text-text-muted">{userId.slice(-12)}</span>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={controlLoading}
                        onClick={() => void handleKick(userId)}
                      >
                        Chiqarish
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setAdminPanel(null)}>Yopish</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Force close confirm modal */}
      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)} title="Watch Party yopish">
        {confirmModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              <span className="text-white font-mono">{confirmModal.room.inviteCode}</span> xonasini majburiy yopmoqchimisiz?
              Barcha a'zolar chiqariladi.
            </p>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setConfirmModal(null)}>Bekor</Button>
              <Button variant="danger" loading={!!actionLoading} onClick={() => void handleForceClose()}>
                Yopish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
