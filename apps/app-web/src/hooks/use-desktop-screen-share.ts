'use client';

// Desktop screen share — the Windows app (desktop/) runs a Virtual Browser on the room owner's own
// PC; this hook captures that window (with sound) and sends it to every viewer peer-to-peer.
//
// Signalling is the watch-party screen:* relay (services/watch-party/src/socket/screen.handlers.ts),
// deliberately NOT mesh:* — mobile already uses mesh:* for DataChannel clock sync. The server keeps
// no state: a viewer asks with SCREEN_REQUEST (on join and whenever SCREEN_STARTED arrives), the
// owner answers each request with its own RTCPeerConnection + offer.
//
// Test zone: everything here is inert unless NEXT_PUBLIC_DESKTOP_VB=1. With the flag off (prod
// default) no screen:* event is ever emitted or handled, so regular web users see no change.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';

/** A stream the desktop picker caught on the network (desktop/src/main.js pickStream). */
export interface DesktopStream {
  url: string;
  type: 'hls' | 'dash' | 'mp4';
  /** null = live (no end). */
  durationSec: number | null;
}

interface DesktopBridge {
  platform: 'windows';
  version: number;
  vb: {
    /** docked: the VB page opens INSIDE the app window, over the room's video area (Mac build; older builds ignore it). */
    open(url: string, opts?: { docked?: boolean }): Promise<{ ok: true } | { ok: false; reason: string }>;
    /** Docked VB: where the room's video area is (CSS px, relative to the page), or null to hide it. */
    /** Docked VB: true = the room gets only the film's picture, false = the whole site page. Mac build. */
    setVideoOnly?(on: boolean): Promise<{ ok: boolean }>;
    setBounds?(rect: { x: number; y: number; width: number; height: number } | null): Promise<{ ok: boolean }>;
    close(): Promise<{ ok: boolean }>;
    focus(): Promise<{ ok: boolean }>;
    onState(cb: (s: DesktopVbState) => void): () => void;
  };
  /** The VB as a panel inside the app window — finding a room's video. Absent in older desktop builds. */
  picker?: {
    open(url: string): Promise<{ ok: true } | { ok: false; reason: string }>;
    setBounds(box: { x: number; y: number; width: number; height: number } | null): Promise<{ ok: boolean }>;
    nav(action: 'back' | 'reload'): Promise<{ ok: boolean }>;
    /** The iframe (or page) where a video actually started; player=false → nothing was playing.
     *  pageUrl = the site page around it (builds before 2026-11-05 don't send it). stream = the film's
     *  own playlist/file the page loaded, longest first (absent when nothing long enough played). */
    take(): Promise<{ ok: true; url: string; pageUrl?: string; title: string; player: boolean; frame: boolean; stream?: DesktopStream } | { ok: false; reason?: string }>;
    close(): Promise<{ ok: boolean }>;
    onState(cb: (s: DesktopVbState) => void): () => void;
  };
}

/** nav: 'load' = full page load, 'in-page' = SPA route change (desktop ≥ the VB-picker build). */
export interface DesktopVbState { open: boolean; url?: string; title?: string; crashed?: string; nav?: 'load' | 'in-page' }

declare global {
  interface Window { wewatchDesktop?: DesktopBridge }
}

export const DESKTOP_VB_ENABLED = process.env.NEXT_PUBLIC_DESKTOP_VB === '1';

const STUN_FALLBACK: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
// Per viewer upload from the owner's PC — mesh means the owner sends one copy per viewer, so keep it
// modest: 4 viewers × 2.5 Mbit/s fits a normal home uplink.
const MAX_VIDEO_BITRATE = 2_500_000;
const MAX_FRAMERATE = 30;
// The picture size is fixed on purpose. Left to itself, Chromium kept resizing the capture (226×128 … 2940×1652)
// and the encoder shrank it further whenever it felt short of bandwidth, so viewers saw a soft, jumping picture.
// 720p + 'maintain-resolution' measured a steady 1280×720 at 30 fps, also under a 1 Mbit/s cap. Both halves are
// needed: 720p alone was squeezed down to 320×180, 'maintain-resolution' alone captured 2782×1564.
const CAPTURE_WIDTH = 1280;
const CAPTURE_HEIGHT = 720;

type Sdp = { type: 'offer' | 'answer'; sdp: string };

/**
 * getDisplayMedia on the VB, retried when the picture never starts: a capture taken while the VB page is still settling in
 * its place can stay without frames (the track stays "muted"); a second capture of the settled page works. The last
 * attempt is kept whatever happens.
 */
async function captureVb(): Promise<MediaStream> {
  for (let attempt = 0; ; attempt++) {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: MAX_FRAMERATE, width: { ideal: CAPTURE_WIDTH }, height: { ideal: CAPTURE_HEIGHT } },
      audio: true,
    });
    const video = stream.getVideoTracks()[0];
    if (!video || !video.muted || attempt >= 2) return stream;
    const started = await new Promise<boolean>((resolve) => {
      const timer = window.setTimeout(() => { video.removeEventListener('unmute', onUnmute); resolve(false); }, 2500);
      const onUnmute = () => { window.clearTimeout(timer); resolve(true); };
      video.addEventListener('unmute', onUnmute, { once: true });
    });
    if (started) return stream;
    stream.getTracks().forEach((t) => t.stop());
  }
}

export function useDesktopScreenShare(socket: Socket | null, roomJoined: boolean, isOwner: boolean) {
  const [bridge, setBridge] = useState<DesktopBridge | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The VB sits inside the app window over the room's video area (instead of a separate window).
  const [docked, setDocked] = useState(false);
  // Docked VB: share only the film's picture (default) or the whole site page.
  const [videoOnly, setVideoOnlyState] = useState(true);
  // start() waits here until the room's video box has told the app where it is (the VB is hidden until then, and a hidden VB gives no picture).
  const dockReadyRef = useRef<(() => void) | null>(null);

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localRef = useRef<MediaStream | null>(null);
  const iceRef = useRef<RTCIceServer[]>(STUN_FALLBACK);
  // Viewer side: the single connection to the sharer.
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);

  // window is only there after mount (SSR).
  useEffect(() => {
    if (DESKTOP_VB_ENABLED && typeof window !== 'undefined' && window.wewatchDesktop) setBridge(window.wewatchDesktop);
  }, []);

  const active = DESKTOP_VB_ENABLED && roomJoined && !!socket;
  const canShare = active && isOwner && !!bridge;

  useEffect(() => {
    if (!active) return;
    let alive = true;
    fetch('/api/rooms/turn', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { iceServers?: RTCIceServer[] } | null) => {
        if (alive && body?.iceServers?.length) iceRef.current = body.iceServers;
      })
      .catch(() => { /* keep STUN */ });
    return () => { alive = false; };
  }, [active]);

  // ─── Owner (sharer) ──────────────────────────────────────────────────────

  const closeOwnerPeers = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
  }, []);

  const offerTo = useCallback(async (viewerId: string) => {
    const stream = localRef.current;
    if (!stream || !socket) return;
    peersRef.current.get(viewerId)?.close();
    const pc = new RTCPeerConnection({ iceServers: iceRef.current });
    peersRef.current.set(viewerId, pc);
    stream.getTracks().forEach((track) => {
      const sender = pc.addTrack(track, stream);
      if (track.kind === 'video') {
        const params = sender.getParameters();
        params.encodings = [{ ...(params.encodings?.[0] ?? {}), maxBitrate: MAX_VIDEO_BITRATE, maxFramerate: MAX_FRAMERATE }];
        // Short of bandwidth: keep the 720p picture sharp, lower the frame rate instead of the size.
        params.degradationPreference = 'maintain-resolution';
        void sender.setParameters(params).catch(() => { /* browser keeps its own defaults */ });
      }
    });
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit(CLIENT_EVENTS.SCREEN_ICE, { toUserId: viewerId, candidate: e.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        if (peersRef.current.get(viewerId) === pc) peersRef.current.delete(viewerId);
        // A failed connection keeps its encoder and ICE alive until closed — one per gone viewer.
        if (pc.connectionState === 'failed') pc.close();
      }
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit(CLIENT_EVENTS.SCREEN_OFFER, { toUserId: viewerId, sdp: pc.localDescription?.toJSON() });
  }, [socket]);

  const stop = useCallback(() => {
    const wasSharing = !!localRef.current;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    setLocalStream(null);
    setDocked(false);
    setVideoOnlyState(true);
    closeOwnerPeers();
    if (wasSharing) socket?.emit(CLIENT_EVENTS.SCREEN_STOP);
    void bridge?.vb.close();
  }, [bridge, closeOwnerPeers, socket]);
  const stopRef = useRef(stop);
  useEffect(() => { stopRef.current = stop; }, [stop]);

  const start = useCallback(async (url: string) => {
    if (!canShare || !bridge || starting) return;
    setStarting(true);
    setError(null);
    try {
      // A build that can place the VB inside the window shows it over the room's video area; others open a window.
      const wantDock = typeof bridge.vb.setBounds === 'function';
      const opened = await bridge.vb.open(url, wantDock ? { docked: true } : undefined);
      if (!opened.ok) { setError(opened.reason); return; }
      // Docked: the room shows the box the VB is painted over from now on — the capture below needs the VB visible.
      setDocked(wantDock);
      setVideoOnlyState(true);
      if (wantDock) {
        await new Promise<void>((resolve) => { dockReadyRef.current = resolve; window.setTimeout(resolve, 2500); });
        dockReadyRef.current = null;
        await new Promise((r) => window.setTimeout(r, 400)); // let the VB paint its first frame in its place
      }
      // main.js answers getDisplayMedia with exactly the VB window + system audio.
      const stream = await captureVb();
      stream.getVideoTracks().forEach((t) => { t.contentHint = 'motion'; });
      // The VB window was closed from Windows (X button) — end the share for everyone.
      stream.getVideoTracks()[0]?.addEventListener('ended', () => stop());
      localRef.current = stream;
      setLocalStream(stream);
      socket?.emit(CLIENT_EVENTS.SCREEN_START);
    } catch {
      setError('capture_failed');
      setDocked(false);
      void bridge.vb.close();
    } finally {
      setStarting(false);
    }
  }, [bridge, canShare, socket, starting, stop]);

  // VB window closed by the user → stop sharing.
  useEffect(() => {
    if (!bridge || !canShare) return;
    return bridge.vb.onState((s) => { if (!s.open && localRef.current) stop(); });
  }, [bridge, canShare, stop]);

  // ─── Signalling ──────────────────────────────────────────────────────────

  const closeViewer = useCallback(() => {
    viewerPcRef.current?.close();
    viewerPcRef.current = null;
    setRemoteStream(null);
  }, []);

  useEffect(() => {
    if (!active || !socket) return;

    // Owner: a viewer wants the stream.
    const onRequest = (data: { userId: string }) => {
      if (!localRef.current || !data?.userId) return;
      void offerTo(data.userId).catch(() => { /* one viewer must not break the rest */ });
    };
    const onAnswer = async (data: { fromUserId: string; sdp: Sdp }) => {
      const pc = peersRef.current.get(data.fromUserId);
      if (pc && pc.signalingState === 'have-local-offer') {
        try { await pc.setRemoteDescription(data.sdp); } catch { /* stale answer */ }
      }
    };

    // Viewer: the sharer offers.
    const onOffer = async (data: { fromUserId: string; sdp: Sdp }) => {
      if (localRef.current) return; // we are the sharer ourselves
      viewerPcRef.current?.close();
      const pc = new RTCPeerConnection({ iceServers: iceRef.current });
      viewerPcRef.current = pc;
      const fromUserId = data.fromUserId;
      pc.ontrack = (e) => setRemoteStream(e.streams[0] ?? new MediaStream([e.track]));
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit(CLIENT_EVENTS.SCREEN_ICE, { toUserId: fromUserId, candidate: e.candidate.toJSON() });
      };
      pc.onconnectionstatechange = () => {
        if ((pc.connectionState === 'failed' || pc.connectionState === 'closed') && viewerPcRef.current === pc) closeViewer();
      };
      try {
        await pc.setRemoteDescription(data.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit(CLIENT_EVENTS.SCREEN_ANSWER, { toUserId: fromUserId, sdp: pc.localDescription?.toJSON() });
      } catch {
        closeViewer();
      }
    };

    const onIce = async (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current.get(data.fromUserId) ?? viewerPcRef.current;
      if (!pc) return;
      try { await pc.addIceCandidate(data.candidate); } catch { /* arrived before the description — ICE retries */ }
    };

    const onStarted = () => { if (!localRef.current) socket.emit(CLIENT_EVENTS.SCREEN_REQUEST); };
    const onStopped = () => closeViewer();

    socket.on(SERVER_EVENTS.SCREEN_REQUEST, onRequest);
    socket.on(SERVER_EVENTS.SCREEN_ANSWER, onAnswer);
    socket.on(SERVER_EVENTS.SCREEN_OFFER, onOffer);
    socket.on(SERVER_EVENTS.SCREEN_ICE, onIce);
    socket.on(SERVER_EVENTS.SCREEN_STARTED, onStarted);
    socket.on(SERVER_EVENTS.SCREEN_STOPPED, onStopped);

    // Late joiner: if the owner is already sharing, this gets us an offer.
    if (!isOwner) socket.emit(CLIENT_EVENTS.SCREEN_REQUEST);

    return () => {
      socket.off(SERVER_EVENTS.SCREEN_REQUEST, onRequest);
      socket.off(SERVER_EVENTS.SCREEN_ANSWER, onAnswer);
      socket.off(SERVER_EVENTS.SCREEN_OFFER, onOffer);
      socket.off(SERVER_EVENTS.SCREEN_ICE, onIce);
      socket.off(SERVER_EVENTS.SCREEN_STARTED, onStarted);
      socket.off(SERVER_EVENTS.SCREEN_STOPPED, onStopped);
    };
  }, [active, socket, isOwner, offerTo, closeViewer]);

  // Leaving the room ends everything. This used to stop only the tracks: the VB window stayed open
  // and kept playing the film (backgroundThrottling off) for nobody, and viewers got no SCREEN_STOP.
  useEffect(() => () => {
    stopRef.current();
    viewerPcRef.current?.close();
  }, []);

  return {
    /** Owner inside the Windows app with the flag on — show the "VB on my computer" button. */
    canShare,
    /** What to show instead of the normal player: own capture (owner) or the received stream. */
    stream: localStream ?? remoteStream,
    isSharing: !!localStream,
    starting,
    error,
    start,
    stop,
    /** True while the VB is docked in the window: the room shows a placeholder the app paints the VB over. */
    docked,
    videoOnly,
    toggleVideoOnly: () => {
      const next = !videoOnly;
      setVideoOnlyState(next);
      void bridge?.vb.setVideoOnly?.(next);
    },
    setDockRect: (rect: { x: number; y: number; width: number; height: number } | null) => {
      void bridge?.vb.setBounds?.(rect);
      if (rect) dockReadyRef.current?.();
    },
    focusVb: () => { void bridge?.vb.focus(); },
  };
}
