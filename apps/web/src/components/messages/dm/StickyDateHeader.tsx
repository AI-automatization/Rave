'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string | null;
  activityKey: number;
  onPress: () => void;
}

const HIDE_DELAY_MS = 1300;

// Floating date pill that hovers near the top of the chat while scrolling — port of mobile's
// StickyDateHeader.tsx. Unlike use-dm-viewport.ts (which only reports the current `label`),
// this component owns its own fade-in/fade-out timing, exactly mirroring the mobile split:
// the hook says *what* the label is, this component decides *when* to show/hide it. Every bump
// of `activityKey` (one per scroll event) re-shows the pill and resets the auto-hide timer.
export function StickyDateHeader({ label, activityKey, onPress }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!label) {
      setVisible(false);
      return;
    }

    setMounted(true);
    // Fade in on the next frame so the mount + opacity transition actually animates.
    const raf = requestAnimationFrame(() => setVisible(true));

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);

    return () => cancelAnimationFrame(raf);
    // activityKey bump == "scrolled again" == reset the idle-hide timer, even if label is
    // unchanged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label, activityKey]);

  // Unmount only after the fade-out transition finishes.
  useEffect(() => {
    if (visible || !mounted) return;
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [visible, mounted]);

  if (!label || !mounted) return null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-opacity duration-200"
      style={{ top: 12, opacity: visible ? 1 : 0 }}
    >
      <button
        type="button"
        onClick={onPress}
        className="pointer-events-auto cursor-pointer rounded-full border border-[var(--ww-line)] bg-[var(--ww-panel)] px-3 py-1 text-[11px] font-semibold text-[var(--ww-text-2)] backdrop-blur-md transition-colors hover:text-[var(--ww-text)]"
      >
        {label}
      </button>
    </div>
  );
}
