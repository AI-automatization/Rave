'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  senderName: string;
  text: string;
  onCancel: () => void;
}

// Bar shown above the composer while replying — port of mobile's ReplyPreviewBar.tsx.
export function ReplyPreviewBar({ senderName, text, onCancel }: Props) {
  const t = useTranslations('dm');

  return (
    <div className="flex items-center gap-2.5 border-t border-[var(--ww-line)] bg-[var(--ww-surface-1)] px-4 py-2">
      <span aria-hidden="true" className="w-[3px] shrink-0 self-stretch rounded-full bg-[var(--ww-accent)]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-[var(--ww-accent-hi)]">{senderName}</p>
        <p className="truncate text-[12px] text-[var(--ww-text-3)]">{text}</p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--ww-text-3)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
        aria-label={t('cancelReply')}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
