'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, MicOff, Loader2, PhoneOff, Radio, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { avatarColor } from '@/lib/utils';
import { trackClick } from '@/lib/analytics';
import type { VoiceParticipant } from '@/hooks/use-voice-chat';

interface Props {
  isJoined: boolean;
  isMuted: boolean;
  /** Owner force-muted this client — toggleMute is a no-op while true (see useVoiceChat). */
  forcedMuted: boolean;
  isLoading: boolean;
  errorMsg: string | null;
  participants: VoiceParticipant[];
  /** Whether the CURRENT VIEWER owns the room — gates the per-participant mute button
   * (kick/mute are moderation; volume below is local-only and available to everyone). */
  isOwner: boolean;
  onToggleMute: () => void;
  onLeave: () => void;
  onJoin: () => void;
  onSetVolume: (userId: string, volume: number) => void;
  onMuteMember: (targetUserId: string) => void;
  onUnmuteMember: (targetUserId: string) => void;
}

// Redesigned 2026-07-28 — was a 40px strip with 24px avatars and grey text, easy to miss entirely
// (real-user feedback: "не видно нормально голосовой чат"). Became a proper glass card with
// speaking state as visible motion.
//
// Redesigned again 2026-08-02 (UX pass) — that fix made it *always* full-height, which then read
// as too heavy competing with chat/video for attention. Doesn't reopen the visibility bug: when
// nobody's in voice it's a single compact row (nothing to show anyway); the moment someone joins
// it defaults open (`manuallyCollapsed` starts false) so an active call is still impossible to
// miss — the user can then collapse it back down themselves via the chevron, staying compact
// without losing "I can't tell voice is live" the way the pre-07-28 version did.
export function VoiceStrip({
  isJoined, isMuted, forcedMuted, isLoading, errorMsg, participants, isOwner,
  onToggleMute, onLeave, onJoin, onSetVolume, onMuteMember, onUnmuteMember,
}: Props) {
  const t = useTranslations('party');
  const members = useWatchPartyStore((s) => s.members);
  const currentUser = useAuthStore((s) => s.user);
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false);
  // Which participant's volume slider + owner controls are open — one at a time, click again to
  // close. Kept separate from the avatar strip itself so the strip stays a simple horizontal
  // scroller and this detail row only appears when actually asked for.
  const [openControlsFor, setOpenControlsFor] = useState<string | null>(null);

  const named = participants.map((p) => {
    const member = members.find((m) => m._id === p.userId);
    return {
      ...p,
      username: member?.username || `#${p.userId.slice(-4)}`,
      avatar: member?.avatar,
    };
  });
  const speakingCount = named.filter((p) => p.isSpeaking).length;
  const isExpanded = named.length > 0 && !manuallyCollapsed;

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
      {/* Always-visible compact row — icon/label/count on the left, the one relevant action
          (Join, or Mute+Leave+expand-toggle) on the right. This alone answers "is voice live
          and how many people" without needing the avatar strip below to be open. */}
      <div className="flex items-center gap-2">
        <Radio
          size={13}
          aria-hidden="true"
          className={`shrink-0 ${speakingCount > 0 ? 'text-[var(--ww-online)]' : 'text-[var(--ww-accent-hi)]'}`}
        />
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ww-text-2)]">
          {t('voiceRoom')}
        </span>
        {named.length > 0 && (
          <span className="shrink-0 text-[11px] text-[var(--ww-text-4)]">· {named.length}</span>
        )}
        {isLoading && (
          <Loader2 size={13} aria-hidden="true" className="shrink-0 animate-spin text-[var(--ww-text-3)]" />
        )}

        <div className="flex-1" />

        {named.length === 0 ? (
          <button
            type="button"
            onClick={onJoin}
            disabled={isLoading}
            className="ww-btn-accent flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--ww-r-sm)] px-3 text-[12px] font-semibold disabled:opacity-40"
          >
            <Mic size={13} aria-hidden="true" />
            {t('voiceJoin')}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onToggleMute}
              disabled={!isJoined || forcedMuted}
              aria-label={forcedMuted ? t('mutedByHost') : isMuted ? t('voiceUnmute') : t('voiceMute')}
              title={forcedMuted ? t('mutedByHost') : isMuted ? t('voiceUnmute') : t('voiceMute')}
              className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] transition-colors disabled:opacity-40 ${
                forcedMuted
                  ? 'bg-[var(--ww-danger-soft)] text-[var(--ww-danger)]'
                  : isMuted
                    ? 'bg-[var(--ww-surface-2)] text-[var(--ww-text-3)] hover:bg-[var(--ww-surface-3)] hover:text-[var(--ww-text)]'
                    : 'bg-[rgba(61,220,132,0.16)] text-[var(--ww-online)] hover:bg-[rgba(61,220,132,0.26)]'
              }`}
            >
              {isMuted || forcedMuted ? <MicOff size={13} /> : <Mic size={13} />}
            </button>
            {isJoined && (
              <button
                type="button"
                onClick={onLeave}
                aria-label={t('voiceLeave')}
                title={t('voiceLeave')}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] text-[var(--ww-text-4)] transition-colors hover:bg-[var(--ww-danger-soft)] hover:text-[var(--ww-danger)]"
              >
                <PhoneOff size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setManuallyCollapsed((v) => !v)}
              aria-label={isExpanded ? t('voiceCollapse') : t('voiceExpand')}
              title={isExpanded ? t('voiceCollapse') : t('voiceExpand')}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] text-[var(--ww-text-4)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
            >
              <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </>
        )}
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide py-0.5">
            <AnimatePresence initial={false}>
              {named.map((p) => (
                <motion.button
                  key={p.userId}
                  type="button"
                  onClick={() => { trackClick('room:voice_open_controls', { targetUserId: p.userId }); setOpenControlsFor((v) => (v === p.userId ? null : p.userId)); }}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  title={p.username}
                  className="relative shrink-0 cursor-pointer"
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
                      openControlsFor === p.userId
                        ? 'ring-2 ring-[var(--ww-accent-hi)]'
                        : p.isSpeaking
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
                    {p.mutedByHost && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 ring-2 ring-[#15151f] flex items-center justify-center">
                        <MicOff size={9} className="text-white" />
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Per-participant details — volume slider (local-only, everyone gets this) + owner
              mute/kick-adjacent controls. One at a time, tucked under the strip rather than a
              popover, so it never gets clipped by the sidebar's own overflow-x-auto. */}
          {(() => {
            const target = named.find((p) => p.userId === openControlsFor);
            if (!target) return null;
            const isSelf = target.userId === currentUser?._id;
            return (
              <div className="flex items-center gap-2.5 rounded-[var(--ww-r-sm)] bg-[var(--ww-surface-1)] px-2 py-2">
                <span className="max-w-[80px] shrink-0 truncate text-[12px] font-medium text-[var(--ww-text-2)]">{target.username}</span>
                {!isSelf && (
                  <>
                    {target.volume > 0 ? <Volume2 size={13} className="shrink-0 text-[var(--ww-text-4)]" /> : <VolumeX size={13} className="shrink-0 text-[var(--ww-text-4)]" />}
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={target.volume}
                      onChange={(e) => onSetVolume(target.userId, parseFloat(e.target.value))}
                      className="min-w-0 flex-1 cursor-pointer accent-[var(--ww-accent-hi)]"
                      style={{ height: '3px' }}
                      aria-label={t('volume')}
                    />
                  </>
                )}
                {isOwner && !isSelf && (
                  <button
                    type="button"
                    onClick={() => {
                      trackClick('room:voice_toggle_member_mute', { targetUserId: target.userId, mute: !target.mutedByHost });
                      if (target.mutedByHost) onUnmuteMember(target.userId); else onMuteMember(target.userId);
                    }}
                    title={target.mutedByHost ? t('unmuteMic') : t('muteMic')}
                    className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] transition-colors ${
                      target.mutedByHost
                        ? 'bg-[var(--ww-danger-soft)] text-[var(--ww-danger)] hover:bg-[rgba(255,107,107,0.22)]'
                        : 'text-[var(--ww-text-4)] hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]'
                    }`}
                  >
                    {target.mutedByHost ? <MicOff size={13} /> : <Mic size={13} />}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
