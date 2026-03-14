import { useEffect, useState, useCallback } from 'react';
import { feedbackApi } from '../api/feedback.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { Feedback, PaginationMeta } from '../types';

const statusVariant: Record<Feedback['status'], 'gray' | 'yellow' | 'green' | 'blue'> = {
  pending: 'gray', in_progress: 'yellow', resolved: 'green', closed: 'blue',
};

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const [replyModal, setReplyModal] = useState<{ fb: Feedback } | null>(null);
  const [replyText, setReplyText] = useState('');
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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleReply = async () => {
    if (!replyModal) return;
    setActionLoading(true);
    try {
      await feedbackApi.reply(replyModal.fb._id, replyText, replyStatus);
      setReplyModal(null);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">Feedback</h1>
        <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString()} ta jami</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">Jarayonda</option>
          <option value="resolved">Hal qilindi</option>
          <option value="closed">Yopildi</option>
        </Select>
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha tur</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="general">Umumiy</option>
        </Select>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-text-muted text-sm animate-pulse py-8 text-center">Yuklanmoqda...</div>
        ) : feedbacks.length === 0 ? (
          <div className="text-text-muted text-sm py-8 text-center">Feedback topilmadi</div>
        ) : feedbacks.map((fb) => (
          <div key={fb._id} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="blue">{fb.type}</Badge>
                <Badge variant={statusVariant[fb.status]}>{fb.status}</Badge>
                <span className="text-xs text-text-muted">
                  {new Date(fb.createdAt).toLocaleDateString('uz-UZ')}
                </span>
              </div>
              {fb.status === 'pending' || fb.status === 'in_progress' ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setReplyModal({ fb });
                    setReplyText(fb.reply ?? '');
                    setReplyStatus('resolved');
                  }}
                >
                  Javob berish
                </Button>
              ) : null}
            </div>
            <p className="text-sm text-white">{fb.content}</p>
            {fb.reply && (
              <div className="bg-overlay rounded-lg p-3 border-l-2 border-primary">
                <p className="text-xs text-text-muted mb-1">Admin javobi:</p>
                <p className="text-sm text-white">{fb.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {feedbacks.length > 0 && (
        <div className="bg-surface border border-border rounded-xl px-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      )}

      {/* Reply Modal */}
      <Modal open={!!replyModal} onClose={() => setReplyModal(null)} title="Feedback ga javob">
        {replyModal && (
          <div className="flex flex-col gap-4">
            <div className="bg-overlay rounded-lg p-3 text-sm text-text-muted">
              {replyModal.fb.content}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-muted font-medium">Javob</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none"
                placeholder="Javobingizni yozing..."
              />
            </div>
            <Select label="Status" value={replyStatus} onChange={(e) => setReplyStatus(e.target.value as typeof replyStatus)}>
              <option value="in_progress">Jarayonda</option>
              <option value="resolved">Hal qilindi</option>
              <option value="closed">Yopildi</option>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setReplyModal(null)}>Bekor</Button>
              <Button variant="primary" loading={actionLoading} disabled={!replyText.trim()} onClick={() => void handleReply()}>
                Yuborish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
