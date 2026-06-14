'use client';

const EMOJIS = ['❤️', '🔥', '😂', '😮', '👏', '🎉'];

interface Props {
  onSend: (emoji: string) => void;
}

export function EmojiReactions({ onSend }: Props) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSend(emoji)}
          className="w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] transition-colors flex items-center justify-center text-base active:scale-90 cursor-pointer"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
