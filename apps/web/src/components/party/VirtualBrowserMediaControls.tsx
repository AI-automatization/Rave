'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pause, Play } from 'lucide-react';
import type { VBMediaState } from '@/hooks/use-virtual-browser';

// The server reports the VB movie's time once a second (VB_MEDIA_STATE) — tick the shown time
// locally in between so the bar moves smoothly instead of jumping.
const LOCAL_TICK_MS = 250;
// After the owner drags the bar, ignore server ticks this long so the thumb doesn't jump back to
// the pre-seek time before the VB has actually seeked.
const SEEK_SETTLE_MS = 1500;
// How long a clicked play/pause wins over the server's report before we trust the server again.
const PLAY_SETTLE_MS = 3000;

function formatTime(totalS: number): string {
  const s = Math.max(0, Math.floor(totalS));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

interface Props {
  state: VBMediaState;
  isOwner: boolean;
  /** Same fade class as the rest of the VB overlay (hidden after the mouse rests). */
  fadeCls: string;
  onControl: (action: 'play' | 'pause' | 'seek', time?: number) => void;
}

/**
 * WeWatch's own controls for the movie inside the virtual browser. The VB page maximizes the
 * movie's <video> over the site's player (watch-party vbFullscreen.script.ts), so this is the
 * only control bar on screen: a big centered play button while paused, and a bottom bar with
 * play/pause, seek and time. Members see it read-only.
 */
export function VirtualBrowserMediaControls({ state, isOwner, fadeCls, onControl }: Props) {
  const t = useTranslations('party');
  const [shownTime, setShownTime] = useState(state.currentTime);
  const seekUntilRef = useRef(0);
  // Play/pause shows the new state at once instead of waiting for the server's next 1s report —
  // waiting made a second click look necessary and it toggled the movie straight back.
  const [pausedOverride, setPausedOverride] = useState<boolean | null>(null);
  const overrideUntilRef = useRef(0);
  useEffect(() => {
    if (pausedOverride === null) return;
    if (state.paused === pausedOverride) { setPausedOverride(null); return; }
    const timer = setTimeout(() => setPausedOverride(null), Math.max(0, overrideUntilRef.current - Date.now()));
    return () => clearTimeout(timer);
  }, [state.paused, pausedOverride]);
  const paused = pausedOverride ?? state.paused;

  useEffect(() => {
    if (Date.now() < seekUntilRef.current) return;
    setShownTime(state.currentTime);
  }, [state.currentTime]);


  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setShownTime((v) => v + LOCAL_TICK_MS / 1000), LOCAL_TICK_MS);
    return () => clearInterval(timer);
  }, [paused, state.currentTime]);

  const duration = state.duration ?? 0;
  const togglePlay = () => {
    overrideUntilRef.current = Date.now() + PLAY_SETTLE_MS;
    setPausedOverride(!paused);
    onControl(paused ? 'play' : 'pause');
  };
  const seek = (time: number) => {
    seekUntilRef.current = Date.now() + SEEK_SETTLE_MS;
    setShownTime(time);
    onControl('seek', time);
  };
  const progress = duration ? Math.min(100, (shownTime / duration) * 100) : 0;

  return (
    <>
      {paused && (
        <button
          type="button"
          onClick={togglePlay}
          disabled={!isOwner}
          aria-label={t('playerPlay')}
          className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-violet-600/90 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-default disabled:hover:scale-100"
        >
          <Play size={28} fill="currentColor" className="ml-1" />
        </button>
      )}
      <div className={`absolute inset-x-0 bottom-0 z-10 transition-opacity duration-300 ${fadeCls}`}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div
          className="relative px-4 pt-8"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {duration > 0 && (
            <input
              type="range"
              min={0}
              max={duration}
              step={0.5}
              value={Math.min(shownTime, duration)}
              onChange={(e) => seek(Number(e.target.value))}
              disabled={!isOwner}
              aria-label={t('playerProgress')}
              className="mb-2 block w-full cursor-pointer disabled:cursor-default"
              style={{
                accentColor: '#7c3aed',
                height: '3px',
                appearance: 'none',
                background: `linear-gradient(to right, #7c3aed ${progress}%, rgba(255,255,255,0.2) 0%)`,
                borderRadius: '2px',
              }}
            />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!isOwner}
              aria-label={paused ? t('playerPlay') : t('playerPause')}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white transition-all hover:bg-white/10 active:scale-90 disabled:cursor-default disabled:hover:bg-transparent"
            >
              {paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
            </button>
            <span className="text-xs tabular-nums text-white/80">
              {formatTime(shownTime)}{duration > 0 && ` / ${formatTime(duration)}`}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
