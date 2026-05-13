import { useEffect, useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { feedbackApi } from '../api/feedback.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterTabs } from '../components/ui/FilterTabs';
import type { Feedback, PaginationMeta } from '../types';

const STATUS_TABS = [
  { value: '',            label: 'All' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'closed',      label: 'Closed' },
];

const TYPE_TABS = [
  { value: '',        label: 'All types' },
  { value: 'bug',     label: '🐛 Bug' },
  { value: 'feature', label: '✨ Feature' },
  { value: 'general', label: '💬 General' },
];

const STATUS_VARIANT: Record<Feedback['status'], 'gray' | 'yellow' | 'green' | 'blue'> = {
  pending: 'gray', in_progress: 'yellow', resolved: 'green', closed: 'blue',
};
const STATUS_LABEL: Record<Feedback['status'], string> = {
  pending: 'Pending', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed',
};
const TYPE_VARIANT: Record<string, 'blue' | 'red' | 'gray'> = {
  bug: 'red', feature: 'blue', general: 'gray',
};

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [meta, setMeta]           = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [page, setPage]           = useState(1);

  const [replyModal, setReplyModal]   = useState<{ fb: Feedback } | null>(null);
  const [replyText, setReplyText]     = useState('');
  const [replyStatus, setReplyStatus] = useState<'resolved' | 'in_progress' | 'closed'>('resolved');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feedbackApi.list({
        page, limit: 20,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setFeedbacks(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleReply = async () => {
    if (!replyModal) return;
    setActionLoading(true);
    try {
      await feedbackApi.reply(replyModal.fb._id, replyText, replyStatus);
      setReplyModal(null);
      await load();
    } finally { setActionLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader title="Feedback" meta={`${meta.total.toLocaleString('en')} messages`} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <FilterTabs
          options={STATUS_TABS}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
        />
        <FilterTabs
          options={TYPE_TABS}
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}
        />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-2xl shimmer-bg shadow-card" />
          ))
        ) : feedbacks.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-card py-16 flex flex-col items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <MessageSquare size={20} className="text-text-dim" />
            </div>
            <p className="text-text-muted text-sm font-medium">No feedback found</p>
            <p className="text-text-dim text-xs">Try adjusting your filters</p>
          </div>
        ) : feedbacks.map((fb) => (
          <div key={fb._id} className="bg-card rounded-2xl shadow-card border border-white/[0.055] p-5 group relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={TYPE_VARIANT[fb.type] ?? 'gray'}>{fb.type}</Badge>
                <Badge variant={STATUS_VARIANT[fb.status]} dot>{STATUS_LABEL[fb.status]}</Badge>
                <span className="text-[11px] text-text-dim">{timeAgo(fb.createdAt)}</span>
              </div>
              {(fb.status === 'pending' || fb.status === 'in_progress') && (
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => { setReplyModal({ fb }); setReplyText(fb.reply ?? ''); setReplyStatus('resolved'); }}
                >
                  Reply
                </Button>
              )}
            </div>

            {/* Content */}
            <p className="text-[13px] text-white leading-relaxed">{fb.content}</p>

            {/* Reply */}
            {fb.reply && (
              <div className="mt-3 bg-accent/[0.06] rounded-xl p-3.5 border-l-2 border-accent/30">
                <p className="text-[10px] text-text-dim uppercase tracking-[0.08em] mb-1.5 font-semibold">Admin reply</p>
                <p className="text-[13px] text-white/80 leading-relaxed">{fb.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {meta.totalPages > 1 && (
        <div className="bg-card rounded-2xl shadow-card px-5 border border-white/[0.055]">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      )}

      {/* Reply modal */}
      <Modal open={!!replyModal} onClose={() => setReplyModal(null)} title="Reply to feedback">
        {replyModal && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface rounded-xl p-3.5 border border-white/[0.06] text-[13px] text-text-muted leading-relaxed">
              {replyModal.fb.content}
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder="Write your reply..."
              className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 resize-none transition-all"
            />
            <select
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value as typeof replyStatus)}
              className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-accent/25 transition-all"
            >
              <option value="in_progress">Mark as in progress</option>
              <option value="resolved">Mark as resolved</option>
              <option value="closed">Close</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setReplyModal(null)}>Cancel</Button>
              <Button variant="primary" loading={actionLoading} disabled={!replyText.trim()} onClick={() => void handleReply()}>
                Send reply
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
