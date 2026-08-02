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
    <div className="liquid-glass-sm mx-3 mt-3 p-2.5 flex flex-col gap-2.5">
      {/* Always-visible compact row — icon/label/count on the left, the one relevant action
          (Join, or Mute+Leave+expand-toggle) on the right. This alone answers "is voice live
          and how many people" without needing the avatar strip below to be open. */}
      <div className="flex items-center gap-2">
        <Radio
          size={13}
          className={`shrink-0 ${speakingCount > 0 ? 'text-emerald-400' : 'text-violet-300/70'}`}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-100/80 shrink-0">
          {t('voiceRoom')}
        </span>
        {named.length > 0 && (
          <span className="text-[11px] text-violet-300/50 shrink-0">· {named.length}</span>
        )}
        {isLoading && <Loader2 size={13} className="animate-spin text-violet-300/70 shrink-0" />}

        <div className="flex-1" />

        {named.length === 0 ? (
          <button
            type="button"
            onClick={onJoin}
            disabled={isLoading}
            className="shrink-0 h-7 px-3 rounded-lg text-[12px] font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-[0_0_16px_rgba(124,58,237,0.35)] transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
          >
            <Mic size={12} />
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
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0 ${
                forcedMuted
                  ? 'bg-red-500/[0.12] text-red-400'
                  : isMuted
                    ? 'bg-white/[0.08] text-zinc-400 hover:bg-white/[0.14] hover:text-white'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
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
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer shrink-0"
              >
                <PhoneOff size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setManuallyCollapsed((v) => !v)}
              aria-label={isExpanded ? t('voiceCollapse') : t('voiceExpand')}
              title={isExpanded ? t('voiceCollapse') : t('voiceExpand')}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
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
                      className="absolute -inset-1 rounded-full bg-emerald-400/30"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <div
                    className={`relative rounded-full transition-shadow ${
                      openControlsFor === p.userId
                        ? 'ring-2 ring-violet-400'
                        : p.isSpeaking
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
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.03]">
                <span className="text-[12px] text-zinc-300 font-medium truncate max-w-[80px] shrink-0">{target.username}</span>
                {!isSelf && (
                  <>
                    {target.volume > 0 ? <Volume2 size={13} className="text-zinc-500 shrink-0" /> : <VolumeX size={13} className="text-zinc-500 shrink-0" />}
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={target.volume}
                      onChange={(e) => onSetVolume(target.userId, parseFloat(e.target.value))}
                      className="flex-1 min-w-0 cursor-pointer"
                      style={{ accentColor: '#7c3aed', height: '3px' }}
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
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      target.mutedByHost
                        ? 'bg-red-500/[0.14] text-red-400 hover:bg-red-500/[0.22]'
                        : 'text-zinc-500 hover:text-white hover:bg-white/[0.08]'
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
