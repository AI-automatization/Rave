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
    <div className="flex items-center gap-2.5 px-4 py-2 border-b border-white/[0.07]" style={{ background: '#111120' }}>
      <div className="w-[3px] self-stretch rounded-full shrink-0" style={{ backgroundColor: '#7B72F8' }} />
      <button onClick={handlePress} className="flex-1 min-w-0 text-left cursor-pointer">
        <p className="text-[11px] font-semibold" style={{ color: '#9C93FF' }}>
          {pinnedMessages.length > 1
            ? `${t('pinnedMessage')} ${index + 1}/${pinnedMessages.length}`
            : t('pinnedMessage')}
        </p>
        <p className="text-[12px] text-white/60 truncate">{current.text}</p>
      </button>
      {onUnpin && (
        <button
          onClick={() => onUnpin(current)}
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
          aria-label={t('unpin')}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
