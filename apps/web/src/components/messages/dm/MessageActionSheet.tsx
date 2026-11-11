'use client';

import { useTranslations } from 'next-intl';
import { Reply, Forward, Pin, PinOff, Copy } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { DmMessage } from '@/lib/api/user.api';
import { trackClick } from '@/lib/analytics';

interface Props {
  message: DmMessage | null;
  onReply: (message: DmMessage) => void;
  onForward: (message: DmMessage) => void;
  onCopy: (message: DmMessage) => void;
  onTogglePin: (message: DmMessage) => void;
  onClose: () => void;
}

// Web port of mobile's MessageActionSheet.tsx. Mobile renders this as a native bottom sheet;
// Radix DropdownMenu would need a per-row anchor (awkward with one global controlled sheet), so
// this uses Dialog with bottom-sheet-style overrides instead — full-width slide-up on narrow
// (mobile-web) viewports, a small bottom-anchored card on desktop. Reply/Forward/Pin all close
// the sheet after firing (matches mobile); Copy deliberately does NOT auto-close, mirroring
// mobile's comment that Copy stays open (the caller shows a toast instead).
export function MessageActionSheet({ message, onReply, onForward, onCopy, onTogglePin, onClose }: Props) {
  const t = useTranslations('dm');

  function handle(action: (m: DmMessage) => void) {
    if (!message) return;
    return () => { action(message); onClose(); };
  }

  return (
    <Dialog open={!!message} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="gap-0 overflow-hidden border-[var(--ww-line)] bg-[var(--ww-panel-solid)] p-0 text-[var(--ww-text)]
          w-full max-w-full left-0 right-0 bottom-0 top-auto translate-x-0 translate-y-0 rounded-t-[var(--ww-r-xl)] rounded-b-none
          sm:max-w-[320px] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-6 sm:top-auto sm:rounded-[var(--ww-r-xl)]"
      >
        {/* 48px qatorlar — barmoq uchun; ilgari py-3 (~44px) edi */}
        <div className="flex flex-col py-1">
          <button
            type="button"
            onClick={handle((m) => { trackClick('dm:action_reply'); onReply(m); })}
            className="flex h-12 cursor-pointer items-center gap-3 px-4 text-[14px] text-[var(--ww-text-2)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
          >
            <Reply size={17} aria-hidden="true" /> {t('reply')}
          </button>
          <button
            type="button"
            onClick={handle((m) => { trackClick('dm:action_forward'); onForward(m); })}
            className="flex h-12 cursor-pointer items-center gap-3 px-4 text-[14px] text-[var(--ww-text-2)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
          >
            <Forward size={17} aria-hidden="true" /> {t('forward')}
          </button>
          <button
            type="button"
            onClick={handle((m) => { trackClick('dm:action_pin'); onTogglePin(m); })}
            className="flex h-12 cursor-pointer items-center gap-3 px-4 text-[14px] text-[var(--ww-text-2)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
          >
            {message?.pinned ? <PinOff size={17} aria-hidden="true" /> : <Pin size={17} aria-hidden="true" />}
            {message?.pinned ? t('unpin') : t('pin')}
          </button>
          <button
            type="button"
            onClick={() => { if (message) { trackClick('dm:action_copy'); onCopy(message); } }}
            className="flex h-12 cursor-pointer items-center gap-3 px-4 text-[14px] text-[var(--ww-text-2)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
          >
            <Copy size={17} aria-hidden="true" /> {t('copy')}
          </button>
          <div aria-hidden="true" className="border-t border-[var(--ww-line)]" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 cursor-pointer items-center justify-center px-4 text-[14px] font-medium text-[var(--ww-text-3)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
          >
            {t('cancel')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
