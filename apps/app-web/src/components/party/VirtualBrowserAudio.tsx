'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Volume2, VolumeX } from 'lucide-react';

// How far behind the live edge the audio may drift before we jump forward — the screencast frames
// are ~0.5s behind real time, so keep the sound close to that instead of piling up buffer.
const MAX_LAG_S = 1.2;
const LIVE_EDGE_S = 0.3;
const LAG_CHECK_MS = 2000;
const RECONNECT_MS = 1500;

/**
 * Sound for the virtual browser — the JPEG screencast carries none. Plays the server's live MP3
 * of the VB page (GET /vb-audio/:roomId, services/watch-party vbAudio.service.ts).
 */
export function VirtualBrowserAudio({ src }: { src: string }) {
  const t = useTranslations('party');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  // Autoplay with sound refused (no user gesture yet on this page) — show a tap-to-enable button.
  const [needsTap, setNeedsTap] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
    const lag = setInterval(() => {
      if (el.buffered.length === 0) return;
      const end = el.buffered.end(el.buffered.length - 1);
      if (end - el.currentTime > MAX_LAG_S) el.currentTime = end - LIVE_EDGE_S;
    }, LAG_CHECK_MS);
    let retry: ReturnType<typeof setTimeout> | null = null;
    const reconnect = () => {
      if (retry) return;
      retry = setTimeout(() => setAttempt((n) => n + 1), RECONNECT_MS);
    };
    el.addEventListener('error', reconnect);
    el.addEventListener('ended', reconnect);
    return () => {
      clearInterval(lag);
      if (retry) clearTimeout(retry);
      el.removeEventListener('error', reconnect);
      el.removeEventListener('ended', reconnect);
    };
  }, [src, attempt]);

  const enable = () => {
    const el = audioRef.current;
    if (!el) return;
    setMuted(false);
    el.muted = false;
    el.play().then(() => setNeedsTap(false)).catch(() => {});
  };

  return (
    <>
      {/* attempt in the query: a fresh request after a dropped stream, not a cached dead one */}
      <audio ref={audioRef} src={`${src}?r=${attempt}`} muted={muted} preload="none" />
      <button
        type="button"
        onClick={needsTap ? enable : () => setMuted((m) => !m)}
        aria-label={needsTap || muted ? t('vbSoundOn') : t('vbSoundOff')}
        className={`pointer-events-auto flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 text-[12px] font-medium text-white backdrop-blur-sm hover:bg-black/80 ${needsTap ? 'animate-pulse' : ''}`}
      >
        {needsTap || muted ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
        {needsTap && <span>{t('vbSoundOn')}</span>}
      </button>
    </>
  );
}
