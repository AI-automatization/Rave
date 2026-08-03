'use client';

import { useTranslations } from 'next-intl';
import { trackClick } from '@/lib/analytics';

const EMOJIS = ['❤️', '🔥', '😂', '😮', '👏', '🎉'];

interface Props {
  onSend: (emoji: string) => void;
  /** Seconds remaining in a server-driven burst lockout (0 = picker enabled). Backend allows
   * at most 20 reactions per rolling 60s window per user per room — past that it stops
   * broadcasting and tells the sender how long to wait instead of silently dropping taps. */
  cooldownSec?: number;
}

export function EmojiReactions({ onSend, cooldownSec = 0 }: Props) {
  // Reuses `chat.cooldown` (existing "Wait {seconds}s" key, was defined but never wired up to any
  // UI) instead of adding a near-duplicate `party.*` key — same "wait N seconds" meaning, and it's
  // already translated for all three locales (ru/en/uz).
  const tChat = useTranslations('chat');
  const isCoolingDown = cooldownSec > 0;
  return (
    <div className="relative flex items-center gap-1 px-4 py-2 border-t border-white/[0.04]">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          disabled={isCoolingDown}
          onClick={() => { trackClick('room:emoji_reaction', { emoji }); onSend(emoji); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all duration-100 hover:scale-[1.15] active:scale-90 cursor-pointer disabled:opacity-25 disabled:pointer-events-none disabled:scale-100"
        >
          {emoji}
        </button>
      ))}
      {isCoolingDown && (
        <span className="absolute right-4 text-[11px] font-medium text-white/50 tabular-nums">
          {tChat('cooldown', { seconds: cooldownSec })}
        </span>
      )}
    </div>
  );
}
