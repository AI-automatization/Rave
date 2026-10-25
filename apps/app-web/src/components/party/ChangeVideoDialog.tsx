'use client';

import { useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Switches the room to this link right away (embed-check + CHANGE_MEDIA, see RoomContent). */
  onSubmit: (url: string) => Promise<void>;
}

/**
 * Owner switches the room's video after it was created. Used to be reachable only through
 * "⋮ → Change source" → the queue tab's small ▶ button — on a phone with a tall page iframe that
 * input sat below the fold under the voice card (found 2026-10-25), so it's a modal now.
 */
export function ChangeVideoDialog({ open, onOpenChange, onSubmit }: Props) {
  const t = useTranslations('party');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const raw = url.trim();
    if (!raw || busy) return;
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    setBusy(true);
    try {
      await onSubmit(normalized);
      setUrl('');
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          onSubmit={(e) => { e.preventDefault(); void submit(); }}
        >
          <input
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
      </DialogContent>
    </Dialog>
  );
}
