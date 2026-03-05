'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaPaperPlane, FaSmile } from 'react-icons/fa';
import type { IChatMessage, IUser } from '@/types';

const QUICK_EMOJIS = ['😂', '❤️', '🔥', '👏', '😱', '😍', '💀', '🎬'];

interface ChatPanelProps {
  messages: IChatMessage[];
  members: IUser[];
  onSendMessage: (text: string) => void;
  onSendEmoji: (emoji: string) => void;
  currentUserId?: string;
}

export function ChatPanel({
  messages,
  members,
  onSendMessage,
  onSendEmoji,
  currentUserId,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-base-200 rounded-xl overflow-hidden">
      {/* Members */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-base-300 overflow-x-auto">
        <span className="text-xs text-base-content/50 shrink-0">
          {members.length} nafar
        </span>
        {members.map((m) => (
          <div key={m._id} className="flex items-center gap-1 shrink-0">
            <div className="avatar">
              <div className="w-6 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                {m.avatar ? (
                  <Image src={m.avatar} alt={m.username} width={24} height={24} className="object-cover" unoptimized />
                ) : (
                  <div className="bg-primary text-primary-content flex items-center justify-center text-xs">
                    {m.username[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-base-content/40 text-sm mt-8">
            Hali xabar yo&apos;q
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user._id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="avatar shrink-0">
                  <div className="w-7 rounded-full">
                    {msg.user.avatar ? (
                      <Image src={msg.user.avatar} alt={msg.user.username} width={28} height={28} className="object-cover" unoptimized />
                    ) : (
                      <div className="bg-primary text-primary-content flex items-center justify-center text-xs">
                        {msg.user.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="text-xs text-base-content/50">{msg.user.username}</span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm break-words ${
                      isOwn
                        ? 'bg-primary text-primary-content rounded-tr-sm'
                        : 'bg-base-300 text-base-content rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-xs text-base-content/30">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="flex gap-2 px-3 py-2 border-t border-slate-700 flex-wrap bg-slate-700/30">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="inline-flex items-center justify-center h-7 px-2 rounded-lg text-lg text-slate-300 hover:bg-slate-700/50 transition-all"
              onClick={() => {
                onSendEmoji(emoji);
                setShowEmoji(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-700">
        <button
          className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
          onClick={() => setShowEmoji(!showEmoji)}
          aria-label="Emoji"
        >
          <FaSmile size={16} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Xabar yozing..."
          className="h-7 px-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 flex-1 text-sm"
          maxLength={500}
        />
        <button
          className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label="Yuborish"
        >
          <FaPaperPlane size={14} />
        </button>
      </div>
    </div>
  );
}
