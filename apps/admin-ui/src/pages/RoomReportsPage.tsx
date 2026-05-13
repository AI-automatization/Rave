import { useEffect, useState, useCallback } from 'react';
import {
  Flag, Search, Users, ExternalLink, Shield,
  AlertTriangle, Copy, CheckCheck, Play, Pause, Film,
  User, Clock, Globe, Lock,
} from 'lucide-react';
import { moderationApi, RoomReport, RoomDetails, ReportStatus } from '../api/moderation.api';
import { BLOCK_REASON_FROM_REPORT } from '../components/ui/BlockReasonPicker';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterTabs } from '../components/ui/FilterTabs';
import type { PaginationMeta } from '../types';

const STATUS_TABS = [
  { value: '',          label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'reviewed',  label: 'Reviewed' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'actioned',  label: 'Actioned' },
];

const REASON_LABEL: Record<string, string> = {
  prohibited_content: 'Prohibited content',
  spam: 'Spam',
  violence: 'Violence',
  harassment: 'Harassment',
  copyright: 'Copyright',
  other: 'Other',
};

const STATUS_VARIANT: Record<ReportStatus, 'gray' | 'yellow' | 'green' | 'blue' | 'red'> = {
  pending:  'yellow',
  reviewed: 'blue',
  dismissed:'gray',
  actioned: 'green',
};
const STATUS_LABEL: Record<ReportStatus, string> = {
  pending:  'Pending',
  reviewed: 'Reviewed',
  dismissed:'Dismissed',
  actioned: 'Actioned',
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

function SkeletonRow() {
  return (
    <tr>
      {[18, 18, 14, 12, 12, 8].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 shimmer-bg rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function RoomReportsPage() {
  const [reports, setReports]   = useState<RoomReport[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');

  const [modal, setModal]       = useState<{ report: RoomReport } | null>(null);
  const [roomDetails, setRoomDetails]               = useState<RoomDetails | null>(null);
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
      setRoomDetailsError((err as Error).message ?? 'Failed to load room data');
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
      setWarnResult({ ok: true, msg: `Warning sent to ${res.warned} users` });
      setWarnMsg('');
    } catch {
      setWarnResult({ ok: false, msg: 'Failed to send — try again' });
    }
    finally { setWarnLoading(false); }
  };

  const handleBlockOwner = async () => {
    if (!modal) return;
    const ownerLabel = roomDetails?.ownerUsername ? `@${roomDetails.ownerUsername}` : shortId(modal.report.roomId);
    const blockReason = BLOCK_REASON_FROM_REPORT[modal.report.reason] ?? 'Platform rules violation';
    if (!confirm(`Block room owner ${ownerLabel}?\n\nReason: "${blockReason}"`)) return;
    setBlockLoading(true);
    try {
      const res = await moderationApi.blockRoomOwner(modal.report._id, blockReason);
      const name = roomDetails?.ownerUsername ? `@${roomDetails.ownerUsername}` : shortId(res.blockedUserId);
      setBlockResult({ ok: true, msg: `${name} blocked` });
    } catch {
      setBlockResult({ ok: false, msg: 'Block failed' });
    }
    finally { setBlockLoading(false); }
  };

  const copyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = search
    ? reports.filter((r) =>
        r.roomId.toLowerCase().includes(search.toLowerCase()) ||
        r.reporterId.toLowerCase().includes(search.toLowerCase()),
      )
    : reports;

  const UserChip = ({ id, username }: { id: string; username?: string | null }) => (
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
        <User size={10} className="text-text-dim" />
      </div>
      {username ? (
        <span className="text-[12px] font-medium text-white">@{username}</span>
      ) : (
        <button
          className="flex items-center gap-1 font-mono text-[12px] text-text-muted hover:text-white transition-colors"
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
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader title="Room Reports" meta={`${meta.total.toLocaleString('en')} total`} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          <input
            type="text"
            placeholder="Room or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9 w-64"
          />
        </div>
        <FilterTabs
          options={STATUS_TABS}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
        />
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Room ID', 'Reporter', 'Reason', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                        <Flag size={20} className="text-text-dim" />
                      </div>
                      <p className="text-text-muted text-sm font-medium">No reports found</p>
                    </div>
                  </td>
                </tr>
              )
              : filtered.map((r) => (
                <tr key={r._id} className="tr-hover">
                  <td className="px-5 py-4 font-mono text-[12px] text-text-muted">{shortId(r.roomId)}</td>
                  <td className="px-5 py-4 font-mono text-[12px] text-text-muted">{shortId(r.reporterId)}</td>
                  <td className="px-5 py-4">
                    <Badge variant="orange">{REASON_LABEL[r.reason] ?? r.reason}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[r.status]} dot>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-text-muted whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-5 py-4">
                    <Button size="xs" variant={r.status === 'pending' ? 'primary' : 'ghost'}
                      onClick={() => void openModal(r)}>
                      {r.status === 'pending' ? 'Review' : 'Open'}
                    </Button>
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

      {modal && (
        <Modal open={!!modal} title="Review report" onClose={closeModal} size="xl">
          <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              {/* Report */}
              <div className="bg-surface rounded-xl border border-white/[0.06] p-4 space-y-3">
                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em]">Report</p>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">From</p>
                    <UserChip id={modal.report.reporterId} username={roomDetails?.reporterUsername} />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">Room ID</p>
                    <button onClick={() => copyId(modal.report.roomId)}
                      className="flex items-center gap-1.5 font-mono text-[12px] text-text-muted hover:text-white transition-colors"
                      title={modal.report.roomId}>
                      <span>{shortId(modal.report.roomId)}</span>
                      {copiedId === modal.report.roomId
                        ? <CheckCheck size={11} className="text-green-400" />
                        : <Copy size={11} className="opacity-50" />}
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">Reason</p>
                    <Badge variant="orange">{REASON_LABEL[modal.report.reason] ?? modal.report.reason}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">Date</p>
                    <p className="text-[12px] text-text-muted">{new Date(modal.report.createdAt).toLocaleString('en-US')}</p>
                  </div>
                  {modal.report.comment && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <p className="text-[10px] text-text-dim mb-1">Comment</p>
                      <p className="text-[12px] text-white italic leading-relaxed">"{modal.report.comment}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Room */}
              <div className="bg-surface rounded-xl border border-white/[0.06] p-4 space-y-3">
                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em]">Room</p>
                {roomDetailsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-3 h-3 rounded-full bg-accent/40 animate-pulse" />
                    <span className="text-[12px] text-text-dim">Loading...</span>
                  </div>
                ) : roomDetailsError ? (
                  <div className="py-3">
                    <p className="text-[12px] text-red-400">{roomDetailsError}</p>
                    <p className="text-[12px] text-text-dim mt-1">Room may already be closed</p>
                  </div>
                ) : roomDetails ? (
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[10px] text-text-dim mb-1">Owner</p>
                      <UserChip id={roomDetails.ownerId} username={roomDetails.ownerUsername} />
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[10px] text-text-dim mb-1">Members</p>
                        <div className="flex items-center gap-1">
                          <Users size={11} className="text-text-dim" />
                          <span className="text-[12px] text-white">{roomDetails.members.length}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-dim mb-1">Type</p>
                        <div className="flex items-center gap-1">
                          {roomDetails.isPublic
                            ? <Globe size={11} className="text-blue-400" />
                            : <Lock size={11} className="text-text-dim" />}
                          <span className="text-[12px] text-white">{roomDetails.isPublic ? 'Public' : 'Private'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-dim mb-1">Status</p>
                        <Badge variant={roomDetails.status === 'playing' ? 'green' : roomDetails.status === 'waiting' ? 'yellow' : 'gray'}>
                          {roomDetails.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-dim mb-1">Name</p>
                      <p className="text-[13px] text-white font-medium leading-snug line-clamp-2">
                        {roomDetails.name || <span className="text-text-dim italic">No name</span>}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Video */}
            {roomDetails && (roomDetails.videoUrl || roomDetails.videoTitle) && (
              <div className="bg-surface rounded-xl border border-white/[0.06] p-4">
                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em] mb-3">Video</p>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {roomDetails.videoThumbnail ? (
                      <img src={roomDetails.videoThumbnail} alt="thumbnail"
                        className="w-28 h-16 object-cover rounded-lg border border-white/[0.08]" />
                    ) : (
                      <div className="w-28 h-16 bg-white/[0.05] rounded-lg border border-white/[0.06] flex items-center justify-center">
                        <Film size={20} className="text-text-dim opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-[13px] text-white font-medium leading-snug line-clamp-2">
                      {roomDetails.videoTitle ?? 'Untitled'}
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
                          <span className="text-[11px] text-yellow-400 font-mono font-semibold">
                            {fmtTime(roomDetails.currentTime)}
                          </span>
                        </div>
                      )}
                    </div>
                    {roomDetails.videoUrl && (
                      <div className="flex items-start gap-1.5">
                        <ExternalLink size={11} className="text-text-dim mt-0.5 flex-shrink-0" />
                        <p className="text-[12px] text-blue-400 font-mono break-all leading-relaxed line-clamp-2">
                          {roomDetails.videoUrl}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Warn */}
            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-[0.08em]">Warn participants</p>
                {roomDetails && (
                  <span className="ml-auto text-[12px] text-text-dim">{roomDetails.members.length} members</span>
                )}
              </div>
              <textarea
                value={warnMsg}
                onChange={(e) => setWarnMsg(e.target.value)}
                rows={2}
                placeholder="Warning message for all room participants..."
                className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white placeholder-text-dim focus:outline-none focus:border-amber-500/40 resize-none"
              />
              {warnResult && (
                <div className={`flex items-center gap-1.5 text-[12px] ${warnResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {warnResult.ok ? <CheckCheck size={12} /> : <AlertTriangle size={12} />}
                  {warnResult.msg}
                </div>
              )}
              <Button size="sm" variant="ghost"
                className="w-full border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40"
                onClick={() => void handleWarn()}
                disabled={warnLoading || !warnMsg.trim() || !roomDetails}>
                {warnLoading
                  ? 'Sending...'
                  : `Send to all (${roomDetails?.members.length ?? '…'})`}
              </Button>
            </div>

            {/* Block owner */}
            <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-red-400" />
                <p className="text-[11px] font-semibold text-red-400 uppercase tracking-[0.08em]">Block owner</p>
              </div>
              {roomDetails?.ownerUsername && (
                <p className="text-[12px] text-text-dim">
                  Account <span className="text-white font-medium">@{roomDetails.ownerUsername}</span> will lose platform access.
                </p>
              )}
              {modal && (
                <div className="flex items-start gap-1.5 px-2.5 py-1.5 bg-red-500/[0.08] border border-red-500/15 rounded-lg">
                  <span className="text-[10px] text-red-400/70 mt-0.5 flex-shrink-0">Reason:</span>
                  <span className="text-[11px] text-red-300 leading-snug">
                    {BLOCK_REASON_FROM_REPORT[modal.report.reason] ?? 'Platform rules violation'}
                  </span>
                </div>
              )}
              {blockResult && (
                <div className={`flex items-center gap-1.5 text-[12px] ${blockResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {blockResult.ok ? <CheckCheck size={12} /> : <AlertTriangle size={12} />}
                  {blockResult.msg}
                </div>
              )}
              <Button size="sm" variant="ghost"
                className="w-full border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                onClick={() => void handleBlockOwner()}
                disabled={blockLoading || !roomDetails || blockResult?.ok === true}>
                {blockLoading
                  ? 'Blocking...'
                  : roomDetails?.ownerUsername
                    ? `Block @${roomDetails.ownerUsername}`
                    : 'Block owner'}
              </Button>
            </div>

            {/* Note + decision */}
            <div className="space-y-3 pt-1 border-t border-white/[0.05]">
              <div>
                <label className="text-[11px] text-text-dim block mb-1.5 uppercase tracking-[0.06em]">Note for team (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/25 resize-none transition-all"
                  placeholder="Decision note..."
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="ghost" onClick={() => void handleAction('dismissed')} disabled={actionLoading}>
                  Dismiss
                </Button>
                <Button variant="ghost" onClick={() => void handleAction('reviewed')} disabled={actionLoading}>
                  Reviewed
                </Button>
                <Button variant="danger" onClick={() => void handleAction('actioned')} disabled={actionLoading}>
                  Action taken
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
