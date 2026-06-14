'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  onSend: (text: string) => void;
}

export function ChatPanel({ onSend }: Props) {
  const t = useTranslations('chat');
  const messages = useWatchPartyStore((s) => s.messages);
  const currentUser = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
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
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-hide">
        {messages.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-4">{t('empty')}</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.user._id === currentUser?._id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-sm ${
                isMe
                  ? 'bg-violet-600/30 text-violet-100'
                  : 'bg-white/[0.06] text-slate-200'
              }`}>
                {!isMe && (
                  <p className="text-[10px] font-semibold text-violet-400 mb-0.5">{msg.user.username}</p>
                )}
                <p className="break-words">{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('placeholder')}
            maxLength={500}
            className="flex-1 h-9 bg-[#13121F] border border-[#2A2840] rounded-lg px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-white disabled:opacity-30 transition-opacity cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
