import { useEffect, useState, useCallback } from 'react';
import {
  Flag, Search, ChevronDown, Users, ExternalLink, Shield,
  AlertTriangle, Copy, CheckCheck, Play, Pause, Film,
  User, Clock, Globe, Lock,
} from 'lucide-react';
import { moderationApi, RoomReport, RoomDetails, ReportStatus } from '../api/moderation.api';
import { BLOCK_REASON_FROM_REPORT } from '../components/ui/BlockReasonPicker';
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
  pending:  'yellow',
  reviewed: 'blue',
  dismissed:'gray',
  actioned: 'green',
};
const STATUS_LABEL: Record<ReportStatus, string> = {
  pending:  'Ожидает',
  reviewed: 'Рассмотрено',
  dismissed:'Отклонено',
  actioned: 'Меры приняты',
};
const PLATFORM_LABEL: Record<string, string> = {
  youtube: 'YouTube', direct: 'Direct', vimeo: 'Vimeo', twitch: 'Twitch',
};

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export function RoomReportsPage() {
  const [reports, setReports]   = useState<RoomReport[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');

  const [modal, setModal]       = useState<{ report: RoomReport } | null>(null);
  const [roomDetails, setRoomDetails]       = useState<RoomDetails | null>(null);
  const [roomDetailsLoading, setRoomDetailsLoading] = useState(false);
  const [roomDetailsError, setRoomDetailsError]     = useState<string | null>(null);
  const [note, setNote]         = useState('');
  const [warnMsg, setWarnMsg]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [warnLoading, setWarnLoading]     = useState(false);
  const [blockLoading, setBlockLoading]   = useState(false);
  const [warnResult, setWarnResult]       = useState<{ ok: boolean; msg: string } | null>(null);
  const [blockResult, setBlockResult]     = useState<{ ok: boolean; msg: string } | null>(null);
  const [copiedId, setCopiedId]           = useState<string | null>(null);

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

  const openModal = useCallback(async (report: RoomReport) => {
    setModal({ report });
    setNote('');
    setWarnMsg('');
    setWarnResult(null);
    setBlockResult(null);
    setRoomDetails(null);
    setRoomDetailsError(null);
    setRoomDetailsLoading(true);
    try {
      const details = await moderationApi.getRoomDetails(report.roomId, report.reporterId);
      setRoomDetails(details);
    } catch (err) {
      setRoomDetailsError((err as Error).message ?? 'Не удалось загрузить данные');
    }
    finally { setRoomDetailsLoading(false); }
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setRoomDetails(null);
    setRoomDetailsError(null);
  }, []);

  const handleAction = async (status: ReportStatus) => {
    if (!modal) return;
    setActionLoading(true);
    try {
      await moderationApi.reviewReport(modal.report._id, status, note || undefined);
      closeModal();
      void load();
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const handleWarn = async () => {
    if (!modal || !warnMsg.trim()) return;
    setWarnLoading(true);
    try {
      const res = await moderationApi.warnRoomUsers(modal.report._id, warnMsg.trim());
      setWarnResult({ ok: true, msg: `Предупреждение отправлено ${res.warned} пользователям` });
      setWarnMsg('');
    } catch {
      setWarnResult({ ok: false, msg: 'Ошибка отправки — попробуйте снова' });
    }
    finally { setWarnLoading(false); }
  };

  const handleBlockOwner = async () => {
    if (!modal) return;
    const ownerLabel = roomDetails?.ownerUsername ? `@${roomDetails.ownerUsername}` : shortId(modal.report.roomId);
    const blockReason = BLOCK_REASON_FROM_REPORT[modal.report.reason] ?? 'Нарушение правил платформы';
    if (!confirm(`Заблокировать владельца комнаты ${ownerLabel}?\n\nПричина: "${blockReason}"`)) return;
    setBlockLoading(true);
    try {
      const res = await moderationApi.blockRoomOwner(modal.report._id, blockReason);
      const name = roomDetails?.ownerUsername ? `@${roomDetails.ownerUsername}` : shortId(res.blockedUserId);
      setBlockResult({ ok: true, msg: `${name} заблокирован` });
    } catch {
      setBlockResult({ ok: false, msg: 'Ошибка блокировки' });
    }
    finally { setBlockLoading(false); }
  };

  const copyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = search
    ? reports.filter(r =>
        r.roomId.toLowerCase().includes(search.toLowerCase()) ||
        r.reporterId.toLowerCase().includes(search.toLowerCase()),
      )
    : reports;

  // ── Subcomponents ──────────────────────────────────────────────────────────

  const UserChip = ({ id, username }: { id: string; username?: string | null }) => (
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
        <User size={10} className="text-text-dim" />
      </div>
      {username ? (
        <span className="text-xs font-medium text-white">@{username}</span>
      ) : (
        <button
          className="flex items-center gap-1 font-mono text-xs text-text-muted hover:text-white transition-colors"
          onClick={() => copyId(id)}
          title={id}
        >
          <span>{shortId(id)}</span>
          {copiedId === id ? <CheckCheck size={10} className="text-green-400" /> : <Copy size={10} className="opacity-50" />}
        </button>
      )}
      {username && (
        <button onClick={() => copyId(id)} title={id} className="opacity-40 hover:opacity-80 transition-opacity">
          {copiedId === id ? <CheckCheck size={10} className="text-green-400" /> : <Copy size={10} className="text-text-dim" />}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
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
            placeholder="ID комнаты или пользователя..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-surface border border-white/[0.08] rounded-lg text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent/50 w-72"
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
                <th className="px-4 py-3 text-left text-xs text-text-dim font-medium">ID комнаты</th>
                <th className="px-4 py-3 text-left text-xs text-text-dim font-medium">Жалобщик</th>
                <th className="px-4 py-3 text-left text-xs text-text-dim font-medium">Причина</th>
                <th className="px-4 py-3 text-left text-xs text-text-dim font-medium">Статус</th>
                <th className="px-4 py-3 text-left text-xs text-text-dim font-medium">Дата</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{shortId(r.roomId)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{shortId(r.reporterId)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="orange">{REASON_LABEL[r.reason] ?? r.reason}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-dim whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('ru')}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => void openModal(r)}>
                      {r.status === 'pending' ? 'Рассмотреть' : 'Открыть'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />

      {/* ── Review modal ───────────────────────────────────────── */}
      {modal && (
        <Modal open={!!modal} title="Рассмотрение жалобы" onClose={closeModal} size="xl">
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">

            {/* ── Row 1: Жалоба + Комната side by side ── */}
            <div className="grid grid-cols-2 gap-3">

              {/* Жалоба */}
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.07] p-4 space-y-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Жалоба</p>

                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">От кого</p>
                    <UserChip id={modal.report.reporterId} username={roomDetails?.reporterUsername} />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">ID комнаты</p>
                    <button
                      onClick={() => copyId(modal.report.roomId)}
                      className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-white transition-colors"
                      title={modal.report.roomId}
                    >
                      <span>{shortId(modal.report.roomId)}</span>
                      {copiedId === modal.report.roomId
                        ? <CheckCheck size={11} className="text-green-400" />
                        : <Copy size={11} className="opacity-50" />}
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">Причина</p>
                    <Badge variant="orange">{REASON_LABEL[modal.report.reason] ?? modal.report.reason}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">Дата</p>
                    <p className="text-xs text-text-muted">{new Date(modal.report.createdAt).toLocaleString('ru')}</p>
                  </div>
                  {modal.report.comment && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <p className="text-[10px] text-text-dim mb-1">Комментарий</p>
                      <p className="text-xs text-white italic leading-relaxed">"{modal.report.comment}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Комната */}
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.07] p-4 space-y-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Комната</p>

                {roomDetailsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-3 h-3 rounded-full bg-accent/40 animate-pulse" />
                    <span className="text-xs text-text-dim">Загрузка...</span>
                  </div>
                ) : roomDetailsError ? (
                  <div className="py-3">
                    <p className="text-xs text-red-400">{roomDetailsError}</p>
                    <p className="text-xs text-text-dim mt-1">Комната, возможно, уже закрыта</p>
                  </div>
                ) : roomDetails ? (
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[10px] text-text-dim mb-1">Владелец</p>
                      <UserChip id={roomDetails.ownerId} username={roomDetails.ownerUsername} />
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[10px] text-text-dim mb-1">Участников</p>
                        <div className="flex items-center gap-1">
                          <Users size={11} className="text-text-dim" />
                          <span className="text-xs text-white">{roomDetails.members.length}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-dim mb-1">Тип</p>
                        <div className="flex items-center gap-1">
                          {roomDetails.isPublic
                            ? <Globe size={11} className="text-blue-400" />
                            : <Lock size={11} className="text-text-dim" />}
                          <span className="text-xs text-white">{roomDetails.isPublic ? 'Публичная' : 'Приватная'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-dim mb-1">Статус</p>
                        <Badge variant={roomDetails.status === 'playing' ? 'green' : roomDetails.status === 'waiting' ? 'yellow' : 'gray'}>
                          {roomDetails.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-dim mb-1">Название</p>
                      <p className="text-xs text-white font-medium leading-snug line-clamp-2">
                        {roomDetails.name || <span className="text-text-dim italic">Без названия</span>}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* ── Видео ── */}
            {roomDetails && (roomDetails.videoUrl || roomDetails.videoTitle) && (
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.07] p-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Видео</p>
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {roomDetails.videoThumbnail ? (
                      <img
                        src={roomDetails.videoThumbnail}
                        alt="thumbnail"
                        className="w-28 h-16 object-cover rounded-lg border border-white/[0.08]"
                      />
                    ) : (
                      <div className="w-28 h-16 bg-white/[0.05] rounded-lg border border-white/[0.06] flex items-center justify-center">
                        <Film size={20} className="text-text-dim opacity-50" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm text-white font-medium leading-snug line-clamp-2">
                      {roomDetails.videoTitle ?? 'Без названия'}
                    </p>
                    <div className="flex items-center flex-wrap gap-2">
                      {roomDetails.videoPlatform && (
                        <Badge variant="blue">{PLATFORM_LABEL[roomDetails.videoPlatform] ?? roomDetails.videoPlatform}</Badge>
                      )}
                      {roomDetails.currentTime > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                          {roomDetails.isPlaying
                            ? <Play size={10} className="text-yellow-400 fill-current" />
                            : <Pause size={10} className="text-yellow-400" />}
                          <Clock size={10} className="text-yellow-400" />
                          <span className="text-xs text-yellow-400 font-mono font-semibold" title="Момент воспроизведения при отправке жалобы">
                            {fmtTime(roomDetails.currentTime)}
                          </span>
                        </div>
                      )}
                    </div>
                    {roomDetails.videoUrl && (
                      <div className="flex items-start gap-1.5">
                        <ExternalLink size={11} className="text-text-dim mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-400 font-mono break-all leading-relaxed line-clamp-2">
                          {roomDetails.videoUrl}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Предупреждение ── */}
            <div className="bg-yellow-500/[0.04] border border-yellow-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-yellow-400" />
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Предупреждение участникам</p>
                {roomDetails && (
                  <span className="ml-auto text-xs text-text-dim">{roomDetails.members.length} чел.</span>
                )}
              </div>
              <textarea
                value={warnMsg}
                onChange={e => setWarnMsg(e.target.value)}
                rows={2}
                placeholder="Текст уведомления для всех участников комнаты..."
                className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-text-dim focus:outline-none focus:border-yellow-500/40 resize-none"
              />
              {warnResult && (
                <div className={`flex items-center gap-1.5 text-xs ${warnResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {warnResult.ok ? <CheckCheck size={12} /> : <AlertTriangle size={12} />}
                  {warnResult.msg}
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="w-full border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-40"
                onClick={() => void handleWarn()}
                disabled={warnLoading || !warnMsg.trim() || !roomDetails}
              >
                {warnLoading
                  ? 'Отправка...'
                  : `Отправить всем (${roomDetails?.members.length ?? '…'})`}
              </Button>
            </div>

            {/* ── Заблокировать ── */}
            <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-red-400" />
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Блокировка владельца</p>
              </div>
              <div className="space-y-1.5">
                {roomDetails?.ownerUsername && (
                  <p className="text-xs text-text-dim">
                    Аккаунт <span className="text-white font-medium">@{roomDetails.ownerUsername}</span> потеряет доступ к платформе.
                  </p>
                )}
                {modal && (
                  <div className="flex items-start gap-1.5 px-2.5 py-1.5 bg-red-500/[0.08] border border-red-500/15 rounded-lg">
                    <span className="text-[10px] text-red-400/70 mt-0.5 flex-shrink-0">Причина:</span>
                    <span className="text-[11px] text-red-300 leading-snug">
                      {BLOCK_REASON_FROM_REPORT[modal.report.reason] ?? 'Нарушение правил платформы'}
                    </span>
                  </div>
                )}
              </div>
              {blockResult && (
                <div className={`flex items-center gap-1.5 text-xs ${blockResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {blockResult.ok ? <CheckCheck size={12} /> : <AlertTriangle size={12} />}
                  {blockResult.msg}
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="w-full border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                onClick={() => void handleBlockOwner()}
                disabled={blockLoading || !roomDetails || blockResult?.ok === true}
              >
                {blockLoading
                  ? 'Блокировка...'
                  : roomDetails?.ownerUsername
                    ? `Заблокировать @${roomDetails.ownerUsername}`
                    : 'Заблокировать владельца'}
              </Button>
            </div>

            {/* ── Примечание + решение ── */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-dim block mb-1.5">Примечание для команды (необязательно)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent/50 resize-none"
                  placeholder="Заметка о принятом решении..."
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="ghost" onClick={() => void handleAction('dismissed')} disabled={actionLoading}>
                  Отклонить
                </Button>
                <Button variant="ghost" onClick={() => void handleAction('reviewed')} disabled={actionLoading}>
                  Рассмотрено
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-500/80 hover:bg-red-500"
                  onClick={() => void handleAction('actioned')}
                  disabled={actionLoading}
                >
                  Меры приняты
                </Button>
              </div>
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
}
