'use client';

// WeWatch Web — VK Video embed (official video_ext.php widget).
//
// NOT SYNCED (T-S137 follow-up, 2026-07-19, confirmed by live test): unlike every other platform
// in this folder, VK's video_ext.php does not implement any postMessage control API at all — a
// standalone test iframe never emitted a single postMessage event (not even a bare "loaded"
// signal), and sending it {method:'play'} had no effect on playback. There is no owner→viewer
// channel to build sync on top of. Each viewer gets their own independent, fully-interactive copy
// of VK's native player instead of a synced one — this is a known, permanent limitation of VK's
// embed, not a bug to chase further. (The previous version of this file assumed a working
// protocol modeled after apps/mobile's buildVKVideoHtml() bridge; that assumption was never
// actually verified and turned out to be wrong for both.)
//
// Uses VK's own sanctioned embed widget instead of scraping the CDN URL server-side (the old path
// went through content-service's ytDlpExtractor with an authenticated VK session cookie — ToS-
// questionable, same category of risk as pirate-site extraction, just against a legitimate
// platform).

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Info, Loader2 } from 'lucide-react';

interface Props {
  ownerId: string;
  videoId: string;
}

export function VKPlayer({ ownerId, videoId }: Props) {
  const t = useTranslations('party');
  const [ready, setReady] = useState(false);
  // Holds a message KEY, not text — so the error follows the language switcher and effects
  // never need `t` in their dependency list.
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
        src={`https://vk.com/video_ext.php?oid=${ownerId}&id=${videoId}&hd=1&autoplay=1`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
      />
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-slate-300 bg-black/60 backdrop-blur-sm">
        <Info size={11} className="text-amber-400 shrink-0" />
        {t('playerNotSynced', { platform: 'VK' })}
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  );
}
