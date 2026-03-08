'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaPaperPlane, FaSmile, FaCrown } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import type { IChatMessage, IUser } from '@/types';

const QUICK_EMOJIS = ['😂', '❤️', '🔥', '👏', '😱', '😍', '💀', '🎬'];

interface ChatPanelProps {
  messages: IChatMessage[];
  members: IUser[];
  onSendMessage: (text: string) => void;
  onSendEmoji: (emoji: string) => void;
  currentUserId?: string;
  ownerId?: string;
  emojiCooldown?: number;
}

export function ChatPanel({
  messages,
  members,
  onSendMessage,
  onSendEmoji,
  currentUserId,
  ownerId,
  emojiCooldown = 0,
}: ChatPanelProps) {
  const t = useTranslations('chat');
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
    <div className="flex flex-col h-full bg-[#0f1117] rounded-2xl overflow-hidden border border-white/[0.06]">

      {/* ── Members (Telegram-style) ─────────────────────────────── */}
      <div className="shrink-0 border-b border-white/[0.06]">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            {t('watchingCount', { count: members.length })}
          </span>
        </div>

        {/* Member rows */}
        <ul className="max-h-[180px] overflow-y-auto">
          {members.map((m, idx) => {
            const isMe = m._id === currentUserId;
            const isRoomOwner = m._id === ownerId;
            return (
              <li
                key={m._id}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors ${idx < members.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                    {m.avatar ? (
                      <Image src={m.avatar} alt={m.username} width={36} height={36} className="object-cover" unoptimized />
                    ) : (
                      <span className="text-sm font-semibold text-slate-300">{m.username[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f1117]" />
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate leading-none ${isMe ? 'text-cyan-400' : 'text-slate-100'}`}>
                    {isMe ? 'Siz' : m.username}
                  </p>
                  {isRoomOwner && (
                    <p className="text-[10px] text-amber-400/80 mt-0.5 leading-none">Xona egasi</p>
                  )}
                </div>

                {/* Crown for owner */}
                {isRoomOwner && (
                  <FaCrown size={12} className="text-amber-400 shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Messages ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-slate-600 text-xs mt-8">
            {t('empty')}
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user._id === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                  {msg.user.avatar ? (
                    <Image src={msg.user.avatar} alt={msg.user.username} width={28} height={28} className="object-cover" unoptimized />
                  ) : (
                    <span className="text-xs font-bold text-slate-300">{msg.user.username[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className={`flex flex-col gap-0.5 max-w-[76%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="text-[10px] text-slate-500 px-1">{msg.user.username}</span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm break-words leading-relaxed ${
                      isOwn
                        ? 'bg-[#5865f2] text-white rounded-tr-sm'
                        : 'bg-[#1e2230] text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-600 px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Emoji picker ─────────────────────────────────────────── */}
      {showEmoji && (
        <div className="flex gap-1.5 px-3 py-2 border-t border-white/[0.06] flex-wrap bg-white/[0.02]">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className={`inline-flex items-center justify-center h-8 w-8 rounded-xl text-lg transition-all ${emojiCooldown > 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 active:scale-90'}`}
              onClick={() => {
                if (emojiCooldown > 0) return;
                onSendEmoji(emoji);
                setShowEmoji(false);
              }}
              disabled={emojiCooldown > 0}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-white/[0.06]">
        <button
          className={`inline-flex items-center justify-center h-8 w-8 rounded-xl transition-all shrink-0 ${emojiCooldown > 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'}`}
          onClick={() => emojiCooldown === 0 && setShowEmoji(!showEmoji)}
          title={emojiCooldown > 0 ? t('cooldown', { seconds: emojiCooldown }) : 'Emoji'}
          disabled={emojiCooldown > 0}
        >
          {emojiCooldown > 0 ? (
            <span className="text-xs font-bold">{emojiCooldown}s</span>
          ) : (
            <FaSmile size={16} />
          )}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          className="h-8 px-3 rounded-xl bg-[#1e2230] border border-white/[0.08] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#5865f2]/60 flex-1 text-sm"
          maxLength={500}
        />
        <button
          className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-[#5865f2] text-white hover:bg-[#4752c4] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <FaPaperPlane size={13} />
        </button>
      </div>
    </div>
  );
}
