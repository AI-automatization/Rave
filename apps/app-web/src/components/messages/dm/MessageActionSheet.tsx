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
        className="bg-[#16162a] border-white/[0.08] text-white p-0 overflow-hidden gap-0
          w-full max-w-full left-0 right-0 bottom-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none
          sm:max-w-[320px] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-6 sm:top-auto sm:rounded-2xl"
      >
        <div className="flex flex-col py-1">
          <button
            onClick={handle((m) => { trackClick('dm:action_reply'); onReply(m); })}
            className="flex items-center gap-3 px-4 py-3 text-sm text-white/85 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Reply size={17} /> {t('reply')}
          </button>
          <button
            onClick={handle((m) => { trackClick('dm:action_forward'); onForward(m); })}
            className="flex items-center gap-3 px-4 py-3 text-sm text-white/85 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Forward size={17} /> {t('forward')}
          </button>
          <button
            onClick={handle((m) => { trackClick('dm:action_pin'); onTogglePin(m); })}
            className="flex items-center gap-3 px-4 py-3 text-sm text-white/85 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {message?.pinned ? <PinOff size={17} /> : <Pin size={17} />}
            {message?.pinned ? t('unpin') : t('pin')}
          </button>
          <button
            onClick={() => { if (message) { trackClick('dm:action_copy'); onCopy(message); } }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-white/85 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Copy size={17} /> {t('copy')}
          </button>
          <div className="border-t border-white/[0.07]" />
          <button
            onClick={onClose}
            className="flex items-center justify-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
