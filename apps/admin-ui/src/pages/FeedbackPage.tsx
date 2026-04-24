import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { feedbackApi } from '../api/feedback.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { Feedback, PaginationMeta } from '../types';

const STATUS_VARIANT: Record<Feedback['status'], 'gray' | 'yellow' | 'green' | 'blue'> = {
  pending: 'gray', in_progress: 'yellow', resolved: 'green', closed: 'blue',
};
const STATUS_LABEL: Record<Feedback['status'], string> = {
  pending: 'Ожидает', in_progress: 'В работе', resolved: 'Решено', closed: 'Закрыто',
};
const TYPE_VARIANT: Record<string, 'blue' | 'red' | 'gray'> = {
  bug: 'red', feature: 'blue', general: 'gray',
};

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [meta, setMeta]           = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [page, setPage]           = useState(1);

  const [replyModal, setReplyModal]     = useState<{ fb: Feedback } | null>(null);
  const [replyText, setReplyText]       = useState('');
  const [replyStatus, setReplyStatus]   = useState<'resolved' | 'in_progress' | 'closed'>('resolved');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feedbackApi.list({ page, limit: 20, status: statusFilter || undefined, type: typeFilter || undefined });
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Обратная связь</h1>
          <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString('ru')} сообщений</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dim bg-card rounded-xl px-3 py-2 border border-white/[0.06]">
          <MessageSquare size={13} />
          <span>От пользователей</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="in_progress">В работе</option>
          <option value="resolved">Решено</option>
          <option value="closed">Закрыто</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все типы</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="general">Общее</option>
        </select>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-card rounded-2xl animate-pulse shadow-card" />
          ))
        ) : feedbacks.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-card px-5 py-12 text-center">
            <Search size={32} className="text-text-dim mx-auto mb-3" />
            <p className="text-text-muted">Сообщений не найдено</p>
          </div>
        ) : feedbacks.map((fb) => (
          <div key={fb._id} className="bg-card rounded-2xl shadow-card border border-white/[0.06] p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={TYPE_VARIANT[fb.type] ?? 'gray'}>{fb.type}</Badge>
                <Badge variant={STATUS_VARIANT[fb.status]} dot>{STATUS_LABEL[fb.status]}</Badge>
                <span className="text-xs text-text-dim">
                  {new Date(fb.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {(fb.status === 'pending' || fb.status === 'in_progress') && (
                <Button size="sm" variant="primary" onClick={() => { setReplyModal({ fb }); setReplyText(fb.reply ?? ''); setReplyStatus('resolved'); }}>
                  Ответить
                </Button>
              )}
            </div>
            <p className="text-sm text-white leading-relaxed">{fb.content}</p>
            {fb.reply && (
              <div className="bg-accent/[0.06] rounded-xl p-3.5 border-l-2 border-accent/40">
                <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5">Ответ администратора</p>
                <p className="text-sm text-white leading-relaxed">{fb.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {meta.totalPages > 1 && (
        <div className="bg-card rounded-2xl shadow-card px-5 border border-white/[0.06]">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      )}

      {/* Reply Modal */}
      <Modal open={!!replyModal} onClose={() => setReplyModal(null)} title="Ответить на сообщение">
        {replyModal && (
          <div className="flex flex-col gap-4">
            <div className="bg-bg/60 rounded-xl p-3.5 border border-white/[0.06] text-sm text-text-muted leading-relaxed">
              {replyModal.fb.content}
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder="Напишите ответ..."
              className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none transition-all"
            />
            <select
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value as typeof replyStatus)}
              className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
            >
              <option value="in_progress">В работе</option>
              <option value="resolved">Решено</option>
              <option value="closed">Закрыто</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setReplyModal(null)}>Отмена</Button>
              <Button variant="primary" loading={actionLoading} disabled={!replyText.trim()} onClick={() => void handleReply()}>
                Отправить
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
