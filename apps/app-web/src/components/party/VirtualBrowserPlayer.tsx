'use client';

import { useCallback, useRef, useState } from 'react';
import { Globe, Loader2, X } from 'lucide-react';
import type { VBInput } from '@/hooks/use-virtual-browser';

interface Props {
  isOwner: boolean;
  frame: string | null;
  dimensions: { width: number; height: number } | null;
  error: string | null;
  start: (url: string) => void;
  stop: () => void;
  sendInput: (input: VBInput) => void;
}

// Kosmi-style shared virtual browser: a real headless Chromium page runs on the server, the
// owner controls it with mouse/keyboard, and every room member just watches the same live JPEG
// frame stream. See services/watch-party/src/services/virtualBrowser.service.ts for the server
// side (CDP screencast + input dispatch). State/socket wiring lives in the parent's
// useVirtualBrowser() call (RoomContent.tsx) — this component is presentational + input capture.
export function VirtualBrowserPlayer({ isOwner, frame, dimensions, error, start, stop, sendInput }: Props) {
  const [urlInput, setUrlInput] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const lastMoveRef = useRef(0);

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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isOwner) return;
    const now = Date.now();
    if (now - lastMoveRef.current < 40) return; // ~25fps — enough for pointer tracking, cheap
    lastMoveRef.current = now;
    const pos = toViewportCoords(e);
    if (pos) sendInput({ type: 'mousemove', x: pos.x, y: pos.y });
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

  const handleWheel = (e: React.WheelEvent) => {
    if (!isOwner) return;
    sendInput({ type: 'wheel', deltaX: e.deltaX, deltaY: e.deltaY });
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
        // eslint-disable-next-line @next/next/no-img-element -- live JPEG frame stream (base64 data URL), not a real <Image>-optimizable asset
        <img
          ref={imgRef}
          src={`data:image/jpeg;base64,${frame}`}
          alt=""
          draggable={false}
          tabIndex={isOwner ? 0 : -1}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-full h-full object-contain select-none ${isOwner ? 'cursor-default' : 'cursor-not-allowed'}`}
        />
      )}
    </div>
  );
}
