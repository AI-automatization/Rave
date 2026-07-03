'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { useAuthStore } from '@/store/auth.store';

interface DmMessage {
  _id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface Props {
  messages: DmMessage[];
  onSend: (text: string) => void;
  peerName: string;
  peerId: string;
  onBack?: () => void;
}

const PALETTE = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];

function memberColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export function ChatWindow({ messages, onSend, peerName, peerId, onBack }: Props) {
  const t = useTranslations('dm');
  const currentUser = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const color = memberColor(peerId);
  const initial = peerName.slice(0, 1).toUpperCase();

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'transparent' }}>
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.07]"
        style={{ background: 'rgba(10,7,20,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05] cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Peer avatar */}
        <div
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {initial}
        </div>

        <span className="text-[16px] font-bold text-white flex-1 truncate">{peerName}</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 scrollbar-hide"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16">
            <p className="text-[15px] font-semibold text-white/28">{t('emptyTitle')}</p>
            <p className="text-[13px] text-white/18 text-center px-10">{t('emptySub')}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              text={msg.text}
              isMine={msg.senderId === currentUser?._id}
              time={formatTime(msg.createdAt)}
            />
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 px-4 pt-2.5 pb-3 border-t border-white/[0.07]"
        style={{ background: 'rgba(10,7,20,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          maxLength={2000}
          rows={1}
          className="glass-input flex-1 rounded-[22px] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/45 transition-all resize-none leading-5"
          style={{ maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-30"
          style={{
            backgroundColor: text.trim() ? '#7B72F8' : 'rgba(123,114,248,0.30)',
            boxShadow: text.trim() ? '0 0 12px rgba(123,114,248,0.55)' : 'none',
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
