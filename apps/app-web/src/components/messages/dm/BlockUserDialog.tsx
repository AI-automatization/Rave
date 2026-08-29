'use client';

import { useTranslations } from 'next-intl';
import { Ban } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useBlockUser } from '@/hooks/use-dm';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import { trackClick } from '@/lib/analytics';

interface Props {
  peerId: string | null;
  peerUsername?: string;
  onOpenChange: (open: boolean) => void;
}

export function BlockUserDialog({ peerId, peerUsername, onOpenChange }: Props) {
  const t = useTranslations('dm');
  const parseError = useApiError();
  const blockUser = useBlockUser();

  function handleConfirm() {
    if (!peerId) return;
    trackClick('dm:block_confirm');
    blockUser.mutate(peerId, {
      onSuccess: () => onOpenChange(false),
      onError: (err) => toast.error(parseError(err, t('blockError'))),
    });
  }

  return (
    <Dialog open={!!peerId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] gap-0 overflow-hidden rounded-[var(--ww-r-xl)] border-[var(--ww-line)] bg-[var(--ww-panel-solid)] p-0 text-[var(--ww-text)]">
        <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ww-danger-soft)]">
            <Ban size={20} aria-hidden="true" className="text-[var(--ww-danger)]" />
          </span>
          <p className="text-[15px] font-semibold text-[var(--ww-text)]">{t('blockUserTitle')}</p>
          <p className="text-[13px] text-[var(--ww-text-3)]">
            {peerUsername ? `@${peerUsername} — ` : ''}
            {t('blockUserMsg')}
          </p>

          <div className="mt-2 flex w-full gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="ww-btn-subtle h-10 flex-1 cursor-pointer rounded-[var(--ww-r-md)] text-[13px] font-medium text-[var(--ww-text-2)]"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={blockUser.isPending}
              className="h-10 flex-1 cursor-pointer rounded-[var(--ww-r-md)] bg-[var(--ww-danger)] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('blockBtn')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
