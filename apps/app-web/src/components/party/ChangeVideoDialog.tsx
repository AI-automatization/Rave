'use client';

import { useRef, useState } from 'react';
import { ChevronDown, Loader2, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { normalizeLinkInput } from '@/lib/link-routing';
import { trackClick } from '@/lib/analytics';
import { toast } from '@/store/toast.store';
import { useDesktopVbPicker, opensInPicker } from '@/hooks/use-desktop-vb-picker';
import type { DesktopStream } from '@/hooks/use-desktop-screen-share';
import { VbPickerOverlay } from '@/components/desktop/VbPickerOverlay';
import {
  PLATFORMS, TOP_PLATFORM_IDS, PlatformTile, openPlatformPopup, platformStartUrl,
} from '@/components/rooms/platforms';
import type { Platform } from '@/components/rooms/platforms';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Switches the room to this link right away (embed-check + CHANGE_MEDIA, see RoomContent).
   *  hints = what the desktop picker took along with the link (use-desktop-vb-picker take()). */
  onSubmit: (url: string, hints?: PickerHints) => Promise<void>;
}

/** The taken player's site page + the film stream the panel caught — the server switches a page room
 *  to the synced player with them (roomEvents.handler.ts CHANGE_MEDIA). */
export interface PickerHints { referer?: string; stream?: DesktopStream }

/**
 * Owner switches the room's video after it was created. Used to be reachable only through
 * "⋮ → Change source" → the queue tab's small ▶ button — on a phone with a tall page iframe that
 * input sat below the fold under the voice card (found 2026-10-25), so it's a modal now.
 * Same choice as when creating a room: paste a link, or pick a platform — in the desktop app the
 * platform (or a pasted film-site link) opens in the browser panel and the video comes back here.
 */
export function ChangeVideoDialog({ open, onOpenChange, onSubmit }: Props) {
  const t = useTranslations('party');
  const tRoom = useTranslations('room');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function apply(link: string, hints?: PickerHints) {
    setBusy(true);
    try {
      await onSubmit(link, hints);
      setUrl('');
      setShowOther(false);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  const picker = useDesktopVbPicker((picked, _title, referer, stream) => {
    trackClick('change_video:vb_pick');
    // Was apply(picked) alone — the page and the caught stream were dropped, so a film switched to
    // from inside the room stayed on "page as-is" for good (2026-11-05, kinogo).
    void apply(picked, referer || stream ? { referer, stream } : undefined);
  });

  function openInPicker(link: string) {
    void picker.start(link).then((ok) => { if (!ok) toast.error(tRoom('vbPickFailed')); });
  }

  function submit() {
    const normalized = normalizeLinkInput(url);
    if (!normalized || busy) return;
    // Desktop app + an ordinary site (a film site, an own source): start the film in the browser
    // panel first, then its player — not the whole page with the site's ads — becomes the room's video.
    if (picker.canPick() && opensInPicker(normalized)) {
      trackClick('change_video:link_vb');
      openInPicker(normalized);
      return;
    }
    void apply(normalized);
  }

  function handlePlatform(platform: Platform) {
    trackClick('change_video:platform', { platform: platform.id });
    if (picker.canPick()) {
      openInPicker(platformStartUrl(platform));
      return;
    }
    // Web: the site in a popup window, the link gets pasted back into the field above.
    openPlatformPopup(platform);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  const shown = PLATFORMS.filter((p) => showOther || TOP_PLATFORM_IDS.includes(p.id));

  return (
    <>
      {/* The dialog steps aside while the browser panel is up and comes back as it was on cancel. */}
      {picker.picking && <VbPickerOverlay picker={picker} />}
      <Dialog open={open && !picker.picking} onOpenChange={onOpenChange}>
        <DialogContent
          className="text-white max-w-sm border-white/[0.12]"
          style={{ background: 'rgba(8,6,18,0.9)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">{t('changeVideo')}</DialogTitle>
            <DialogDescription className="text-slate-400">{t('changeVideoDesc')}</DialogDescription>
          </DialogHeader>
          {/* noValidate: type="url" would reject a scheme-less "youtube.com/..." that submit() normalizes. */}
          <form
            noValidate
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); submit(); }}
          >
            <input
              ref={inputRef}
              autoFocus
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('videoUrlPlaceholder')}
              aria-label={t('videoUrlPlaceholder')}
              data-testid="change-video-input"
              className="ww-field !h-11 min-w-0 flex-1 px-3 text-[14px]"
            />
            <button
              type="submit"
              disabled={!url.trim() || busy}
              aria-label={busy ? t('linkChecking') : t('playNow')}
              className="ww-btn-accent flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--ww-r-sm)] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {busy
                ? <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                : <Play size={14} fill="currentColor" aria-hidden="true" />}
              <span className="hidden sm:inline">{t('playNow')}</span>
            </button>
          </form>

          <div className="flex flex-col gap-2.5">
            <p className="text-[12px] text-slate-500">{t('changeVideoPlatforms')}</p>
            <div className="grid grid-cols-4 gap-2">
              {shown.map((platform) => (
                <PlatformTile
                  key={platform.id}
                  platform={platform}
                  active={false}
                  onClick={() => handlePlatform(platform)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowOther((v) => !v)}
              className="flex cursor-pointer items-center justify-center gap-1.5 py-1 text-[12px] text-slate-500 transition-colors hover:text-slate-300"
            >
              {tRoom('otherSources')}
              <ChevronDown size={13} className={`transition-transform ${showOther ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
