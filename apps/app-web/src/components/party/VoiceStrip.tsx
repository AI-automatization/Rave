'use client';

import { Mic, MicOff, Loader2, PhoneOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { avatarColor } from '@/lib/utils';
import type { VoiceParticipant } from '@/hooks/use-voice-chat';

interface Props {
  isJoined: boolean;
  isMuted: boolean;
  isLoading: boolean;
  errorMsg: string | null;
  participants: VoiceParticipant[];
  onToggleMute: () => void;
  onLeave: () => void;
  onJoin: () => void;
}

export function VoiceStrip({
  isJoined, isMuted, isLoading, errorMsg, participants,
  onToggleMute, onLeave, onJoin,
}: Props) {
  const t = useTranslations('party');
  const members = useWatchPartyStore((s) => s.members);

  // Voice participants come back as bare user IDs (Redis set in voiceEvents.handler.ts) — the
  // display name/avatar has to be looked up in the member list use-watch-party already resolves.
  const named = participants.map((p) => {
    const member = members.find((m) => m._id === p.userId);
    return {
      ...p,
      username: member?.username || `#${p.userId.slice(-4)}`,
      avatar: member?.avatar,
    };
  });

  if (errorMsg) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.07] bg-red-500/[0.06]">
        <p className="text-[11px] text-red-300/80 truncate">{errorMsg}</p>
        <button
          type="button"
          onClick={onJoin}
          className="shrink-0 text-[11px] text-zinc-300 hover:text-white px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] transition-colors cursor-pointer"
        >
          {t('voiceRetry')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.07]">
      {isLoading && <Loader2 size={13} className="animate-spin text-zinc-500 shrink-0" />}

      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
        {named.length === 0 && !isLoading && (
          <span className="text-[11px] text-zinc-600 truncate">{t('voiceEmpty')}</span>
        )}
        {named.map((p) => (
          <div
            key={p.userId}
            title={p.username}
            // The speaking ring is the only live feedback that the connection actually carries
            // audio, so it stays visible rather than being a subtle hover affordance.
            className={`relative shrink-0 rounded-full transition-shadow ${
              p.isSpeaking ? 'ring-2 ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'ring-1 ring-white/10'
            }`}
          >
            {p.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL, not worth a next/image domain allowlist entry
              <img src={p.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: avatarColor(p.username) }}
              >
                {p.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mute is always reachable while in voice — on mobile it used to hide with the voice panel,
          which meant a user in the chat tab could not silence their own mic. */}
      <button
        type="button"
        onClick={onToggleMute}
        disabled={!isJoined}
        aria-label={isMuted ? t('voiceUnmute') : t('voiceMute')}
        title={isMuted ? t('voiceUnmute') : t('voiceMute')}
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer ${
          isMuted
            ? 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-white'
            : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
        }`}
      >
        {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
      </button>

      {isJoined && (
        <button
          type="button"
          onClick={onLeave}
          aria-label={t('voiceLeave')}
          title={t('voiceLeave')}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <PhoneOff size={13} />
        </button>
      )}
    </div>
  );
}
