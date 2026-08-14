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
export function useVirtualBrowser(isOwner: boolean, onCandidateNeedsConfirmation?: () => void) {
  const { socket, isConnected } = useSocket();
  // Via ref so the socket effect below doesn't have to depend on `t` — see use-watch-party.ts.
  const t = useTranslations('party');
  const tRef = useRef(t);
  tRef.current = t;
  const onCandidateNeedsConfirmationRef = useRef(onCandidateNeedsConfirmation);
  onCandidateNeedsConfirmationRef.current = onCandidateNeedsConfirmation;
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
    // setActive(true) here too, not just in onStarted/onRoomJoined — real prod reports
    // 2026-08-07: the VB overlay sometimes never appeared despite the backend session running
    // fine (confirmed in logs), for reasons never conclusively pinned down (one-shot VB_STARTED
    // broadcasting before this socket had joined the room, a missed/raced ROOM_JOINED catch-up,
    // etc — several credible races, no single provable one). Frames are NOT one-shot: they keep
    // streaming continuously the whole time a session is active, so treating "a frame arrived" as
    // proof-of-active makes this self-healing regardless of which specific race caused the miss —
    // the very next frame corrects the UI instead of requiring VB_STARTED/ROOM_JOINED to have
    // landed at exactly the right moment.
    const onFrame = (data: { data: string }) => { setFrame(data.data); setActive(true); };
    const onStopped = (data?: { reason?: string; needsConfirmation?: boolean }) => {
      setActive(false);
      setFrame(null);
      setRemoteCursor(null);
      // needsConfirmation: true — VB found *something* but, unlike a normal extraction result,
      // never auto-commits it to the room (see vbSession.helper.ts) — it's just pushed into the
      // same video-candidate picker the owner already knows from "Это не то видео", waiting for
      // an explicit confirm/reject instead of silently switching everyone's player.
      if (data?.reason === 'media_found' && data.needsConfirmation) {
        onCandidateNeedsConfirmationRef.current?.();
      } else if (data?.reason === 'media_found') {
        toast.success(tRef.current('vbMediaFound'));
      }
    };
    const onError = (data: { message: string }) => setError(data.message);

    // Catch-up: ROOM_JOINED now carries a `vb` snapshot (services/watch-party
    // getSessionSnapshot) for whoever joins/refreshes AFTER the owner already started a
    // session — the one-shot VB_STARTED broadcast at start time never reaches them otherwise,
    // which is exactly the bug where a member saw the old broken video instead of the stream.
    //
    // `vb.paused` (2026-08-13 root-cause trace, "VB stuck loading forever after reload"): once
    // the collection window closes on a 'capture' candidate, the server stops the screencast for
    // good (no resumeScreencast()) and waits for the owner to confirm/reject via the candidate
    // picker — no more VB_FRAME will ever arrive. Setting active=true here for a paused session
    // left VirtualBrowserPlayer's `!frame` branch spinning forever with nothing that would ever
    // resolve it. A rejoin during this window must reopen the picker instead of "loading".
    const onRoomJoined = (data: { vb?: { url: string; width: number; height: number; paused: boolean } | null }) => {
      if (data.vb?.paused) {
        onCandidateNeedsConfirmationRef.current?.();
        return;
      }
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
