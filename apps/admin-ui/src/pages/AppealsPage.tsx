import { useEffect, useState, useCallback } from 'react';
import { Scale } from 'lucide-react';
import { moderationApi, Appeal, AppealStatus } from '../api/moderation.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterTabs } from '../components/ui/FilterTabs';
import type { PaginationMeta } from '../types';

const STATUS_TABS = [
  { value: '',         label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_VARIANT: Record<AppealStatus, 'yellow' | 'green' | 'red'> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};
const STATUS_LABEL: Record<AppealStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function SkeletonRow() {
  return (
    <tr>
      {[22, 20, 30, 12, 12, 8].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 shimmer-bg rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function AppealsPage() {
  const [appeals, setAppeals]   = useState<Appeal[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage]         = useState(1);

  const [modal, setModal] = useState<{ appeal: Appeal } | null>(null);
  const [note, setNote]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await moderationApi.listAppeals({ page, limit: 20, status: statusFilter || undefined });
      setAppeals(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!modal) return;
    setActionLoading(true);
    try {
      await moderationApi.reviewAppeal(modal.appeal._id, status, note || undefined);
      setModal(null);
      setNote('');
      void load();
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader title="Appeals" meta={`${meta.total.toLocaleString('en')} total`} />

      <FilterTabs
        options={STATUS_TABS}
        value={statusFilter}
        onChange={(v) => { setStatusFilter(v); setPage(1); }}
      />

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['User', 'Ban reason', 'Message', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : appeals.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                        <Scale size={20} className="text-text-dim" />
                      </div>
                      <p className="text-text-muted text-sm font-medium">No appeals found</p>
                    </div>
                  </td>
                </tr>
              )
              : appeals.map((a) => (
                <tr key={a._id} className="tr-hover">
                  <td className="px-5 py-4 font-mono text-[12px] text-text-muted max-w-[120px] truncate">{a.userId}</td>
                  <td className="px-5 py-4 text-[12px] text-text-dim max-w-[120px] truncate">{a.banReason ?? '—'}</td>
                  <td className="px-5 py-4 text-[13px] text-white max-w-[200px] truncate">{a.message}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[a.status]} dot>{STATUS_LABEL[a.status]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-text-muted">
                    {new Date(a.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-5 py-4">
                    {a.status === 'pending' ? (
                      <Button size="xs" variant="primary" onClick={() => { setModal({ appeal: a }); setNote(''); }}>
                        Review
                      </Button>
                    ) : a.reviewNote ? (
                      <span className="text-[12px] text-text-dim truncate max-w-[120px] block">{a.reviewNote}</span>
                    ) : null}
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

      <Modal open={!!modal} title="Review appeal" onClose={() => setModal(null)}>
        {modal && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface rounded-xl p-3.5 border border-white/[0.06] space-y-2">
              <p className="text-[12px] text-text-dim">
                User: <span className="text-white font-mono">{modal.appeal.userId}</span>
              </p>
              {modal.appeal.banReason && (
                <p className="text-[12px] text-text-dim">
                  Ban reason: <span className="text-white">{modal.appeal.banReason}</span>
                </p>
              )}
              <p className="text-[12px] text-text-dim">Message:</p>
              <p className="text-[13px] text-white leading-relaxed">{modal.appeal.message}</p>
            </div>
            <div>
              <label className="text-[11px] text-text-dim block mb-1.5 uppercase tracking-[0.06em]">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 resize-none transition-all"
                placeholder="Reason for decision..."
              />
            </div>
            <p className="text-[12px] text-amber-400 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
              Approving will automatically unblock the user.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => void handleAction('rejected')}
                disabled={actionLoading}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => void handleAction('approved')}
                disabled={actionLoading}
                loading={actionLoading}
              >
                Approve & unblock
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
