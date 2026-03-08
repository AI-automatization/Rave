'use client';

import Image from 'next/image';
import { FaMicrophone, FaMicrophoneSlash, FaPhone, FaPhoneSlash } from 'react-icons/fa';
import type { IUser } from '@/types';

interface VoicePanelProps {
  voiceMembers: string[];      // user IDs in voice
  speakingUsers: string[];     // user IDs currently speaking
  members: IUser[];            // full user objects (for avatars)
  isInVoice: boolean;
  isMuted: boolean;
  currentUserId?: string;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  compact?: boolean;           // compact mode for fullscreen overlay
}

export function VoicePanel({
  voiceMembers,
  speakingUsers,
  members,
  isInVoice,
  isMuted,
  currentUserId,
  onJoin,
  onLeave,
  onToggleMute,
  compact = false,
}: VoicePanelProps) {
  const getUser = (id: string) => members.find((m) => m._id === id);

  return (
    <div className={`${compact ? 'p-2' : 'px-4 py-3'} border-b border-white/[0.06]`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isInVoice ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Ovozli chat
          </span>
          {voiceMembers.length > 0 && (
            <span className="text-[10px] text-slate-500">· {voiceMembers.length}</span>
          )}
        </div>

        {/* Join / Leave button */}
        {isInVoice ? (
          <div className="flex items-center gap-1">
            {/* Mute toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Mikrofonni yoqish' : 'Mikrofonni o\'chirish'}
              className={`inline-flex items-center justify-center w-6 h-6 rounded-lg transition-all ${
                isMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              {isMuted ? <FaMicrophoneSlash size={11} /> : <FaMicrophone size={11} />}
            </button>
            {/* Leave */}
            <button
              onClick={onLeave}
              title="Ovozli chatdan chiqish"
              className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <FaPhoneSlash size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={onJoin}
            title="Ovozli chatga qo'shilish"
            className="inline-flex items-center gap-1 h-6 px-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all text-[10px] font-semibold"
          >
            <FaPhone size={9} />
            Qo&apos;shilish
          </button>
        )}
      </div>

      {/* Voice members */}
      {voiceMembers.length === 0 ? (
        <p className="text-[11px] text-slate-600 text-center py-1">
          Hech kim ovozda yo&apos;q
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {voiceMembers.map((uid) => {
            const u = getUser(uid);
            const speaking = speakingUsers.includes(uid);
            const isMe = uid === currentUserId;

            return (
              <div key={uid} className="flex flex-col items-center gap-1">
                {/* Avatar with speaking ring */}
                <div className={`relative rounded-full transition-all ${
                  speaking ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0f1117]' : ''
                }`}>
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                    {u?.avatar ? (
                      <Image src={u.avatar} alt={u.username} width={36} height={36} className="object-cover" unoptimized />
                    ) : (
                      <span className="text-sm font-semibold text-slate-300">
                        {(u?.username ?? uid)[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Muted indicator */}
                  {isMe && isInVoice && isMuted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border-2 border-[#0f1117]">
                      <FaMicrophoneSlash size={7} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className={`text-[9px] font-medium truncate max-w-[40px] ${isMe ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {isMe ? 'Siz' : (u?.username ?? uid.slice(0, 5))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
