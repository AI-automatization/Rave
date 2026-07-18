'use client';

import { MoreHorizontal, Pin, Check, CheckCheck, Reply } from 'lucide-react';
import type { DmMessage } from '@/lib/api/user.api';
import { formatTime } from '@/lib/dm/dm-format';
import { trackClick } from '@/lib/analytics';

interface Props {
  message: DmMessage;
  currentUserId: string | undefined;
  onOpenActions: (message: DmMessage) => void;
  registerRef: (el: HTMLElement | null) => void;
}

// Web port of mobile's MessageItem.tsx bubble. Swipe-to-reply is intentionally dropped (no
// gesture library on web, and this app also opens inside mobile browsers where a horizontal
// swipe gesture would fight page scroll) — reply/forward/pin/copy all go through the hover/tap
// "…" button and right-click, both opening the same action menu (built in Phase 4).
export function MessageItem({ message, currentUserId, onOpenActions, registerRef }: Props) {
  const isMine = message.senderId === currentUserId;

  return (
    <div
      ref={registerRef}
      className={`group/msg flex items-end gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* The 80%-max-width trick: max-w lives on this flex-child wrapper (which resolves
          against the row's definite width), not on the bubble itself — putting it directly on
          the bubble collapsed it to a few px of letter-by-letter wrap in testing, mirroring the
          exact same issue mobile's MessageItem.tsx comment documents for RN Flexbox. min-w-0 lets
          the wrapper actually shrink instead of refusing to wrap long text. */}
      <div className={`max-w-[80%] min-w-0 flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div
          className={`w-fit max-w-full px-3.5 py-2.5 flex flex-col gap-0.5 ${
            isMine
              ? 'rounded-[18px] rounded-br-[5px] text-white'
              : 'rounded-[18px] rounded-bl-[5px] text-white/85 border border-white/[0.06]'
          }`}
          style={{ backgroundColor: isMine ? '#7B72F8' : '#1C1C2E' }}
        >
          {message.forwardFrom && (
            <p className="text-[11px] italic text-white/60 flex items-center gap-1">
              <Reply size={11} className="rotate-180" /> {message.forwardFrom}
            </p>
          )}

          {message.replyToText && (
            <div className="border-l-2 border-white/30 pl-2 py-0.5 mb-0.5">
              <p className="text-[11px] font-semibold text-white/70 truncate">{message.replyToSender}</p>
              <p className="text-[11px] text-white/50 truncate">{message.replyToText}</p>
            </div>
          )}

          <p className="text-sm break-words leading-[1.45]">{message.text}</p>

          <div className={`flex items-center gap-1 self-end ${isMine ? 'text-white/50' : 'text-white/28'}`}>
            {message.pinned && <Pin size={9} />}
            <span className="text-[9px] leading-none">{formatTime(message.createdAt)}</span>
            {isMine && (
              message.read
                ? <CheckCheck size={12} style={{ color: '#9C93FF' }} />
                : <Check size={12} />
            )}
          </div>
        </div>
      </div>

      {/* Hover/tap "…" — web replacement for long-press. Visible on hover (desktop) and always
          on touch (no hover) via md:opacity-0. */}
      <button
        onClick={(e) => { e.stopPropagation(); trackClick('dm:msg_actions_open'); onOpenActions(message); }}
        onContextMenu={(e) => { e.preventDefault(); trackClick('dm:msg_actions_open'); onOpenActions(message); }}
        className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 cursor-pointer self-center"
        aria-label="Message actions"
      >
        <MoreHorizontal size={15} />
      </button>
    </div>
  );
}
