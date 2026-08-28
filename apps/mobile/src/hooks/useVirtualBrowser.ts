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
  // Page VB is showing is a bot-challenge wall (Cloudflare/reCAPTCHA) — not solved/bypassed, just
  // surfaced so the owner can pick a different source instead of staring at a stuck screencast
  // (Twitch/Rutube live report 2026-08-28: room looked "flickering"/stuck with no way out — this
  // was already fixed on web, apps/app-web/src/hooks/use-virtual-browser.ts, never ported here).
  const [blocked, setBlocked] = useState<'cloudflare' | 'recaptcha' | null>(null);
  const onCandidateNeedsConfirmationRef = useRef(onCandidateNeedsConfirmation);
  onCandidateNeedsConfirmationRef.current = onCandidateNeedsConfirmation;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Latch cleared only by an explicit VB_STARTED — same fix as web's endedRef (2026-08-28,
    // Saidazim: "когда я уже выбрал видео, он опять открывает вб"), never ported to mobile. Any
    // arriving frame is otherwise treated as proof the session is live (deliberate self-healing
    // for a missed VB_STARTED), which also means a frame still in flight when the session ends
    // silently re-opens the VB overlay on top of the video the room just switched to.
    const endedRef = { current: false };

    const onStarted = (data: { url: string; width: number; height: number }) => {
      endedRef.current = false;
      setActive(true);
      setDimensions({ width: data.width, height: data.height });
      setError(null);
      setBlocked(null);
    };
    const onFrame = (data: { data: string }) => {
      if (endedRef.current) return;
      setFrame(data.data);
    };
    const onStopped = (data?: { reason?: string; needsConfirmation?: boolean }) => {
      endedRef.current = true;
      setActive(false);
      setFrame(null);
      setBlocked(null);
      // needsConfirmation: true — VB found candidate(s) but, unlike a normal extraction result,
      // never auto-commits to the room (services/watch-party vbSession.helper.ts) — same picker
      // as the gear-row "Это не то видео" (VideoCandidatePicker.tsx, T-S190), just opened for the
      // owner automatically instead of waiting for them to find the menu entry themselves.
      if (data?.reason === 'media_found' && data.needsConfirmation) {
        onCandidateNeedsConfirmationRef.current?.();
      }
    };
    const onError = (data: { message: string }) => setError(data.message);
    const onBlocked = (data: { reason: 'cloudflare' | 'recaptcha' }) => setBlocked(data.reason);

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
        endedRef.current = false;
        setActive(true);
        setDimensions({ width: data.vb.width, height: data.vb.height });
      }
    };

    socket.on(SERVER_EVENTS.VB_STARTED, onStarted);
    socket.on(SERVER_EVENTS.VB_FRAME, onFrame);
    socket.on(SERVER_EVENTS.VB_STOPPED, onStopped);
    socket.on(SERVER_EVENTS.VB_ERROR, onError);
    socket.on(SERVER_EVENTS.VB_BLOCKED, onBlocked);
    socket.on(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);

    return () => {
      socket.off(SERVER_EVENTS.VB_STARTED, onStarted);
      socket.off(SERVER_EVENTS.VB_FRAME, onFrame);
      socket.off(SERVER_EVENTS.VB_STOPPED, onStopped);
      socket.off(SERVER_EVENTS.VB_ERROR, onError);
      socket.off(SERVER_EVENTS.VB_BLOCKED, onBlocked);
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

  return { frame, active, dimensions, error, blocked, start, stop, sendInput };
}
