'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, Loader2, MousePointer2, X } from 'lucide-react';
import type { VBInput } from '@/hooks/use-virtual-browser';

interface Props {
  isOwner: boolean;
  frame: string | null;
  dimensions: { width: number; height: number } | null;
  error: string | null;
  /** Page VB is showing is a bot-challenge wall — see use-virtual-browser.ts's `blocked`. Not an
   * `error` (that's scoped to the pre-session URL-input screen, see the render tree below) — this
   * needs to show ON TOP of a live, still-streaming frame. */
  blocked: 'cloudflare' | 'recaptcha' | null;
  remoteCursor: { x: number; y: number } | null;
  start: (url: string) => void;
  stop: () => void;
  sendInput: (input: VBInput) => void;
  /** Owner-only: opens the same video-candidate picker "Это не то видео" already opens — the
   * blocked-badge's escape hatch to pick a different source instead of waiting out a dead session. */
  onPickDifferentVideo?: () => void;
}

// Kosmi-style shared virtual browser: a real headless Chromium page runs on the server, the
// owner controls it with mouse/keyboard, and every room member just watches the same live JPEG
// frame stream. See services/watch-party/src/services/virtualBrowser.service.ts for the server
// side (CDP screencast + input dispatch). State/socket wiring lives in the parent's
// useVirtualBrowser() call (RoomContent.tsx) — this component is presentational + input capture.
export function VirtualBrowserPlayer({ isOwner, frame, dimensions, error, blocked, remoteCursor, start, stop, sendInput, onPickDifferentVideo }: Props) {
  const t = useTranslations('party');
  const [urlInput, setUrlInput] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const lastMoveRef = useRef(0);
  // Owner's own pointer position in CSS space (not server-viewport space) — purely local visual
  // feedback, no round-trip needed since it's just "where is MY mouse over the stream right now".
  const [localCursorCss, setLocalCursorCss] = useState<{ x: number; y: number } | null>(null);

  // Maps a viewport-space client point to the server-side browser's fixed viewport (1280x720
  // by default) regardless of how large the <img> is actually rendered on screen. Takes raw
  // coordinates rather than a React.MouseEvent so the touch handlers below can reuse it —
  // a TouchEvent has no clientX of its own, only per-Touch ones.
  const clientToViewport = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!imgRef.current || !dimensions) return null;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  }, [dimensions]);

  const toViewportCoords = useCallback(
    (e: React.MouseEvent) => clientToViewport(e.clientX, e.clientY),
    [clientToViewport],
  );

  // Inverse of toViewportCoords — used to place the OTHER viewers' synced cursor (received in
  // server-viewport space via VB_CURSOR) at the right spot on THIS client's rendered <img>,
  // whatever size it happens to be displayed at.
  const viewportToCssCoords = useCallback((vx: number, vy: number): { x: number; y: number } | null => {
    if (!imgRef.current || !dimensions) return null;
    const rect = imgRef.current.getBoundingClientRect();
    return {
      x: (vx / dimensions.width) * rect.width,
      y: (vy / dimensions.height) * rect.height,
    };
  }, [dimensions]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isOwner && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      setLocalCursorCss({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (!isOwner) return;
    const now = Date.now();
    if (now - lastMoveRef.current < 40) return; // ~25fps — enough for pointer tracking, cheap
    lastMoveRef.current = now;
    const pos = toViewportCoords(e);
    if (pos) sendInput({ type: 'mousemove', x: pos.x, y: pos.y });
  };

  const handleMouseLeave = () => {
    if (isOwner) setLocalCursorCss(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isOwner) return;
    // Safari does not focus an <img> on click, so the keydown/keyup handlers below never fired
    // after the first interaction — typing into the remote page silently did nothing.
    imgRef.current?.focus();
    const pos = toViewportCoords(e);
    if (pos) sendInput({ type: 'mousedown', x: pos.x, y: pos.y });
  };

  const handleMouseUp = () => {
    if (!isOwner) return;
    sendInput({ type: 'mouseup' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOwner) return;
    e.preventDefault();
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      sendInput({ type: 'type', text: e.key });
    } else {
      sendInput({ type: 'keydown', key: e.key });
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!isOwner) return;
    if (e.key.length !== 1) sendInput({ type: 'keyup', key: e.key });
  };

  // Native (non-React) wheel listener with { passive: false } — React attaches its synthetic
  // onWheel as a PASSIVE listener by default (has been since React 17, for scroll-perf reasons),
  // which silently makes e.preventDefault() a no-op. Without this, scrolling over the stream
  // scrolled the actual WeWatch page underneath instead of the remote browser — exactly the
  // reported bug. This is the standard workaround: attach the listener directly to the DOM node.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !isOwner) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sendInput({ type: 'wheel', deltaX: e.deltaX, deltaY: e.deltaY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOwner, sendInput, frame]); // re-attach if the <img> node identity changes across renders

  // Touch input. Before this the component listened for mouse events ONLY, so on a phone or a
  // touchscreen laptop the virtual browser was completely uncontrollable — the reported bug.
  //
  // Native listeners with { passive: false } for the same reason as the wheel handler above:
  // React registers touchstart/touchmove passively, which makes preventDefault() a silent no-op,
  // and without it every drag scrolls the WeWatch page behind the stream instead.
  //
  // A finger drag is translated to WHEEL, not to a held mousemove: on a touch device dragging
  // means "scroll the page", whereas a held pointer drag would select text on the remote page.
  // A tap (no meaningful movement) becomes mousedown+mouseup, i.e. a click.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !isOwner) return;

    // Below this, the finger hasn't really moved — treat the gesture as a tap.
    const TAP_SLOP_PX = 10;
    let startX = 0, startY = 0, lastX = 0, lastY = 0, moved = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      el.focus(); // same Safari focus problem as mousedown
      startX = lastX = t.clientX;
      startY = lastY = t.clientY;
      moved = false;
      // Move the remote pointer to where the finger landed, so hover-dependent controls
      // (menus, custom players) behave as they would under a mouse.
      const pos = clientToViewport(t.clientX, t.clientY);
      if (pos) sendInput({ type: 'mousemove', x: pos.x, y: pos.y });
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      const dx = t.clientX - lastX;
      const dy = t.clientY - lastY;
      if (Math.abs(t.clientX - startX) > TAP_SLOP_PX || Math.abs(t.clientY - startY) > TAP_SLOP_PX) {
        moved = true;
      }
      lastX = t.clientX;
      lastY = t.clientY;
      // Negated: dragging the finger UP should scroll the content DOWN, which is a positive
      // wheel delta — the same convention as native touch scrolling.
      if (moved) sendInput({ type: 'wheel', deltaX: -dx, deltaY: -dy });
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (moved) return; // it was a scroll, not a click
      const pos = clientToViewport(startX, startY);
      if (!pos) return;
      sendInput({ type: 'mousedown', x: pos.x, y: pos.y });
      sendInput({ type: 'mouseup' });
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isOwner, sendInput, frame, clientToViewport]);

  if (!frame && !dimensions) {
    if (!isOwner) {
      return (
        <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-2 text-center px-6">
          <Globe size={24} className="text-zinc-700" />
          <p className="text-sm text-zinc-500">{t('vbNotOpened')}</p>
        </div>
      );
    }
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-6 text-center">
        <Globe size={24} className="text-violet-400/60" />
        <div className="flex gap-2 w-full max-w-sm">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && urlInput) start(urlInput); }}
            placeholder="https://..."
            className="flex-1 h-10 px-3 bg-[#111118] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
          />
          <button
            onClick={() => urlInput && start(urlInput)}
            disabled={!urlInput}
            className="h-10 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {t('vbOpen')}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    );
  }

  const remoteCursorCss = !isOwner && remoteCursor ? viewportToCssCoords(remoteCursor.x, remoteCursor.y) : null;

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      {isOwner && (
        <button
          onClick={stop}
          title={t('vbClose')}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center text-white cursor-pointer"
        >
          <X size={16} />
        </button>
      )}

      {!frame && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}

      {frame && (
        <>
          {/* Nothing in the room auto-plays here on purpose — the whole point of falling back to
              VB is a real page the owner has to click through (play button, ads, captchas). Without
              this hint people stared at a loaded page with no idea they were the ones expected to
              act on it. */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-violet-500/20 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium">{t('vbStartVideo')}</span>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element -- live JPEG frame stream (base64 data URL), not a real <Image>-optimizable asset */}
          <img
            ref={imgRef}
            src={`data:image/jpeg;base64,${frame}`}
            alt=""
            draggable={false}
            tabIndex={isOwner ? 0 : -1}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onContextMenu={(e) => e.preventDefault()}
            // globals.css only applies touch-action to button/a/[role=button], so this <img> was
            // left with the browser default and every gesture went to page scroll/zoom first.
            // `none` for the owner only — viewers should still be able to scroll the room past it.
            style={isOwner ? { touchAction: 'none' } : undefined}
            className={`w-full h-full object-contain select-none ${isOwner ? 'cursor-none' : 'cursor-not-allowed'}`}
          />

          {/* Owner's own cursor — the JPEG screencast never contains an OS cursor (headless
              Chrome doesn't render one), so without this the owner has zero feedback about
              where they're about to click. cursor-none above hides the real OS pointer so this
              doesn't look like two overlapping cursors. */}
          {isOwner && localCursorCss && (
            <MousePointer2
              size={18}
              className="absolute pointer-events-none text-violet-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              style={{ left: localCursorCss.x, top: localCursorCss.y, transform: 'translate(-2px,-2px)' }}
              fill="currentColor"
            />
          )}

          {/* Bot-challenge wall — not solved/bypassed (out of scope on purpose, see
              virtualBrowser.service.ts), just surfaced. Owner can click straight through to the
              candidate picker instead of waiting out a screencast that will never resolve on its
              own; non-owner sees the same badge but it's informational only (picker is owner-gated,
              same as "Это не то видео"). */}
          {blocked && (
            <button
              type="button"
              disabled={!isOwner || !onPickDifferentVideo}
              onClick={() => onPickDifferentVideo?.()}
              className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[12px] font-medium text-white/80 backdrop-blur-sm transition-colors ${isOwner && onPickDifferentVideo ? 'cursor-pointer hover:bg-black/85 hover:text-white' : 'cursor-default'}`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              {t('vbBlocked')}
              {isOwner && onPickDifferentVideo && <span className="opacity-70">— {t('playerPickAnother')}</span>}
            </button>
          )}

          {/* Everyone else sees the OWNER's cursor, synced via VB_CURSOR — same reason Kosmi
              shows one: otherwise nobody but the owner has any idea what they're pointing at. */}
          {remoteCursorCss && (
            <MousePointer2
              size={18}
              className="absolute pointer-events-none text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              style={{ left: remoteCursorCss.x, top: remoteCursorCss.y, transform: 'translate(-2px,-2px)' }}
              fill="currentColor"
            />
          )}
        </>
      )}
    </div>
  );
}
