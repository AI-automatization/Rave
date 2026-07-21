'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Globe, Loader2, MousePointer2, X } from 'lucide-react';
import type { VBInput } from '@/hooks/use-virtual-browser';

interface Props {
  isOwner: boolean;
  frame: string | null;
  dimensions: { width: number; height: number } | null;
  error: string | null;
  remoteCursor: { x: number; y: number } | null;
  start: (url: string) => void;
  stop: () => void;
  sendInput: (input: VBInput) => void;
}

// Kosmi-style shared virtual browser: a real headless Chromium page runs on the server, the
// owner controls it with mouse/keyboard, and every room member just watches the same live JPEG
// frame stream. See services/watch-party/src/services/virtualBrowser.service.ts for the server
// side (CDP screencast + input dispatch). State/socket wiring lives in the parent's
// useVirtualBrowser() call (RoomContent.tsx) — this component is presentational + input capture.
export function VirtualBrowserPlayer({ isOwner, frame, dimensions, error, remoteCursor, start, stop, sendInput }: Props) {
  const [urlInput, setUrlInput] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const lastMoveRef = useRef(0);
  // Owner's own pointer position in CSS space (not server-viewport space) — purely local visual
  // feedback, no round-trip needed since it's just "where is MY mouse over the stream right now".
  const [localCursorCss, setLocalCursorCss] = useState<{ x: number; y: number } | null>(null);

  // Maps a mouse event's page position to the server-side browser's fixed viewport (1280x720
  // by default) regardless of how large the <img> is actually rendered on screen.
  const toViewportCoords = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
    if (!imgRef.current || !dimensions) return null;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }, [dimensions]);

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

  if (!frame && !dimensions) {
    if (!isOwner) {
      return (
        <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-2 text-center px-6">
          <Globe size={24} className="text-zinc-700" />
          <p className="text-sm text-zinc-500">Владелец комнаты ещё не открыл браузер</p>
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
            Открыть
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
          title="Закрыть виртуальный браузер"
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
