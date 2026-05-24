import { useEffect, useState, useCallback } from 'react';
import {
  Flag, Search, ExternalLink, Shield,
  AlertTriangle, Copy, CheckCheck, User,
} from 'lucide-react';
import { moderationApi, UserReport, UserReportStatus } from '../api/moderation.api';
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
  harassment:           'Harassment',
  spam:                 'Spam',
  inappropriate_content:'Inappropriate content',
  fake_account:         'Fake account',
  hate_speech:          'Hate speech',
  other:                'Other',
};

const REASON_VARIANT: Record<string, 'red' | 'orange' | 'yellow' | 'purple' | 'gray'> = {
  harassment:           'red',
  hate_speech:          'red',
  inappropriate_content:'orange',
  fake_account:         'purple',
  spam:                 'yellow',
  other:                'gray',
};

const STATUS_VARIANT: Record<UserReportStatus, 'gray' | 'yellow' | 'green' | 'blue' | 'red'> = {
  pending:   'yellow',
  reviewed:  'blue',
  dismissed: 'gray',
  actioned:  'green',
};

const STATUS_LABEL: Record<UserReportStatus, string> = {
  pending:   'Pending',
  reviewed:  'Reviewed',
  dismissed: 'Dismissed',
  actioned:  'Actioned',
};

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

export function UserReportsPage() {
  const [reports, setReports]   = useState<UserReport[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');

  const [modal, setModal]       = useState<{ report: UserReport } | null>(null);
  const [note, setNote]         = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [blockLoading, setBlockLoading]   = useState(false);
  const [blockResult, setBlockResult]     = useState<{ ok: boolean; msg: string } | null>(null);
  const [copiedId, setCopiedId]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await moderationApi.listUserReports({ page, limit: 20, status: statusFilter || undefined });
      setReports(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const openModal = useCallback((report: UserReport) => {
    setModal({ report });
    setNote('');
    setBlockResult(null);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const handleAction = async (status: UserReportStatus) => {
    if (!modal) return;
    setActionLoading(true);
    try {
      await moderationApi.reviewUserReport(modal.report._id, status, note || undefined);
      closeModal();
      void load();
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const handleBlockReported = async () => {
    if (!modal) return;
    const label = shortId(modal.report.reportedUserId);
    const reason = REASON_LABEL[modal.report.reason] ?? 'Platform rules violation';
    if (!confirm(`Block user ${label}?\n\nReason: "${reason}"`)) return;
    setBlockLoading(true);
    try {
      const res = await moderationApi.blockUser(modal.report.reportedUserId, reason);
      setBlockResult({ ok: true, msg: `User ${shortId(res.blockedUserId)} blocked` });
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
        r.reportedUserId.toLowerCase().includes(search.toLowerCase()) ||
        r.reporterId.toLowerCase().includes(search.toLowerCase()),
      )
    : reports;

  const UserChip = ({ id }: { id: string }) => (
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
        <User size={10} className="text-text-dim" />
      </div>
      <button
        className="flex items-center gap-1 font-mono text-[12px] text-text-muted hover:text-white transition-colors"
        onClick={() => copyId(id)}
        title={id}
      >
        <span>{shortId(id)}</span>
        {copiedId === id
          ? <CheckCheck size={10} className="text-green-400" />
          : <Copy size={10} className="opacity-50" />}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader title="User Reports" meta={`${meta.total.toLocaleString('en')} total`} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          <input
            type="text"
            placeholder="Reporter or reported user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9 w-72"
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
              {['Reported User', 'Reporter', 'Reason', 'Status', 'Date', ''].map((h) => (
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
                  <td className="px-5 py-4 font-mono text-[12px] text-text-muted">{shortId(r.reportedUserId)}</td>
                  <td className="px-5 py-4 font-mono text-[12px] text-text-muted">{shortId(r.reporterId)}</td>
                  <td className="px-5 py-4">
                    <Badge variant={REASON_VARIANT[r.reason] ?? 'gray'}>
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[r.status]} dot>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-text-muted whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-5 py-4">
                    <Button size="xs" variant={r.status === 'pending' ? 'primary' : 'ghost'}
                      onClick={() => openModal(r)}>
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
        <Modal open={!!modal} title="Review user report" onClose={closeModal} size="xl">
          <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              {/* Report details */}
              <div className="bg-surface rounded-xl border border-white/[0.06] p-4 space-y-3">
                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em]">Report</p>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">Reason</p>
                    <Badge variant={REASON_VARIANT[modal.report.reason] ?? 'gray'}>
                      {REASON_LABEL[modal.report.reason] ?? modal.report.reason}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-dim mb-1">Status</p>
                    <Badge variant={STATUS_VARIANT[modal.report.status]} dot>
                      {STATUS_LABEL[modal.report.status]}
                    </Badge>
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

              {/* Users */}
              <div className="bg-surface rounded-xl border border-white/[0.06] p-4 space-y-3">
                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em]">Users</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-text-dim mb-1.5">Reporter</p>
                    <div className="flex items-center gap-2">
                      <UserChip id={modal.report.reporterId} />
                      <a
                        href={`/users/${modal.report.reporterId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md text-text-dim hover:text-white transition-colors"
                        title="View profile"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className="text-[10px] text-text-dim mb-1.5">Reported user</p>
                    <div className="flex items-center gap-2">
                      <UserChip id={modal.report.reportedUserId} />
                      <a
                        href={`/users/${modal.report.reportedUserId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md text-text-dim hover:text-white transition-colors"
                        title="View profile"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Block reported user */}
            <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-red-400" />
                <p className="text-[11px] font-semibold text-red-400 uppercase tracking-[0.08em]">Block reported user</p>
              </div>
              <p className="text-[12px] text-text-dim">
                User <span className="font-mono text-white">{shortId(modal.report.reportedUserId)}</span> will lose platform access.
              </p>
              <div className="flex items-start gap-1.5 px-2.5 py-1.5 bg-red-500/[0.08] border border-red-500/15 rounded-lg">
                <span className="text-[10px] text-red-400/70 mt-0.5 flex-shrink-0">Reason:</span>
                <span className="text-[11px] text-red-300 leading-snug">
                  {REASON_LABEL[modal.report.reason] ?? 'Platform rules violation'}
                </span>
              </div>
              {blockResult && (
                <div className={`flex items-center gap-1.5 text-[12px] ${blockResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {blockResult.ok ? <CheckCheck size={12} /> : <AlertTriangle size={12} />}
                  {blockResult.msg}
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="w-full border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                onClick={() => void handleBlockReported()}
                disabled={blockLoading || blockResult?.ok === true}
              >
                {blockLoading ? 'Blocking...' : `Block ${shortId(modal.report.reportedUserId)}`}
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
