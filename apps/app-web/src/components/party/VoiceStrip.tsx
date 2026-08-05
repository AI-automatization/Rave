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
      <div className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-[var(--ww-r-md)] border border-[var(--ww-danger-line)] bg-[var(--ww-danger-soft)] px-3 py-2.5">
        <p className="truncate text-[12px] text-[var(--ww-danger)]" role="alert">{errorMsg}</p>
        <button
          type="button"
          onClick={onJoin}
          className="ww-btn-subtle shrink-0 cursor-pointer rounded-[var(--ww-r-sm)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--ww-text)]"
        >
          {t('voiceRetry')}
        </button>
      </div>
    );
  }

  return (
    <div className="ww-card mx-3 mt-3 flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio
            size={13}
            aria-hidden="true"
            className={speakingCount > 0 ? 'text-[var(--ww-online)]' : 'text-[var(--ww-accent-hi)]'}
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ww-text-2)]">
            {t('voiceRoom')}
          </span>
          {named.length > 0 && (
            <span className="text-[11px] text-[var(--ww-text-4)]">· {named.length}</span>
          )}
        </div>
        {isLoading && (
          <Loader2 size={13} aria-hidden="true" className="animate-spin text-[var(--ww-text-3)]" />
        )}
      </div>

      {named.length === 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-[var(--ww-text-3)]">{t('voiceEmpty')}</p>
          <button
            type="button"
            onClick={onJoin}
            disabled={isLoading}
            className="ww-btn-accent flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--ww-r-sm)] px-3.5 text-[12.5px] font-semibold text-white"
          >
            <Mic size={14} aria-hidden="true" />
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
                      className="absolute -inset-1 rounded-full bg-[rgba(61,220,132,0.30)]"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <div
                    className={`relative rounded-full transition-shadow ${
                      p.isSpeaking
                        ? 'shadow-[0_0_10px_rgba(61,220,132,0.55)] ring-2 ring-[var(--ww-online)]'
                        : 'ring-1 ring-[var(--ww-line-strong)]'
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
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] transition-colors disabled:opacity-30 ${
                isMuted
                  ? 'bg-[var(--ww-surface-2)] text-[var(--ww-text-3)] hover:bg-[var(--ww-surface-3)] hover:text-[var(--ww-text)]'
                  : 'bg-[rgba(61,220,132,0.16)] text-[var(--ww-online)] hover:bg-[rgba(61,220,132,0.26)]'
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
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] text-[var(--ww-text-4)] transition-colors hover:bg-[var(--ww-danger-soft)] hover:text-[var(--ww-danger)]"
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
