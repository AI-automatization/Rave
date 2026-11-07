'use client';

import { useEffect, useRef } from 'react';

// Shows the desktop screen share (see hooks/use-desktop-screen-share.ts). The owner sees their own
// capture muted — they already hear the VB window from their speakers; viewers hear the stream.
export function DesktopScreenView({ stream, muted, label }: { stream: MediaStream; muted: boolean; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    // Autoplay with sound can be refused before a user gesture — retry muted so the picture shows.
    el.play().catch(() => {
      el.muted = true;
      void el.play().catch(() => {});
    });
    return () => { el.srcObject = null; };
  }, [stream]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[var(--ww-r-lg)] bg-black">
      <video ref={ref} autoPlay playsInline muted={muted} controls={!muted} className="h-full w-full object-contain" />
      <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">{label}</span>
    </div>
  );
}
