'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { avatarColor } from '@/lib/utils';

interface Props {
  onSend: (text: string) => void;
  /** Wired by T-S163's UserProfileModal. Absent → avatars render but aren't clickable. */
  onOpenProfile?: (userId: string) => void;
}

export function ChatPanel({ onSend, onOpenProfile }: Props) {
  const t = useTranslations('chat');
  const messages = useWatchPartyStore((s) => s.messages);
  const members = useWatchPartyStore((s) => s.members);
  const currentUser = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5 scrollbar-hide">
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

          return (
            <div key={msg.id} className="flex items-start gap-2 px-1 py-1 hover:bg-white/[0.03] rounded transition-colors">
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
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(msg.user._id)}
                  disabled={!clickable}
                  className={`text-[12px] font-semibold align-baseline ${clickable ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                  style={{ color }}
                >
                  {name}
                </button>
                <span className="text-[12px] text-zinc-400 mx-1">:</span>
                <span className={`text-[12px] break-words ${isMe ? 'text-white' : 'text-zinc-200'}`}>
                  {msg.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2">
          <input
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
