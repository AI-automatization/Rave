'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Reply } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { ReplyPreviewBar } from '@/components/messages/dm/ReplyPreviewBar';
import { avatarColor } from '@/lib/utils';
import type { IChatReplyTo } from '@/types';

interface Props {
  onSend: (text: string, replyTo?: IChatReplyTo) => void;
  /** Wired by T-S163's UserProfileModal. Absent → avatars render but aren't clickable. */
  onOpenProfile?: (userId: string) => void;
}

// Horizontal drag past this many pixels arms the reply — same threshold mobile's DM swipe uses
// (apps/mobile/src/components/dm/MessageItem.tsx), so the gesture feels identical across platforms.
const SWIPE_REPLY_THRESHOLD_PX = 60;

export function ChatPanel({ onSend, onOpenProfile }: Props) {
  const t = useTranslations('chat');
  const messages = useWatchPartyStore((s) => s.messages);
  const members = useWatchPartyStore((s) => s.members);
  const currentUser = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<IChatReplyTo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, replyTo ?? undefined);
    setText('');
    setReplyTo(null);
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ww-line)] bg-[var(--ww-accent-soft)]">
              <MessageCircle size={18} aria-hidden="true" className="text-[var(--ww-accent-hi)]" />
            </span>
            <div>
              <p className="text-[12.5px] font-medium text-[var(--ww-text-2)]">{t('empty')}</p>
              <p className="mt-0.5 text-[11.5px] text-[var(--ww-text-4)]">{t('emptyHint')}</p>
            </div>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.user._id === currentUser?._id;
          const name = msg.user.username || `#${msg.user._id.slice(-4)}`;
          const color = avatarColor(msg.user.username ?? '?');
          // The socket payload carries the sender's avatar, but a watch-party running the
          // pre-T-S160 build omits it — fall back to the member list, which use-watch-party
          // resolves separately via GET /api/user/[id].
          const avatar = msg.user.avatar ?? members.find((m) => m._id === msg.user._id)?.avatar;
          const clickable = Boolean(onOpenProfile);

          const startReply = () => {
            setReplyTo({ id: msg.id, text: msg.text, senderName: name });
            inputRef.current?.focus();
          };

          return (
            // Swipe-to-reply: drag the whole row (not just the text) like the DM/mobile gesture.
            // dragSnapToOrigin springs it back, so a drag that doesn't reach the threshold simply
            // undoes itself. This is the first drag interaction in the web app — the hover Reply
            // button above stays for pointer users, who have no swipe.
            <motion.div
              key={msg.id}
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: SWIPE_REPLY_THRESHOLD_PX + 20 }}
              dragElastic={0.25}
              dragSnapToOrigin
              onDragEnd={(_, info) => { if (info.offset.x > SWIPE_REPLY_THRESHOLD_PX) startReply(); }}
              className="group flex touch-pan-y items-start gap-2 rounded-[var(--ww-r-sm)] px-1 py-1 transition-colors hover:bg-[var(--ww-surface-1)]"
            >
              <button
                type="button"
                onClick={() => onOpenProfile?.(msg.user._id)}
                disabled={!clickable}
                aria-label={name}
                className={`shrink-0 mt-[1px] rounded-full ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL, not worth a next/image domain allowlist entry
                  <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: color }}
                  >
                    {(msg.user.username?.[0] ?? '?').toUpperCase()}
                  </div>
                )}
              </button>

              <div className="min-w-0 flex-1">
                {msg.replyTo && (
                  <div className="mb-0.5 flex max-w-full items-stretch gap-1.5">
                    <span className="w-[2px] shrink-0 rounded-full bg-[var(--ww-accent-hi)]" />
                    <div className="min-w-0">
                      <p className="truncate text-[10.5px] font-bold text-[var(--ww-accent-hi)]">
                        {msg.replyTo.senderName}
                      </p>
                      <p className="truncate text-[10.5px] text-[var(--ww-text-3)]">
                        {msg.replyTo.text}
                      </p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(msg.user._id)}
                  disabled={!clickable}
                  className={`text-[12px] font-semibold align-baseline ${clickable ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                  style={{ color }}
                >
                  {name}
                </button>
                <span className="mx-1 text-[12.5px] text-[var(--ww-text-4)]">:</span>
                <span
                  className={`break-words text-[12.5px] leading-relaxed ${
                    isMe ? 'text-[var(--ww-text)]' : 'text-[var(--ww-text-2)]'
                  }`}
                >
                  {msg.text}
                </span>
              </div>

              {/* Hover-only so the compact IRC-style rows don't gain a permanent icon column.
                  focus-within keeps it reachable by keyboard, where there is no hover. */}
              <button
                type="button"
                onClick={startReply}
                aria-label={t('reply')}
                title={t('reply')}
                className="mt-[1px] shrink-0 cursor-pointer rounded-[var(--ww-r-sm)] p-1 text-[var(--ww-text-4)] opacity-0 transition-all hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)] focus:opacity-100 group-hover:opacity-100"
              >
                <Reply size={12} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {replyTo && (
        <ReplyPreviewBar
          senderName={replyTo.senderName}
          text={replyTo.text}
          onCancel={() => setReplyTo(null)}
        />
      )}

      {/* Yozish maydoni 36px edi — barmoq uchun kichik. `.ww-field` 48px
          beradi, yuborish tugmasi ham xuddi shu balandlikda (kvadrat). */}
      <form onSubmit={handleSubmit} className="border-t border-[var(--ww-line)] p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('placeholder')}
            maxLength={500}
            className="ww-field min-w-0 flex-1 px-3.5 text-[14px]"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label={t('send')}
            className="ww-btn-accent flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[var(--ww-r-md)] text-white disabled:cursor-not-allowed"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
