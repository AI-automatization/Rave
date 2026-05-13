import { useEffect, useState, useCallback } from 'react';
import { Flag, Search, ChevronDown, Users, Link, Shield, AlertTriangle, Copy, CheckCheck, Play, Pause, Film } from 'lucide-react';
import { moderationApi, RoomReport, RoomDetails, ReportStatus } from '../api/moderation.api';
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

const PLATFORM_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  direct: 'Direct',
  vimeo: 'Vimeo',
  twitch: 'Twitch',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RoomReportsPage() {
  const [reports, setReports]   = useState<RoomReport[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');

  const [modal, setModal]       = useState<{ report: RoomReport } | null>(null);
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [roomDetailsLoading, setRoomDetailsLoading] = useState(false);
  const [note, setNote]         = useState('');
  const [warnMsg, setWarnMsg]   = useState('');
  const [actionLoading, setActionLoading]  = useState(false);
  const [warnLoading, setWarnLoading]      = useState(false);
  const [blockLoading, setBlockLoading]    = useState(false);
  const [warnResult, setWarnResult]        = useState<string | null>(null);
  const [blockResult, setBlockResult]      = useState<string | null>(null);
  const [copiedId, setCopiedId]            = useState<string | null>(null);

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
    setRoomDetailsLoading(true);
    try {
      const details = await moderationApi.getRoomDetails(report.roomId, report.reporterId);
      setRoomDetails(details);
    } catch { /* room may be closed */ }
    finally { setRoomDetailsLoading(false); }
  }, []);

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

  const handleWarn = async () => {
    if (!modal || !warnMsg.trim()) return;
    setWarnLoading(true);
    try {
      const res = await moderationApi.warnRoomUsers(modal.report._id, warnMsg.trim());
      setWarnResult(`✓ Предупреждение отправлено ${res.warned} пользователям`);
      setWarnMsg('');
    } catch { setWarnResult('Ошибка отправки'); }
    finally { setWarnLoading(false); }
  };

  const handleBlockOwner = async () => {
    if (!modal) return;
    if (!confirm('Заблокировать владельца комнаты?')) return;
    setBlockLoading(true);
    try {
      const res = await moderationApi.blockRoomOwner(modal.report._id, `Room report: ${modal.report.reason}`);
      setBlockResult(`✓ Пользователь ${res.blockedUserId.slice(0, 8)}… заблокирован`);
    } catch { setBlockResult('Ошибка блокировки'); }
    finally { setBlockLoading(false); }
  };

  const copyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
                {['ID комнаты', 'Жалобщик', 'Причина', 'Статус', 'Дата', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-text-dim font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[130px] truncate">{r.roomId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[130px] truncate">{r.reporterId}</td>
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

      {/* Review modal */}
      {modal && (
        <Modal open={!!modal} title="Рассмотрение жалобы" onClose={() => setModal(null)} size="xl">
          <div className="space-y-4">

            {/* ── Жалоба ── */}
            <div className="bg-white/[0.04] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-dim">ID комнаты</span>
                <button
                  className="flex items-center gap-1.5 font-mono text-xs text-white hover:text-accent transition-colors"
                  onClick={() => copyId(modal.report.roomId)}
                >
                  <span className="max-w-[200px] truncate">{modal.report.roomId}</span>
                  {copiedId === modal.report.roomId ? <CheckCheck size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-dim">Жалобщик</span>
                <div className="flex items-center gap-2">
                  {roomDetails?.reporterUsername && (
                    <span className="text-xs text-accent font-medium">@{roomDetails.reporterUsername}</span>
                  )}
                  <button
                    className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-white transition-colors"
                    onClick={() => copyId(modal.report.reporterId)}
                  >
                    <span className="max-w-[120px] truncate">{modal.report.reporterId}</span>
                    {copiedId === modal.report.reporterId ? <CheckCheck size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-dim">Причина</span>
                <Badge variant="orange">{REASON_LABEL[modal.report.reason] ?? modal.report.reason}</Badge>
              </div>
              {modal.report.comment && (
                <div className="pt-1 border-t border-white/[0.06]">
                  <p className="text-xs text-text-dim">Комментарий:</p>
                  <p className="text-xs text-white mt-0.5 italic">"{modal.report.comment}"</p>
                </div>
              )}
            </div>

            {/* ── Детали комнаты ── */}
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={13} className="text-accent" />
                <span className="text-xs font-medium text-text-muted">Информация о комнате</span>
              </div>
              {roomDetailsLoading ? (
                <p className="text-xs text-text-dim">Загрузка...</p>
              ) : roomDetails ? (
                <div className="space-y-1.5">
                  {/* Video preview block */}
                  {(roomDetails.videoTitle || roomDetails.videoThumbnail) && (
                    <div className="flex gap-3 p-2 bg-white/[0.03] rounded-lg border border-white/[0.06] mb-2">
                      {roomDetails.videoThumbnail ? (
                        <img
                          src={roomDetails.videoThumbnail}
                          alt="thumbnail"
                          className="w-20 h-12 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-12 bg-white/[0.06] rounded flex items-center justify-center flex-shrink-0">
                          <Film size={18} className="text-text-dim" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-white font-medium leading-tight line-clamp-2">
                          {roomDetails.videoTitle ?? 'Без названия'}
                        </p>
                        <div className="flex items-center gap-2">
                          {roomDetails.videoPlatform && (
                            <Badge variant="blue">{PLATFORM_LABEL[roomDetails.videoPlatform] ?? roomDetails.videoPlatform}</Badge>
                          )}
                          {roomDetails.currentTime > 0 && (
                            <span className="flex items-center gap-1 text-xs text-yellow-400 font-mono">
                              {roomDetails.isPlaying ? <Play size={10} className="fill-current" /> : <Pause size={10} />}
                              <span title="Момент когда отправлена жалоба">{formatTime(roomDetails.currentTime)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-dim">Название комнаты</span>
                    <span className="text-xs text-white font-medium">{roomDetails.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-dim flex items-center gap-1"><Users size={11} /> Участников</span>
                    <span className="text-xs text-white">{roomDetails.members.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-dim">Тип</span>
                    <Badge variant={roomDetails.isPublic ? 'blue' : 'gray'}>{roomDetails.isPublic ? 'Публичная' : 'Приватная'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-dim">Статус</span>
                    <Badge variant={roomDetails.status === 'active' ? 'green' : 'gray'}>{roomDetails.status}</Badge>
                  </div>
                  <div className="pt-1.5 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-dim">Владелец</span>
                      <div className="flex items-center gap-2">
                        {roomDetails.ownerUsername && (
                          <span className="text-xs text-orange-400 font-medium">@{roomDetails.ownerUsername}</span>
                        )}
                        <button
                          className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-white transition-colors"
                          onClick={() => copyId(roomDetails.ownerId)}
                        >
                          <span className="max-w-[120px] truncate">{roomDetails.ownerId}</span>
                          {copiedId === roomDetails.ownerId ? <CheckCheck size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {roomDetails.videoUrl && (
                    <div className="pt-1.5 border-t border-white/[0.06]">
                      <div className="flex items-center gap-1.5 text-xs text-text-dim mb-1"><Link size={11} /> URL</div>
                      <p className="text-xs text-blue-400 break-all font-mono leading-relaxed">{roomDetails.videoUrl}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-dim">Комната не найдена или уже закрыта</p>
              )}
            </div>

            {/* ── Предупреждение пользователям ── */}
            <div className="bg-yellow-500/[0.05] border border-yellow-500/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} className="text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">Предупреждение участникам</span>
              </div>
              <textarea
                value={warnMsg}
                onChange={e => setWarnMsg(e.target.value)}
                rows={2}
                placeholder="Текст предупреждения для всех участников комнаты..."
                className="w-full bg-[#0a0a12] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-text-dim focus:outline-none focus:border-yellow-500/40 resize-none"
              />
              {warnResult && (
                <p className={`text-xs ${warnResult.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{warnResult}</p>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="w-full border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                onClick={() => void handleWarn()}
                disabled={warnLoading || !warnMsg.trim() || !roomDetails}
              >
                {warnLoading ? 'Отправка...' : `Отправить всем участникам (${roomDetails?.members.length ?? '…'})`}
              </Button>
            </div>

            {/* ── Заблокировать владельца ── */}
            <div className="bg-red-500/[0.05] border border-red-500/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Shield size={13} className="text-red-400" />
                <span className="text-xs font-medium text-red-400">Блокировка владельца</span>
              </div>
              <p className="text-xs text-text-dim">
                Владелец будет заблокирован. Аккаунт потеряет доступ к платформе.
              </p>
              {blockResult && (
                <p className={`text-xs ${blockResult.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{blockResult}</p>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="w-full border border-red-500/40 text-red-400 hover:bg-red-500/10"
                onClick={() => void handleBlockOwner()}
                disabled={blockLoading || !roomDetails || !!blockResult}
              >
                {blockLoading ? 'Блокировка...' : 'Заблокировать владельца'}
              </Button>
            </div>

            {/* ── Примечание + решение ── */}
            <div>
              <label className="text-xs text-text-dim block mb-1.5">Примечание для команды (необязательно)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full bg-[#0a0a12] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent/50 resize-none"
                placeholder="Заметка для команды..."
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => void handleAction('dismissed')} disabled={actionLoading}>
                Отклонить
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => void handleAction('reviewed')} disabled={actionLoading}>
                Рассмотрено
              </Button>
              <Button variant="primary" className="flex-1 bg-red-500/80 hover:bg-red-500" onClick={() => void handleAction('actioned')} disabled={actionLoading}>
                Меры приняты
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
