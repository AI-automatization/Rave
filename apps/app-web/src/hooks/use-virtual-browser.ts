'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { useSocket } from '@/hooks/use-socket';
import { toast } from '@/store/toast.store';

export type VBInput =
  | { type: 'mousemove'; x: number; y: number }
  | { type: 'mousedown'; x: number; y: number; button?: 'left' | 'right' | 'middle' }
  | { type: 'mouseup'; button?: 'left' | 'right' | 'middle' }
  | { type: 'wheel'; deltaX: number; deltaY: number }
  | { type: 'keydown'; key: string }
  | { type: 'keyup'; key: string }
  | { type: 'type'; text: string };

// Kosmi-style shared virtual browser: server runs a real headless Chromium page and streams it
// as JPEG frames (Chrome DevTools Protocol screencast, services/watch-party/src/services/
// virtualBrowser.service.ts) — this hook just wires the socket side, VirtualBrowserPlayer.tsx
// owns the actual rendering + input capture.
export function useVirtualBrowser(isOwner: boolean) {
  const { socket, isConnected } = useSocket();
  // Via ref so the socket effect below doesn't have to depend on `t` — see use-watch-party.ts.
  const t = useTranslations('party');
  const tRef = useRef(t);
  tRef.current = t;
  const [frame, setFrame] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Owner's pointer position in server-viewport space, relayed from vbEvents.handler.ts on
  // every mousemove input — lets viewers see a synced cursor (Kosmi-style) even though the
  // JPEG screencast itself never contains an OS cursor.
  const [remoteCursor, setRemoteCursor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onStarted = (data: { url: string; width: number; height: number }) => {
      setActive(true);
      setDimensions({ width: data.width, height: data.height });
      setError(null);
    };
    const onFrame = (data: { data: string }) => setFrame(data.data);
    const onStopped = (data?: { reason?: string }) => {
      setActive(false);
      setFrame(null);
      setRemoteCursor(null);
      // ROOM_UPDATED (with the intercepted videoUrl) fires separately and flips the room over
      // to the normal player — this toast just explains WHY the browser view disappeared.
      if (data?.reason === 'media_found') {
        toast.success(tRef.current('vbMediaFound'));
      }
    };
    const onError = (data: { message: string }) => setError(data.message);

    // Catch-up: ROOM_JOINED now carries a `vb` snapshot (services/watch-party
    // getSessionSnapshot) for whoever joins/refreshes AFTER the owner already started a
    // session — the one-shot VB_STARTED broadcast at start time never reaches them otherwise,
    // which is exactly the bug where a member saw the old broken video instead of the stream.
    const onRoomJoined = (data: { vb?: { url: string; width: number; height: number } | null }) => {
      if (data.vb) {
        setActive(true);
        setDimensions({ width: data.vb.width, height: data.vb.height });
      }
    };

    const onCursor = (data: { x: number; y: number }) => setRemoteCursor({ x: data.x, y: data.y });

    socket.on(SERVER_EVENTS.VB_STARTED, onStarted);
    socket.on(SERVER_EVENTS.VB_FRAME, onFrame);
    socket.on(SERVER_EVENTS.VB_STOPPED, onStopped);
    socket.on(SERVER_EVENTS.VB_ERROR, onError);
    socket.on(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);
    socket.on(SERVER_EVENTS.VB_CURSOR, onCursor);

    return () => {
      socket.off(SERVER_EVENTS.VB_STARTED, onStarted);
      socket.off(SERVER_EVENTS.VB_FRAME, onFrame);
      socket.off(SERVER_EVENTS.VB_STOPPED, onStopped);
      socket.off(SERVER_EVENTS.VB_ERROR, onError);
      socket.off(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);
      socket.off(SERVER_EVENTS.VB_CURSOR, onCursor);
    };
  }, [socket, isConnected]);

  const start = useCallback((url: string) => {
    socket?.emit(CLIENT_EVENTS.VB_START, { url });
  }, [socket]);

  const stop = useCallback(() => {
    socket?.emit(CLIENT_EVENTS.VB_STOP);
  }, [socket]);

  const sendInput = useCallback((input: VBInput) => {
    if (!isOwner) return; // server double-checks too, but no reason to even emit
    socket?.emit(CLIENT_EVENTS.VB_INPUT, input);
  }, [socket, isOwner]);

  return { frame, active, dimensions, error, remoteCursor, start, stop, sendInput };
}
