'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, Loader2, MonitorSmartphone } from 'lucide-react';
import { trackClick } from '@/lib/analytics';

interface Props {
  url: string;
  isOwner: boolean;
  /** Owner-only escape hatch: some pages allow framing but still render blank (cookie walls, JS
   * frame-busting) — the owner can re-open the same URL in the shared Virtual Browser. */
  onOpenInVirtualBrowser?: (url: string) => void;
}

// videoPlatform 'webview' (embed-check said the page allows framing, see RoomContent's link
// routing): the page is shown as a plain iframe straight from each viewer's own browser — no server
// resources, works on any phone. Not playback-synced: a cross-origin page exposes no control API,
// so every viewer drives their own copy (same as VKPlayer/DailymotionPlayer).
export function GenericIframePlayer({ url, isOwner, onOpenInVirtualBrowser }: Props) {
  const t = useTranslations('party');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [url]);
  // Banner for plain browsers only: the desktop app syncs these sites through its local VB (no
  // server VB since 2026-11-11, see lib/server-vb.ts). Read after mount — no hydration mismatch.
  const [inDesktopApp, setInDesktopApp] = useState(true);
  useEffect(() => { setInDesktopApp(!!window.wewatchDesktop); }, []);

  // Only http(s) is ever framed — a javascript:/data: URL in room.videoUrl must never reach src.
  let safeUrl: string | null = null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') safeUrl = parsed.toString();
  } catch {
    safeUrl = null;
  }

  return (
    <div className="flex flex-col gap-2">
      {!inDesktopApp && (
        <div className="flex items-center gap-2 rounded-[var(--ww-r-sm)] border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-[12px] leading-snug text-[var(--ww-text-2)]">
          <MonitorSmartphone size={15} className="shrink-0 text-violet-400" aria-hidden="true" />
          <span>{t('iframeSyncInApp')}</span>
        </div>
      )}
      {/* A web page, not a video: 16:9 on a phone is ~200px tall — unusable. Give it most of the
          screen there; keep the 16:9 box from sm up, where it matches the other players. */}
      <div className="relative h-[62svh] sm:h-auto sm:aspect-video bg-black rounded-xl overflow-hidden">
        {safeUrl && (
          <iframe
            key={safeUrl}
            src={safeUrl}
            title={t('iframeTitle')}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            // Sandbox is on deliberately even though it costs a little compatibility: this is an
            // arbitrary third-party page the owner pasted, shown to every member, and the one thing
            // it must not do is navigate or hijack the WeWatch tab itself (phishing). `allow-top-
            // navigation` is therefore omitted. Everything video sites actually need is granted
            // (scripts, same-origin so their own cookies/storage work, forms, popups for logins,
            // presentation, modals; popups stay sandboxed — no escape for ad pages). allow-scripts + allow-same-origin is only unsafe
            // for SAME-origin content; this frame is always cross-origin.
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
            onLoad={() => setLoaded(true)}
          />
        )}
        {!loaded && safeUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12] pointer-events-none">
            <Loader2 size={28} className="animate-spin text-violet-400" aria-label={t('iframeLoading')} />
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-2 px-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="min-w-0 flex-1 text-[11.5px] leading-snug text-[var(--ww-text-4)]">
          {t('iframeNotSynced')}
          {isOwner && onOpenInVirtualBrowser && <> {t('iframeBlankHint')}</>}
        </p>
        {isOwner && onOpenInVirtualBrowser && (
          <button
            type="button"
            onClick={() => { trackClick('video:iframe_open_vb'); onOpenInVirtualBrowser(url); }}
            className="ww-btn-subtle flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--ww-r-sm)] px-3 text-[12.5px] font-medium text-[var(--ww-text-2)] sm:h-9"
          >
            <Globe size={14} aria-hidden="true" />
            {t('iframeOpenVB')}
          </button>
        )}
      </div>
    </div>
  );
}
