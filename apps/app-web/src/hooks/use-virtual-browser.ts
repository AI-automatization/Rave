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
  // Page VB is showing is a bot-challenge wall (Cloudflare/reCAPTCHA) — not solved/bypassed, just
  // surfaced so the owner can pick a different source instead of staring at a stuck screencast.
  const [blocked, setBlocked] = useState<'cloudflare' | 'recaptcha' | null>(null);
  // Free-tier pool is full — 1-indexed position while waiting, see vbQueue.helper.ts. null means
  // "not queued" (either never asked, already started, or Pro — Pro never queues).
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onStarted = (data: { url: string; width: number; height: number }) => {
      setActive(true);
      setDimensions({ width: data.width, height: data.height });
      setError(null);
      setBlocked(null);
      setQueuePosition(null);
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
      setBlocked(null);
      setQueuePosition(null);
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
    const onBlocked = (data: { reason: 'cloudflare' | 'recaptcha' }) => setBlocked(data.reason);
    const onQueued = (data: { position: number }) => setQueuePosition(data.position);

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

    socket.on(SERVER_EVENTS.VB_STARTED, onStarted);
    socket.on(SERVER_EVENTS.VB_FRAME, onFrame);
    socket.on(SERVER_EVENTS.VB_STOPPED, onStopped);
    socket.on(SERVER_EVENTS.VB_ERROR, onError);
    socket.on(SERVER_EVENTS.VB_BLOCKED, onBlocked);
    socket.on(SERVER_EVENTS.VB_QUEUED, onQueued);
    socket.on(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);

    return () => {
      socket.off(SERVER_EVENTS.VB_STARTED, onStarted);
      socket.off(SERVER_EVENTS.VB_FRAME, onFrame);
      socket.off(SERVER_EVENTS.VB_STOPPED, onStopped);
      socket.off(SERVER_EVENTS.VB_ERROR, onError);
      socket.off(SERVER_EVENTS.VB_BLOCKED, onBlocked);
      socket.off(SERVER_EVENTS.VB_QUEUED, onQueued);
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

  return { frame, active, dimensions, error, blocked, queuePosition, start, stop, sendInput };
}
