'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import type { DmMessage } from '@/lib/api/user.api';

interface Props {
  pinnedMessages: DmMessage[];
  onJump: (message: DmMessage) => void;
  onUnpin?: (message: DmMessage) => void;
}

// Telegram-style pinned bar below the header — port of mobile's PinnedMessagesBar.tsx. Tapping
// the body jumps to the currently-shown pin and (when there's more than one) cycles to the
// next; the index resets to the newest pin whenever the pin count changes (add/remove).
export function PinnedMessagesBar({ pinnedMessages, onJump, onUnpin }: Props) {
  const t = useTranslations('dm');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [pinnedMessages.length]);

  if (pinnedMessages.length === 0) return null;

  const current = pinnedMessages[Math.min(index, pinnedMessages.length - 1)];

  function handlePress() {
    onJump(current);
    if (pinnedMessages.length > 1) {
      setIndex((i) => (i + 1) % pinnedMessages.length);
    }
  }

  return (
    <div className="flex items-center gap-2.5 border-b border-[var(--ww-line)] bg-[var(--ww-surface-1)] px-4 py-2">
      <span aria-hidden="true" className="w-[3px] shrink-0 self-stretch rounded-full bg-[var(--ww-accent)]" />
      <button type="button" onClick={handlePress} className="min-w-0 flex-1 cursor-pointer text-left">
        <p className="text-[11px] font-semibold text-[var(--ww-accent-hi)]">
          {pinnedMessages.length > 1
            ? `${t('pinnedMessage')} ${index + 1}/${pinnedMessages.length}`
            : t('pinnedMessage')}
        </p>
        <p className="truncate text-[12px] text-[var(--ww-text-3)]">{current.text}</p>
      </button>
      {onUnpin && (
        <button
          type="button"
          onClick={() => onUnpin(current)}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--ww-text-4)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
          aria-label={t('unpin')}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
