'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
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
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatWindow({ messages, onSend, peerName }: Props) {
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
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-white/[0.06]">
        <span className="text-sm font-semibold text-white">{peerName}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scrollbar-hide">
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            text={msg.text}
            isMine={msg.senderId === currentUser?._id}
            time={formatTime(msg.createdAt)}
          />
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Xabar yozing..."
            maxLength={1000}
            className="flex-1 h-10 bg-[#13121F] border border-[#2A2840] rounded-xl px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-white disabled:opacity-30 transition-opacity cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
