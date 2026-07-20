'use client';

import { useCallback, useEffect, useState } from 'react';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { useSocket } from '@/hooks/use-socket';

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
  const [frame, setFrame] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onStarted = (data: { url: string; width: number; height: number }) => {
      setActive(true);
      setDimensions({ width: data.width, height: data.height });
      setError(null);
    };
    const onFrame = (data: { data: string }) => setFrame(data.data);
    const onStopped = () => { setActive(false); setFrame(null); };
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

    socket.on(SERVER_EVENTS.VB_STARTED, onStarted);
    socket.on(SERVER_EVENTS.VB_FRAME, onFrame);
    socket.on(SERVER_EVENTS.VB_STOPPED, onStopped);
    socket.on(SERVER_EVENTS.VB_ERROR, onError);
    socket.on(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);

    return () => {
      socket.off(SERVER_EVENTS.VB_STARTED, onStarted);
      socket.off(SERVER_EVENTS.VB_FRAME, onFrame);
      socket.off(SERVER_EVENTS.VB_STOPPED, onStopped);
      socket.off(SERVER_EVENTS.VB_ERROR, onError);
      socket.off(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);
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

  return { frame, active, dimensions, error, start, stop, sendInput };
}
