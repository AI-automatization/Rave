'use client';

import { MoreHorizontal, Pin, Check, CheckCheck, Reply } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('dm');
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
        {/* Ranglar tokendan: o'z xabari — aksent, kelgan xabar — sirt + chegara.
            Ilgari ikkalasi qo'lda yozilgan hex (#7B72F8 / #1C1C2E) edi. */}
        <div
          className={`flex w-fit max-w-full flex-col gap-0.5 rounded-[18px] px-3.5 py-2.5 ${
            isMine
              ? 'rounded-br-[5px] bg-[var(--ww-accent)] text-white'
              : 'rounded-bl-[5px] border border-[var(--ww-line)] bg-[var(--ww-surface-2)] text-[var(--ww-text-2)]'
          }`}
        >
          {message.forwardFrom && (
            <p className={`flex items-center gap-1 text-[11px] italic ${isMine ? 'text-white/65' : 'text-[var(--ww-text-3)]'}`}>
              <Reply size={11} aria-hidden="true" className="rotate-180" /> {message.forwardFrom}
            </p>
          )}

          {message.replyToText && (
            <div className={`mb-0.5 border-l-2 py-0.5 pl-2 ${isMine ? 'border-white/35' : 'border-[var(--ww-accent-hi)]'}`}>
              <p className={`truncate text-[11px] font-semibold ${isMine ? 'text-white/75' : 'text-[var(--ww-accent-hi)]'}`}>
                {message.replyToSender}
              </p>
              <p className={`truncate text-[11px] ${isMine ? 'text-white/55' : 'text-[var(--ww-text-3)]'}`}>
                {message.replyToText}
              </p>
            </div>
          )}

          <p className="break-words text-[13.5px] leading-[1.45]">{message.text}</p>

          <div className={`flex items-center gap-1 self-end ${isMine ? 'text-white/60' : 'text-[var(--ww-text-4)]'}`}>
            {message.pinned && <Pin size={9} aria-hidden="true" />}
            <time dateTime={message.createdAt} className="text-[9.5px] leading-none">
              {formatTime(message.createdAt)}
            </time>
            {isMine && (
              message.read
                /* "O'qildi" — to'liq oq, ya'ni "yuborildi" dan yorqinroq.
                   Aksent fonda `--ww-accent-hi` ajralib turmaydi. */
                ? <CheckCheck size={12} aria-hidden="true" className="text-white" />
                : <Check size={12} aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      {/* Hover/tap "…" — web replacement for long-press. Visible on hover (desktop) and always
          on touch (no hover) via md:opacity-0. */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); trackClick('dm:msg_actions_open'); onOpenActions(message); }}
        onContextMenu={(e) => { e.preventDefault(); trackClick('dm:msg_actions_open'); onOpenActions(message); }}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center self-center rounded-full text-[var(--ww-text-4)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)] md:opacity-0 md:group-hover/msg:opacity-100 md:group-focus-within/msg:opacity-100"
        aria-label={t('messageActions')}
      >
        <MoreHorizontal size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
