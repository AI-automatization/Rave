// WeWatch Mobile — Virtual Browser socket wiring (T-S188)
// Mirrors apps/app-web/src/hooks/use-virtual-browser.ts — same shared backend
// (services/watch-party/src/services/virtualBrowser.service.ts), same socket event names, only
// the transport differs (getSocket() here vs. useSocket() on web). VirtualBrowserPlayer.tsx owns
// rendering + input capture; this hook only tracks state and exposes start/stop/sendInput.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';

export type VBInput =
  | { type: 'mousemove'; x: number; y: number }
  | { type: 'mousedown'; x: number; y: number; button?: 'left' | 'right' | 'middle' }
  | { type: 'mouseup'; button?: 'left' | 'right' | 'middle' }
  | { type: 'wheel'; deltaX: number; deltaY: number }
  | { type: 'keydown'; key: string }
  | { type: 'keyup'; key: string }
  | { type: 'type'; text: string };

export function useVirtualBrowser(isOwner: boolean, onCandidateNeedsConfirmation?: () => void) {
  const [frame, setFrame] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onCandidateNeedsConfirmationRef = useRef(onCandidateNeedsConfirmation);
  onCandidateNeedsConfirmationRef.current = onCandidateNeedsConfirmation;
  // Server streams the screencast unthrottled (everyNthFrame: 1, real page fps) — fine for a
  // browser's <img> src swap, but RN's <Image> re-decodes a fresh base64 JPEG through the JS
  // bridge on every single source change, and at that rate it reads as lag/flicker on-device
  // (live report 2026-08-23). Web isn't touched — this only drops frames on the RN render side,
  // same source stream, so the owner's actual VB session and every other viewer are unaffected.
  const lastFrameAtRef = useRef(0);
  const FRAME_THROTTLE_MS = 100; // ~10fps ceiling for the RN <Image>, plenty for "watch someone click"

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onStarted = (data: { url: string; width: number; height: number }) => {
      setActive(true);
      setDimensions({ width: data.width, height: data.height });
      setError(null);
    };
    const onFrame = (data: { data: string }) => {
      const now = Date.now();
      if (now - lastFrameAtRef.current < FRAME_THROTTLE_MS) return;
      lastFrameAtRef.current = now;
      setFrame(data.data);
    };
    const onStopped = (data?: { reason?: string; needsConfirmation?: boolean }) => {
      setActive(false);
      setFrame(null);
      // needsConfirmation: true — VB found candidate(s) but, unlike a normal extraction result,
      // never auto-commits to the room (services/watch-party vbSession.helper.ts) — same picker
      // as the gear-row "Это не то видео" (VideoCandidatePicker.tsx, T-S190), just opened for the
      // owner automatically instead of waiting for them to find the menu entry themselves.
      if (data?.reason === 'media_found' && data.needsConfirmation) {
        onCandidateNeedsConfirmationRef.current?.();
      }
    };
    const onError = (data: { message: string }) => setError(data.message);

    // Catch-up: ROOM_JOINED carries a `vb` snapshot (services/watch-party getSessionSnapshot)
    // for whoever joins/reconnects AFTER the owner already started a session — the one-shot
    // VB_STARTED broadcast at start time never reaches them otherwise.
    //
    // `vb.paused` (2026-08-13 root-cause trace, web equivalent of this same bug): once the
    // collection window closes on a 'capture' candidate, the server stops the screencast for
    // good (no resumeScreencast()) and waits for the owner to confirm/reject via the candidate
    // picker — no more VB_FRAME will ever arrive. Setting active=true here for a paused session
    // leaves the VB view spinning forever with nothing that would ever resolve it. A
    // reconnect during this window must reopen the picker instead of "loading".
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
  }, []);

  const start = useCallback((url: string) => {
    getSocket()?.emit(CLIENT_EVENTS.VB_START, { url });
  }, []);

  const stop = useCallback(() => {
    getSocket()?.emit(CLIENT_EVENTS.VB_STOP);
  }, []);

  const sendInput = useCallback((input: VBInput) => {
    if (!isOwner) return; // server double-checks too, but no reason to even emit
    getSocket()?.emit(CLIENT_EVENTS.VB_INPUT, input);
  }, [isOwner]);

  return { frame, active, dimensions, error, start, stop, sendInput };
}
