'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  onSend: (text: string) => void;
}

const AVATAR_COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#DB2777', '#0891B2'];

function avatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ChatPanel({ onSend }: Props) {
  const t = useTranslations('chat');
  const messages = useWatchPartyStore((s) => s.messages);
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
          <p className="text-zinc-600 text-[11px] text-center py-6">{t('empty')}</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.user._id === currentUser?._id;
          const color = avatarColor(msg.user.username ?? '?');

          return (
            <div key={msg.id} className="px-1 py-0.5 hover:bg-white/[0.03] rounded transition-colors">
              <span className="text-[12px] font-semibold" style={{ color }}>
                {msg.user.username ?? '?'}
              </span>
              <span className="text-[12px] text-zinc-400 mx-1">:</span>
              <span className={`text-[12px] break-words ${isMe ? 'text-white' : 'text-zinc-200'}`}>
                {msg.text}
              </span>
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
