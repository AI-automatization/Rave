'use client';

import { trackClick } from '@/lib/analytics';

const EMOJIS = ['❤️', '🔥', '😂', '😮', '👏', '🎉'];

interface Props {
  onSend: (emoji: string) => void;
}

export function EmojiReactions({ onSend }: Props) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-t border-white/[0.04]">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => { trackClick('room:emoji_reaction', { emoji }); onSend(emoji); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base transition-transform duration-100 hover:scale-[1.15] active:scale-90 cursor-pointer"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
