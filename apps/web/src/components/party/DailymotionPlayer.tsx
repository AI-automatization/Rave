'use client';

// WeWatch Web — Dailymotion embed (official geo.dailymotion.com/player.html widget).
//
// NOT SYNCED (2026-07-19, two independent fix attempts both failed to control the iframe):
//   1. Confirmed live (real browser, not headless) that the iframe sends no usable state
//      postMessage — only an internal `pes_listen_eid` analytics ping, never `apiready`/
//      `playing`/`pause`/`seeked`. Detecting the owner's actions from iframe events is a dead end.
//   2. Rebuilt as owner-driven one-way control instead: sendCmd({command, parameters:[...]}) —
//      the exact shape read from Dailymotion's own shipped dmp.photon_boot.js bundle — fired
//      directly from a custom play/pause/seek bar, no round-trip expected. Confirmed live this
//      also does nothing: the buttons don't affect the iframe at all, on either the owner's or
//      viewer's side. The live player (whatever engine actually runs behind player.html today)
//      evidently uses a different internal channel than the one found in that bundle, and further
//      guessing from minified source without real devtools access has a poor cost/benefit ratio.
// Each viewer gets their own independent, fully-interactive copy — same conclusion as VKPlayer.tsx.

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Info, Loader2 } from 'lucide-react';

interface Props {
  videoId: string;
}

export function DailymotionPlayer({ videoId }: Props) {
  const t = useTranslations('party');
  const [ready, setReady] = useState(false);
  // Message KEY, not text — see VKPlayer.tsx for the rationale.
  const [error, setError] = useState<string | null>(null);

  function handleLoad() {
    setError(null);
    setReady(true);
  }

  function handleError() {
    setError('playerEmbedBlocked');
  }

  if (error) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-slate-300 text-sm font-medium">{t('playerLoadFailed')}</p>
        <p className="text-slate-500 text-xs">{t(error)}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        src={`https://geo.dailymotion.com/player.html?video=${videoId}&autoplay=0&controls=1&api=postMessage`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
      />
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-slate-300 bg-black/60 backdrop-blur-sm">
        <Info size={11} className="text-amber-400 shrink-0" />
        {t('playerNotSynced', { platform: 'Dailymotion' })}
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  );
}
