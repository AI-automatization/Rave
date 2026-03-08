'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  FaCommentAlt, FaTimes, FaPaperPlane, FaSmile,
  FaMicrophone, FaMicrophoneSlash, FaPhone, FaPhoneSlash,
} from 'react-icons/fa';
import type { IChatMessage, IUser } from '@/types';
import type { UseVoiceChatReturn } from '@/hooks/useVoiceChat';

const QUICK_EMOJIS = ['😂', '❤️', '🔥', '👏', '😱', '😍', '💀', '🎬'];

// Twitch-style username color palette
const USERNAME_COLORS = [
  '#FF4040', '#FF7F50', '#9ACD32', '#00CED1', '#9370DB',
  '#FF69B4', '#00FA9A', '#FFD700', '#40E0D0', '#FF6347',
  '#7B68EE', '#3CB371', '#F08030', '#6890F0', '#78C850',
];

function getUserColor(id: string): string {
  let h = 0;
  for (const c of id) h = c.charCodeAt(0) + ((h << 5) - h);
  return USERNAME_COLORS[Math.abs(h) % USERNAME_COLORS.length];
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  bottom: number;
  right: number;
}

interface FullscreenOverlayProps {
  messages: IChatMessage[];
  members: IUser[];
  currentUserId?: string;
  ownerId?: string;
  voice: UseVoiceChatReturn;
  emojiCooldown: number;
  floatingEmojis?: FloatingEmoji[];
  onSendMessage: (text: string) => void;
  onSendEmoji: (emoji: string) => void;
}

export function FullscreenOverlay({
  messages,
  members,
  currentUserId,
  ownerId,
  voice,
  emojiCooldown,
  floatingEmojis = [],
  onSendMessage,
  onSendEmoji,
}: FullscreenOverlayProps) {
  const [open, setOpen]           = useState(true);
  const [input, setInput]         = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getUser = (id: string) => members.find((m) => m._id === id);

  return (
    <>
      {/* ── Floating emojis (in the video area, left of panel) ── */}
      {floatingEmojis.map(({ id, emoji, bottom, right }) => (
        <div
          key={id}
          className="absolute text-4xl select-none pointer-events-none z-30"
          style={{
            bottom: `${bottom}%`,
            right: open ? `calc(${right}% + 280px)` : `${right}%`,
            animation: 'floatUp 3s ease-out forwards',
            transition: 'right 0.3s ease',
          }}
        >
          {emoji}
        </div>
      ))}

      {/* ── Toggle button ─────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Chatni yopish' : 'Chatni ochish'}
        className="absolute top-4 right-4 z-50 flex items-center justify-center w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/80 transition-all border border-white/10"
      >
        {open ? <FaTimes size={13} /> : <FaCommentAlt size={13} />}
      </button>

      {/* ── Right panel ───────────────────────────────────────── */}
      <div
        className={`absolute top-0 right-0 h-full w-[280px] flex flex-col transition-transform duration-300 z-40 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.72) 100%)' }}
      >
        {/* ── Voice section ─────────────────────────────────── */}
        <div className="shrink-0 px-3 py-2.5 border-b border-white/[0.08]">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${voice.isInVoice ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ovozli chat
              </span>
              {voice.voiceMembers.length > 0 && (
                <span className="text-[10px] text-slate-500">· {voice.voiceMembers.length}</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {voice.isInVoice ? (
                <>
                  <button
                    onClick={voice.toggleMute}
                    title={voice.isMuted ? 'Mikrofonni yoqish' : 'Mikrofonni o\'chirish'}
                    className={`flex items-center justify-center w-6 h-6 rounded-md transition-all ${
                      voice.isMuted
                        ? 'bg-red-500/25 text-red-400 hover:bg-red-500/35'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {voice.isMuted ? <FaMicrophoneSlash size={10} /> : <FaMicrophone size={10} />}
                  </button>
                  <button
                    onClick={voice.leaveVoice}
                    title="Ovozli chatdan chiqish"
                    className="flex items-center justify-center w-6 h-6 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                  >
                    <FaPhoneSlash size={10} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { void voice.joinVoice(); }}
                  className="flex items-center gap-1 h-6 px-2 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all text-[10px] font-semibold"
                >
                  <FaPhone size={8} />
                  Qo&apos;shilish
                </button>
              )}
            </div>
          </div>

          {/* Voice members — compact avatars with speaking ring */}
          {voice.voiceMembers.length === 0 ? (
            <p className="text-[10px] text-slate-600 text-center pb-0.5">
              Hech kim ovozda yo&apos;q
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {voice.voiceMembers.map((uid) => {
                const u = getUser(uid);
                const speaking = voice.speakingUsers.includes(uid);
                const isMe = uid === currentUserId;

                return (
                  <div key={uid} className="flex flex-col items-center gap-0.5">
                    <div
                      className={`relative rounded-full transition-all duration-150 ${
                        speaking
                          ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black/80 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                          : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                        {u?.avatar ? (
                          <Image src={u.avatar} alt={u.username} width={32} height={32} className="object-cover" unoptimized />
                        ) : (
                          <span className="text-xs font-bold text-slate-300">
                            {(u?.username ?? uid)[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Muted badge */}
                      {isMe && voice.isInVoice && voice.isMuted && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center border border-black/80">
                          <FaMicrophoneSlash size={6} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[8px] font-medium truncate max-w-[36px] ${isMe ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {isMe ? 'Siz' : (u?.username ?? uid.slice(0, 4))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Viewers count ─────────────────────────────────── */}
        <div className="px-3 py-1.5 border-b border-white/[0.06] shrink-0">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
            {members.length} tomoshabin
          </span>
        </div>

        {/* ── Chat messages — Twitch style ───────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-[3px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {messages.length === 0 ? (
            <p className="text-center text-slate-600 text-[11px] mt-6">Hali xabar yo&apos;q</p>
          ) : (
            messages.map((msg) => {
              const isOwn  = msg.user._id === currentUserId;
              const isHost = msg.user._id === ownerId;
              const color  = getUserColor(msg.user._id);

              return (
                <div
                  key={msg.id}
                  className="text-[13px] leading-snug break-words"
                  style={{ animation: 'fadeSlideIn 0.15s ease-out' }}
                >
                  <span
                    className="font-bold mr-1 hover:underline cursor-default"
                    style={{ color }}
                  >
                    {isOwn ? 'Siz' : msg.user.username}
                  </span>
                  {isHost && !isOwn && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded mr-1 font-semibold align-middle">
                      👑
                    </span>
                  )}
                  <span className="text-white/20 mr-1">:</span>
                  <span className="text-white/90">{msg.text}</span>
                  <span className="text-[9px] text-white/20 ml-1 align-middle">{formatTime(msg.timestamp)}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick emoji picker ─────────────────────────────── */}
        {showEmoji && (
          <div className="flex flex-wrap gap-1 px-3 py-2 border-t border-white/[0.06] bg-black/30">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  if (emojiCooldown > 0) return;
                  onSendEmoji(emoji);
                  setShowEmoji(false);
                }}
                disabled={emojiCooldown > 0}
                className={`w-7 h-7 rounded-lg text-base transition-all ${
                  emojiCooldown > 0
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-white/10 active:scale-90'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 px-2.5 py-2.5 border-t border-white/[0.08] shrink-0 bg-black/40">
          <button
            onClick={() => emojiCooldown === 0 && setShowEmoji((v) => !v)}
            disabled={emojiCooldown > 0}
            className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
              emojiCooldown > 0
                ? 'text-slate-700 cursor-not-allowed'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            {emojiCooldown > 0 ? (
              <span className="text-[10px] font-bold">{emojiCooldown}s</span>
            ) : (
              <FaSmile size={14} />
            )}
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Xabar yozing..."
            maxLength={500}
            className="flex-1 h-7 px-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/25 text-[13px] focus:outline-none focus:border-white/25 focus:bg-white/[0.12] transition-all"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-[#5865f2] text-white hover:bg-[#4752c4] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaPaperPlane size={11} />
          </button>
        </div>
      </div>
    </>
  );
}
