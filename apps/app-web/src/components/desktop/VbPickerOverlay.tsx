'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Loader2, Play, RotateCw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DesktopVbPicker } from '@/hooks/use-desktop-vb-picker';

function BarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
    >
      {children}
    </button>
  );
}

/**
 * Desktop app: the browser panel where the user finds the room's video, inside the WeWatch window.
 * We only draw the toolbar and an empty box — the desktop app lays the actual browser view over
 * that box (it always paints above page content, so nothing of ours may sit inside the box).
 * Rendered while `picker.picking`; the dialog that started it hides meanwhile.
 */
export function VbPickerOverlay({ picker }: { picker: DesktopVbPicker }) {
  const t = useTranslations('room');
  const boxRef = useRef<HTMLDivElement>(null);
  const [noVideo, setNoVideo] = useState(false);
  const { setBounds, cancel, page } = picker;

  // The page under the panel must not scroll — its scrollbar would show as a strip beside the panel.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const send = () => {
      const r = el.getBoundingClientRect();
      setBounds({ x: r.left, y: r.top, width: r.width, height: r.height });
    };
    send();
    const ro = new ResizeObserver(send);
    ro.observe(el);
    window.addEventListener('resize', send);
    return () => { ro.disconnect(); window.removeEventListener('resize', send); setBounds(null); };
  }, [setBounds]);

  // Esc works while the focus is on our toolbar (keys typed into the site go to the site).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancel]);

  useEffect(() => { setNoVideo(false); }, [page?.url]);

  function onTake() {
    void picker.take().then((ok) => setNoVideo(!ok));
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0b0b0f]" role="dialog" aria-modal="true" aria-label={t('vbPickTitle')}>
      <div className="flex h-14 shrink-0 items-center gap-1.5 border-b border-white/[0.07] bg-[#0C0B18] px-3">
        <BarButton label={t('vbPickBack')} onClick={picker.back}><ArrowLeft size={17} /></BarButton>
        <BarButton label={t('vbPickReload')} onClick={picker.reload}><RotateCw size={15} /></BarButton>
        <div className="min-w-0 flex-1 px-2">
          <p className="truncate text-[13px] text-slate-200">{page?.title || page?.url || t('vbPickTitle')}</p>
          <p className={`truncate text-[11px] ${noVideo ? 'text-amber-400' : 'text-slate-500'}`}>
            {noVideo ? t('vbPickNoVideo') : t('vbPickHint')}
          </p>
        </div>
        <button
          type="button"
          onClick={onTake}
          disabled={!picker.canTake || picker.taking}
          className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-violet-600 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {picker.taking
            ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            : <Play size={13} fill="currentColor" aria-hidden="true" />}
          {t('vbPickTake')}
        </button>
        <BarButton label={t('vbPickCancel')} onClick={cancel}><X size={18} /></BarButton>
      </div>
      <div ref={boxRef} className="relative flex min-h-0 flex-1 items-center justify-center">
        <Loader2 size={22} className="animate-spin text-slate-600" aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}
