'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface FloatingReaction {
  id: string;
  emoji: string;
  userId: string;
  username?: string;
  avatar?: string;
}

interface Props {
  reactions: FloatingReaction[];
}

// A few fixed horizontal lanes so simultaneous reactions from different people don't all stack
// on the exact same column — cheap pseudo-randomness keyed off the reaction id, not real state.
const LANES = [12, 32, 52, 68, 84];
function laneFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return LANES[Math.abs(h) % LANES.length];
}

// Renders taps from EmojiReactions floating up over the video and fading out — previously
// sendEmoji() had no listener at all on this client, so reactions were invisible to everyone
// including the sender. Absolutely positioned over the video container (parent needs
// `relative`), pointer-events-none so it never blocks video/VB interaction underneath.
export function ReactionOverlay({ reactions }: Props) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            className="absolute bottom-2 flex flex-col items-center gap-0.5 select-none"
            style={{ left: `${laneFor(r.id)}%` }}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: shouldReduceMotion ? 0 : -160, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, ease: 'easeOut' }}
          >
            <span className="text-3xl leading-none">{r.emoji}</span>
            {r.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- tiny ephemeral overlay avatar, not worth next/image's layout machinery
              <img src={r.avatar} alt="" className="w-4 h-4 rounded-full object-cover ring-1 ring-white/40" />
            ) : r.username ? (
              <span className="w-4 h-4 rounded-full bg-violet-500/80 ring-1 ring-white/40 flex items-center justify-center text-[8px] font-semibold text-white leading-none">
                {r.username.charAt(0).toUpperCase()}
              </span>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
