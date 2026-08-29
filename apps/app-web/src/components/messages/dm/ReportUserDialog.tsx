'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Flag } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useReportUser } from '@/hooks/use-dm';
import { trackClick } from '@/lib/analytics';
import type { UserReportReason } from '@/lib/api/report.api';

const REASONS: UserReportReason[] = [
  'harassment',
  'spam',
  'inappropriate_content',
  'fake_account',
  'hate_speech',
  'other',
];

interface Props {
  peerId: string | null;
  peerUsername?: string;
  onOpenChange: (open: boolean) => void;
}

// Web port of mobile's ReportUserModal (apps/mobile/src/components/common/ReportUserModal.tsx)
// — same reasons, same one-shot submit-then-done flow, opened from the conversation list's
// "…" menu since web has no long-press friend-profile equivalent for DM peers.
export function ReportUserDialog({ peerId, peerUsername, onOpenChange }: Props) {
  const t = useTranslations('dm');
  const reportUser = useReportUser();
  const [selected, setSelected] = useState<UserReportReason | null>(null);
  const [comment, setComment] = useState('');

  const open = !!peerId;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelected(null);
      setComment('');
      reportUser.reset();
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    if (!peerId || !selected) return;
    trackClick('dm:report_submit', { reason: selected });
    reportUser.mutate({ userId: peerId, reason: selected, comment: comment.trim() || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[420px] gap-0 overflow-hidden rounded-[var(--ww-r-xl)] border-[var(--ww-line)] bg-[var(--ww-panel-solid)] p-0 text-[var(--ww-text)]">
        {reportUser.isSuccess ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <CheckCircle2 size={44} aria-hidden="true" className="text-[var(--ww-accent-hi)]" />
            <p className="text-[15px] font-semibold text-[var(--ww-text)]">{t('reportSent')}</p>
            <p className="text-[13px] text-[var(--ww-text-3)]">{t('reportReview')}</p>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="ww-btn-subtle mt-2 h-10 cursor-pointer rounded-[var(--ww-r-md)] px-5 text-[13px] font-medium text-[var(--ww-text-2)]"
            >
              {t('close')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-[var(--ww-line)] px-4 py-3.5">
              <Flag size={16} aria-hidden="true" className="text-[var(--ww-text-3)]" />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[var(--ww-text)]">{t('reportUser')}</p>
                {peerUsername && <p className="truncate text-[12px] text-[var(--ww-text-3)]">@{peerUsername}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-3 px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--ww-text-4)]">
                {t('reportReason')}
              </p>
              <div className="flex flex-col gap-1">
                {REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelected(reason)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-[var(--ww-r-md)] px-2.5 py-2 text-left text-[13.5px] transition-colors ${
                      selected === reason
                        ? 'bg-[var(--ww-accent-soft)] text-[var(--ww-text)]'
                        : 'text-[var(--ww-text-2)] hover:bg-[var(--ww-surface-1)]'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected === reason ? 'border-[var(--ww-accent-hi)]' : 'border-[var(--ww-line)]'
                      }`}
                    >
                      {selected === reason && <span className="h-2 w-2 rounded-full bg-[var(--ww-accent-hi)]" />}
                    </span>
                    {t(`reportReason_${reason}`)}
                  </button>
                ))}
              </div>

              <label className="mt-1 flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--ww-text-4)]">
                  {t('reportComment')}
                </span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('reportCommentPlaceholder')}
                  rows={3}
                  className="resize-none rounded-[var(--ww-r-md)] border border-[var(--ww-line)] bg-[var(--ww-surface-1)] px-3 py-2 text-[13px] text-[var(--ww-text)] placeholder:text-[var(--ww-text-4)] focus:outline-none focus:ring-1 focus:ring-[var(--ww-accent)]"
                />
              </label>

              {reportUser.isError && (
                <p className="text-[12.5px] text-[var(--ww-danger)]">{t('reportError')}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selected || reportUser.isPending}
                className="mt-1 flex h-10 cursor-pointer items-center justify-center rounded-[var(--ww-r-md)] bg-[var(--ww-accent)] text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {reportUser.isPending ? t('reportSending') : t('reportSend')}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
