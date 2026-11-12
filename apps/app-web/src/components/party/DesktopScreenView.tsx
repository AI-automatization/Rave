'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Shows the desktop screen share (see hooks/use-desktop-screen-share.ts). The owner sees their own
// capture muted — they already hear the VB window from their speakers; viewers hear the stream.
export function DesktopScreenView({ stream, muted, label }: { stream: MediaStream; muted: boolean; label: string }) {
  const t = useTranslations('party');
  const ref = useRef<HTMLVideoElement>(null);
  // The browser refused to start the sound on its own (autoplay policy): the picture plays muted and the viewer gets a
  // clear button to turn the sound on (one click is the gesture the browser waits for).
  const [needsSound, setNeedsSound] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    el.play().catch((e: unknown) => {
      // Only a real autoplay refusal mutes. An AbortError means this play() was cut short by a newer load (the effect ran
      // again — React dev runs it twice, a new stream replaced the old); muting then left viewers silent for good
      // although sound was allowed (measured 2026-11-12 in the Mac app: AbortError, then muted while sound was allowed).
      if (!(e instanceof DOMException) || e.name !== 'NotAllowedError' || muted) return;
      el.muted = true;
      setNeedsSound(true);
      void el.play().catch(() => {});
    });
    return () => { el.srcObject = null; };
  }, [stream, muted]);

  const turnSoundOn = () => {
    const el = ref.current;
    if (!el) return;
    el.muted = false;
    void el.play().catch(() => {});
    setNeedsSound(false);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[var(--ww-r-lg)] bg-black">
      <video ref={ref} autoPlay playsInline muted={muted} controls={!muted} className="h-full w-full object-contain" />
      <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">{label}</span>
      {needsSound && (
        <button
          type="button"
          onClick={turnSoundOn}
          data-testid="desktop-screen-unmute"
          className="ww-btn-accent absolute bottom-14 left-1/2 flex h-10 -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full px-4 text-[13px] font-medium shadow-lg"
        >
          <Volume2 size={16} aria-hidden="true" />
          {t('desktopVbUnmute')}
        </button>
      )}
    </div>
  );
}
