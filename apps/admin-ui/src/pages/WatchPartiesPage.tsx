import { useEffect, useState, useCallback } from 'react';
import { Tv2, Play, Pause, SkipForward, UserMinus, XCircle, Search } from 'lucide-react';
import { watchPartiesApi } from '../api/watchparties.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { AdminWatchParty, PaginationMeta } from '../types';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusBadge(status: AdminWatchParty['status']) {
  const map: Record<AdminWatchParty['status'], { variant: 'green' | 'yellow' | 'gray'; label: string }> = {
    playing: { variant: 'green',  label: 'Идёт' },
    waiting: { variant: 'yellow', label: 'Ожидает' },
    paused:  { variant: 'yellow', label: 'Пауза' },
    ended:   { variant: 'gray',   label: 'Завершён' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

const PLATFORM_COLOR: Record<string, string> = {
  youtube: 'text-red-400',
  direct:  'text-blue-400',
  webview: 'text-violet-400',
};

export function WatchPartiesPage() {
  const currentUser  = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [rooms, setRooms]       = useState<AdminWatchParty[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);

  const [confirmModal, setConfirmModal] = useState<{ room: AdminWatchParty } | null>(null);
  const [closeReason, setCloseReason]   = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [adminPanel, setAdminPanel] = useState<{ room: AdminWatchParty } | null>(null);
  const [seekTime, setSeekTime]     = useState('');
  const [controlLoading, setControlLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await watchPartiesApi.list(params);
      setRooms(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleForceClose = async () => {
    if (!confirmModal) return;
    setActionLoading(confirmModal.room._id);
    try {
      await watchPartiesApi.closeRoom(confirmModal.room._id, closeReason.trim() || undefined);
      setConfirmModal(null);
      setCloseReason('');
      await load();
    } finally { setActionLoading(null); }
  };

  const handleAdminJoin = async (room: AdminWatchParty) => {
    setActionLoading(room._id);
    try {
      const result = await watchPartiesApi.join(room._id);
      setAdminPanel({ room: result.room });
      setSeekTime('');
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const handleControl = async (action: 'play' | 'pause' | 'seek') => {
    if (!adminPanel) return;
    setControlLoading(true);
    try {
      const time = action === 'seek' ? parseFloat(seekTime) || 0 : undefined;
      await watchPartiesApi.control(adminPanel.room._id, action, time);
    } catch { /* silent */ }
    finally { setControlLoading(false); }
  };

  const handleKick = async (userId: string) => {
    if (!adminPanel) return;
    setControlLoading(true);
    try {
      await watchPartiesApi.kickMember(adminPanel.room._id, userId);
      setAdminPanel((prev) =>
        prev ? { room: { ...prev.room, members: prev.room.members.filter((m) => m !== userId) } } : null,
      );
    } catch { /* silent */ }
    finally { setControlLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Watch Parties</h1>
          <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString('ru')} всего комнат</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dim bg-card rounded-xl px-3 py-2 border border-white/[0.06]">
          <Tv2 size={13} />
          <span>Совместные просмотры</span>
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
          <option value="waiting">Ожидает</option>
          <option value="playing">Идёт</option>
          <option value="paused">Пауза</option>
          <option value="ended">Завершён</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Комната', 'Статус', 'Контент', 'Участники', 'Создана', ''].map((h) => (
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
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${50 + (i * j * 9) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-text-muted">Watch Party не найден</td>
              </tr>
            ) : rooms.map((room) => (
              <tr key={room._id} className="tr-hover">
                <td className="px-5 py-4">
                  <p className="font-medium text-white">{room.name ?? room.inviteCode}</p>
                  <p className="text-xs text-text-dim font-mono mt-0.5">{room.ownerId.slice(-8)}</p>
                </td>
                <td className="px-5 py-4">{statusBadge(room.status)}</td>
                <td className="px-5 py-4 max-w-[200px]">
                  {room.videoTitle ? (
                    <p className="text-white text-xs truncate">{room.videoTitle}</p>
                  ) : room.videoUrl ? (
                    <p className="text-text-muted text-xs truncate">{room.videoUrl}</p>
                  ) : (
                    <span className="text-text-dim text-xs">—</span>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {room.videoPlatform && (
                      <span className={`text-[11px] font-medium ${PLATFORM_COLOR[room.videoPlatform] ?? 'text-text-muted'}`}>
                        {room.videoPlatform}
                      </span>
                    )}
                    {room.currentTime > 0 && (
                      <span className="text-text-dim text-[11px]">{formatTime(room.currentTime)}</span>
                    )}
                    {room.isPlaying && <span className="text-emerald-400 text-[10px]">▶</span>}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-white font-medium">{room.members.length}</span>
                  <span className="text-text-dim">/{room.maxMembers}</span>
                </td>
                <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">
                  {new Date(room.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    {room.status !== 'ended' && (
                      <button
                        onClick={() => void handleAdminJoin(room)}
                        disabled={actionLoading === room._id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Войти как наблюдатель"
                      >
                        <Search size={15} />
                      </button>
                    )}
                    {isSuperAdmin && room.status !== 'ended' && (
                      <button
                        onClick={() => setConfirmModal({ room })}
                        disabled={actionLoading === room._id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Принудительно завершить"
                      >
                        <XCircle size={15} />
                      </button>
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

      {/* Admin control panel modal */}
      <Modal open={!!adminPanel} onClose={() => setAdminPanel(null)} title="Управление комнатой" size="md">
        {adminPanel && (
          <div className="flex flex-col gap-4">
            <div className="bg-bg/60 rounded-xl p-3.5 border border-white/[0.06]">
              <p className="text-white text-sm font-medium">{adminPanel.room.name ?? adminPanel.room.inviteCode}</p>
              {adminPanel.room.videoTitle && (
                <p className="text-text-muted text-xs mt-0.5 truncate">{adminPanel.room.videoTitle}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs">
                {adminPanel.room.videoPlatform && (
                  <span className={PLATFORM_COLOR[adminPanel.room.videoPlatform] ?? 'text-text-muted'}>
                    {adminPanel.room.videoPlatform}
                  </span>
                )}
                <span className="text-text-muted">Позиция: {formatTime(adminPanel.room.currentTime)}</span>
                <span className={adminPanel.room.isPlaying ? 'text-emerald-400' : 'text-text-muted'}>
                  {adminPanel.room.isPlaying ? '▶ Воспроизводится' : '⏸ Пауза'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div>
              <p className="text-[10px] text-text-dim uppercase tracking-wider mb-2 font-semibold">Управление видео</p>
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm" variant="primary" loading={controlLoading} onClick={() => void handleControl('play')}>
                  <Play size={13} /> Play
                </Button>
                <Button size="sm" variant="secondary" loading={controlLoading} onClick={() => void handleControl('pause')}>
                  <Pause size={13} /> Pause
                </Button>
                <div className="flex items-center gap-1.5">
                  <input
                    placeholder="Секунды"
                    value={seekTime}
                    onChange={(e) => setSeekTime(e.target.value)}
                    className="w-28 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                  />
                  <Button size="sm" variant="ghost" loading={controlLoading} disabled={!seekTime} onClick={() => void handleControl('seek')}>
                    <SkipForward size={13} /> Seek
                  </Button>
                </div>
              </div>
            </div>

            {/* Members */}
            <div>
              <p className="text-[10px] text-text-dim uppercase tracking-wider mb-2 font-semibold">
                Участники ({adminPanel.room.members.length}/{adminPanel.room.maxMembers})
              </p>
              {adminPanel.room.members.length === 0 ? (
                <p className="text-xs text-text-muted">Участников нет</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {adminPanel.room.members.map((userId) => (
                    <div key={userId} className="flex items-center justify-between bg-bg/60 rounded-lg px-3 py-2 border border-white/[0.04]">
                      <span className="font-mono text-xs text-text-muted">{userId.slice(-12)}</span>
                      <button
                        onClick={() => void handleKick(userId)}
                        disabled={controlLoading}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Выгнать"
                      >
                        <UserMinus size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Force close modal */}
      <Modal open={!!confirmModal} onClose={() => { setConfirmModal(null); setCloseReason(''); }} title="Закрыть комнату">
        {confirmModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Принудительно завершить комнату{' '}
              <span className="text-white font-medium font-mono">{confirmModal.room.inviteCode}</span>?
              Все участники будут выгнаны.
            </p>
            <textarea
              placeholder="Причина (опционально, будет видна участникам)..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              rows={2}
              className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none transition-all"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setConfirmModal(null); setCloseReason(''); }}>Отмена</Button>
              <Button variant="danger" loading={!!actionLoading} onClick={() => void handleForceClose()}>Закрыть</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
