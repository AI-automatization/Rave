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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <MessageCircle size={18} className="text-violet-400/70" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-medium">{t('empty')}</p>
              <p className="text-zinc-600 text-[11px] mt-0.5">{t('emptyHint')}</p>
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
              className="group flex items-start gap-3 px-2 py-2 hover:bg-white/[0.03] rounded-lg transition-colors touch-pan-y"
            >
              <button
                type="button"
                onClick={() => onOpenProfile?.(msg.user._id)}
                disabled={!clickable}
                aria-label={name}
                className={`shrink-0 rounded-full ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL, not worth a next/image domain allowlist entry
                  <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                    style={{ background: color }}
                  >
                    {(msg.user.username?.[0] ?? '?').toUpperCase()}
                  </div>
                )}
              </button>

              <div className="min-w-0 flex-1">
                {msg.replyTo && (
                  <div className="flex items-stretch gap-1.5 mb-1 max-w-full">
                    <div className="w-[2px] rounded-full shrink-0" style={{ backgroundColor: '#7B72F8' }} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate" style={{ color: '#9C93FF' }}>
                        {msg.replyTo.senderName}
                      </p>
                      <p className="text-[10px] text-white/40 truncate">{msg.replyTo.text}</p>
                    </div>
                  </div>
                )}
                {/* Name on its own line above the message — was inline "Name: message" (IRC
                    style), reads more like a real social chat this way. */}
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(msg.user._id)}
                  disabled={!clickable}
                  className={`block text-[12.5px] font-semibold leading-tight mb-0.5 ${clickable ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                  style={{ color }}
                >
                  {name}
                </button>
                <p className={`text-[13px] leading-snug break-words ${isMe ? 'text-white' : 'text-zinc-200'}`}>
                  {msg.text}
                </p>
              </div>

              {/* Hover-only. focus-within keeps it reachable by keyboard, where there is no hover. */}
              <button
                type="button"
                onClick={startReply}
                aria-label={t('reply')}
                title={t('reply')}
                className="shrink-0 mt-0.5 p-1.5 rounded-lg text-zinc-500 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <Reply size={13} />
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

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('placeholder')}
            maxLength={500}
            className="flex-1 h-9 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-zinc-400 bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
