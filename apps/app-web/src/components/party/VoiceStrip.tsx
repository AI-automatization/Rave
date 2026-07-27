'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Mic, MicOff, Loader2, PhoneOff, Radio } from 'lucide-react';
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

// Redesigned 2026-07-28 — was a 40px strip with 24px avatars and grey text, easy to miss entirely
// (real-user feedback: "не видно нормально голосовой чат"). Now a proper glass card matching the
// room's existing `.liquid-glass` language (already used on /home, never applied here), with
// speaking state as visible motion — not just a static ring color swap — so a live call actually
// reads as alive at a glance instead of blending into the sidebar.
export function VoiceStrip({
  isJoined, isMuted, isLoading, errorMsg, participants,
  onToggleMute, onLeave, onJoin,
}: Props) {
  const t = useTranslations('party');
  const members = useWatchPartyStore((s) => s.members);

  const named = participants.map((p) => {
    const member = members.find((m) => m._id === p.userId);
    return {
      ...p,
      username: member?.username || `#${p.userId.slice(-4)}`,
      avatar: member?.avatar,
    };
  });
  const speakingCount = named.filter((p) => p.isSpeaking).length;

  if (errorMsg) {
    return (
      <div className="mx-3 mt-3 flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20">
        <p className="text-[12px] text-red-300/90 truncate">{errorMsg}</p>
        <button
          type="button"
          onClick={onJoin}
          className="shrink-0 text-[11px] font-medium text-white px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] transition-colors cursor-pointer"
        >
          {t('voiceRetry')}
        </button>
      </div>
    );
  }

  return (
    <div className="liquid-glass-sm mx-3 mt-3 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio
            size={13}
            className={speakingCount > 0 ? 'text-emerald-400' : 'text-violet-300/70'}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-100/80">
            {t('voiceRoom')}
          </span>
          {named.length > 0 && (
            <span className="text-[11px] text-violet-300/50">· {named.length}</span>
          )}
        </div>
        {isLoading && <Loader2 size={13} className="animate-spin text-violet-300/70" />}
      </div>

      {named.length === 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-zinc-500">{t('voiceEmpty')}</p>
          <button
            type="button"
            onClick={onJoin}
            disabled={isLoading}
            className="shrink-0 h-8 px-3.5 rounded-lg text-[12px] font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-[0_0_16px_rgba(124,58,237,0.35)] transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
          >
            <Mic size={13} />
            {t('voiceJoin')}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide py-0.5">
            <AnimatePresence initial={false}>
              {named.map((p) => (
                <motion.div
                  key={p.userId}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  title={p.username}
                  className="relative shrink-0"
                >
                  {/* Speaking ring is real motion, not a static color swap — a pulse that scales
                      with the ring itself is the only cue that audio is actually flowing. */}
                  {p.isSpeaking && (
                    <motion.span
                      className="absolute -inset-1 rounded-full bg-emerald-400/30"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <div
                    className={`relative rounded-full transition-shadow ${
                      p.isSpeaking
                        ? 'ring-2 ring-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]'
                        : 'ring-1 ring-white/15'
                    }`}
                  >
                    {p.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL, not worth a next/image domain allowlist entry
                      <img src={p.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                        style={{ background: avatarColor(p.username) }}
                      >
                        {p.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleMute}
              disabled={!isJoined}
              aria-label={isMuted ? t('voiceUnmute') : t('voiceMute')}
              title={isMuted ? t('voiceUnmute') : t('voiceMute')}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer ${
                isMuted
                  ? 'bg-white/[0.08] text-zinc-400 hover:bg-white/[0.14] hover:text-white'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
            </button>

            {isJoined && (
              <button
                type="button"
                onClick={onLeave}
                aria-label={t('voiceLeave')}
                title={t('voiceLeave')}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
              >
                <PhoneOff size={15} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
