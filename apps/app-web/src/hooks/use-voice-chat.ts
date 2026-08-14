'use client';

// Web voice chat — browser WebRTC over the SAME watch-party signaling the mobile app uses
// (services/watch-party/src/socket/voiceEvents.handler.ts). No backend change was needed: the
// server only relays offer/answer/ICE blobs, so a browser peer and a react-native-webrtc peer
// negotiate with each other directly.
//
// Mirrors apps/mobile/src/hooks/useVoiceChat.ts, with two things the mobile version doesn't need:
//   1. remote audio must be attached to an <audio> element by hand — react-native-webrtc plays
//      incoming tracks automatically, the browser does not, and without this the call connects
//      and stays silent;
//   2. real speaking detection via Web Audio, so VOICE_SPEAKING carries actual information
//      (mobile only ever emits `false` on a timer).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';

export interface VoiceParticipant {
  userId: string;
  isSpeaking: boolean;
  /** Local-only playback level for this remote peer (0-1) — never sent to the server, each
   * listener's own mix. Defaults to 1 (unset). */
  volume: number;
  /** Owner force-muted this participant (MUTE_MEMBER/UNMUTE_MEMBER) — real room state, mirrored
   * to every client so the owner's controls (and everyone's UI) show the true mute state. */
  mutedByHost: boolean;
}

// Used until the backend TURN credentials arrive (or if that request fails). STUN alone connects
// on friendly NAT only — symmetric NAT/CGNAT needs the TURN relay.
const STUN_FALLBACK: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const SPEAKING_RMS_THRESHOLD = 0.02; // empirical: room noise sits well under this
const SPEAKING_POLL_MS = 200;
const SPEAKING_RELEASE_MS = 600; // keep "speaking" this long after the level drops, avoids flicker

export function useVoiceChat(socket: Socket | null, active: boolean, currentUserId?: string) {
  const [isJoined, setIsJoined] = useState(false);
  // Mic starts OFF — the user is auto-joined muted, same contract as mobile.
  const [isMuted, setIsMuted] = useState(true);
  // Set when the room owner force-mutes this user (MUTE_MEMBER) — while true, toggleMute is a
  // no-op (self-unmute would defeat the entire point of an owner-enforced mute) until the owner
  // lifts it via UNMUTE_MEMBER.
  const [forcedMuted, setForcedMuted] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  // Local mic speaking state — `participants` only ever holds REMOTE peers (see onVoiceJoined:
  // the server's `members` list is "everyone already in the call", i.e. never includes yourself),
  // so a caller that only checks `participants.some(p => p.isSpeaking)` for e.g. video-ducking
  // never reacts to the LOCAL user's own voice — confirmed live 2026-08-14: ducking worked when
  // listening to a remote peer talk, but not on your own screen while you were the one talking.
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Per-remote-peer local playback volume — keyed by userId, survives peer reconnects (a fresh
  // <audio> element on reconnect still picks up whatever the listener had set before).
  const volumesRef = useRef<Map<string, number>>(new Map());
  // Room-wide (not local) — who the owner has force-muted, mirrored from MEMBER_MUTED/UNMUTED
  // broadcasts so it survives a participant leaving/rejoining voice within the same room visit.
  const mutedByHostRef = useRef<Set<string>>(new Set());

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>(STUN_FALLBACK);

  // One <audio> per remote peer, created detached from the DOM tree React manages. They are never
  // rendered, only played — so keeping them outside React avoids re-render churn on every track.
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Web Audio graph for local speaking detection.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasSpeakingRef = useRef(false);
  const lastLoudAtRef = useRef(0);
  // Read inside the polling interval, which must not be torn down and rebuilt on every mute toggle.
  const isMutedRef = useRef(true);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // ─── Peer plumbing ─────────────────────────────────────────────────────────

  const attachRemoteAudio = useCallback((userId: string, stream: MediaStream) => {
    let el = audioElsRef.current.get(userId);
    if (!el) {
      el = new Audio();
      el.autoplay = true;
      audioElsRef.current.set(userId, el);
    }
    el.srcObject = stream;
    el.volume = volumesRef.current.get(userId) ?? 1;
    // Autoplay can be refused until the page has been interacted with. Joining voice is itself a
    // click, so this normally resolves — swallow the rejection rather than surface a scary error.
    void el.play().catch(() => { /* blocked until user gesture */ });
  }, []);

  const getOrCreatePeer = useCallback((userId: string): RTCPeerConnection => {
    const existing = peersRef.current.get(userId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current as MediaStream);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit(CLIENT_EVENTS.VOICE_ICE, { to: userId, candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track]);
      attachRemoteAudio(userId, stream);
    };

    peersRef.current.set(userId, pc);
    return pc;
  }, [socket, attachRemoteAudio]);

  const closePeer = useCallback((userId: string) => {
    peersRef.current.get(userId)?.close();
    peersRef.current.delete(userId);

    const el = audioElsRef.current.get(userId);
    if (el) {
      el.srcObject = null;
      audioElsRef.current.delete(userId);
    }
  }, []);

  const createPeerAndOffer = useCallback(async (userId: string) => {
    const pc = getOrCreatePeer(userId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    socket?.emit(CLIENT_EVENTS.VOICE_OFFER, { to: userId, offer: pc.localDescription });
  }, [getOrCreatePeer, socket]);

  const teardown = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    audioElsRef.current.forEach((el) => { el.srcObject = null; });
    audioElsRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    void audioCtxRef.current?.close().catch(() => { /* already closed */ });
    audioCtxRef.current = null;
    analyserRef.current = null;
    wasSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // ─── Speaking detection ────────────────────────────────────────────────────

  const startSpeakingDetection = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const buffer = new Float32Array(analyser.fftSize);
      speakingIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;

        // Muted means the track is disabled and nothing reaches peers — report not-speaking
        // without even measuring, so a muted mic can never light someone's avatar up.
        let speaking = false;
        if (!isMutedRef.current) {
          analyserRef.current.getFloatTimeDomainData(buffer);
          let sumSquares = 0;
          // Indexed loop, not for-of: the tsconfig target here predates TypedArray iteration.
          for (let i = 0; i < buffer.length; i++) sumSquares += buffer[i] * buffer[i];
          const rms = Math.sqrt(sumSquares / buffer.length);

          if (rms > SPEAKING_RMS_THRESHOLD) lastLoudAtRef.current = Date.now();
          speaking = Date.now() - lastLoudAtRef.current < SPEAKING_RELEASE_MS;
        }

        // Only emit/set-state on transitions — this fires 5×/second and would otherwise flood
        // the room with identical events and re-render on every poll tick.
        if (speaking !== wasSpeakingRef.current) {
          wasSpeakingRef.current = speaking;
          socket?.emit(CLIENT_EVENTS.VOICE_SPEAKING, { speaking });
          setIsSpeaking(speaking);
        }
      }, SPEAKING_POLL_MS);
    } catch {
      // Web Audio unavailable — voice itself still works, only the speaking indicator is lost.
    }
  }, [socket]);

  // ─── Signaling ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !active) return;

    const onVoiceJoined = async (data: { members: string[] }) => {
      setIsJoined(true);
      setIsLoading(false);
      setParticipants(data.members.map((userId) => ({
        userId, isSpeaking: false,
        volume: volumesRef.current.get(userId) ?? 1,
        mutedByHost: mutedByHostRef.current.has(userId),
      })));
      // We were the late joiner, so we offer to everyone already in the call.
      for (const memberId of data.members) {
        try { await createPeerAndOffer(memberId); } catch { /* one bad peer must not abort the rest */ }
      }
    };

    const onUserJoined = (data: { userId: string }) => {
      // No offer from this side: the newcomer offers to us (see onVoiceJoined). Both sides
      // offering would produce glare and a failed negotiation.
      setParticipants((prev) =>
        prev.some((p) => p.userId === data.userId)
          ? prev
          : [...prev, {
              userId: data.userId, isSpeaking: false,
              volume: volumesRef.current.get(data.userId) ?? 1,
              mutedByHost: mutedByHostRef.current.has(data.userId),
            }]);
    };

    const onUserLeft = (data: { userId: string }) => {
      closePeer(data.userId);
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    };

    const onOffer = async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      const pc = getOrCreatePeer(data.from);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit(CLIENT_EVENTS.VOICE_ANSWER, { to: data.from, answer: pc.localDescription });
    };

    const onAnswer = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peersRef.current.get(data.from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    };

    const onIce = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current.get(data.from);
      if (!pc) return;
      // Candidates routinely arrive before the remote description is set; that throws and is
      // harmless — ICE retries on its own.
      try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch { /* ignore */ }
    };

    const onSpeaking = (data: { userId: string; speaking: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.userId === data.userId ? { ...p, isSpeaking: data.speaking } : p)));
    };

    // Owner force-mute/unmute (roomEvents.handler.ts MUTE_MEMBER/UNMUTE_MEMBER) — broadcasts to
    // the whole room. Everyone updates their view of that participant's state (mutedByHostRef +
    // the participants list, so the owner's own controls show the right icon); only the actual
    // target additionally has to act on their own mic locally.
    const onMemberMuted = (data: { userId: string }) => {
      mutedByHostRef.current.add(data.userId);
      setParticipants((prev) => prev.map((p) => (p.userId === data.userId ? { ...p, mutedByHost: true } : p)));
      if (data.userId !== currentUserId) return;
      setForcedMuted(true);
      setIsMuted(true);
      localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = false; });
    };
    const onMemberUnmuted = (data: { userId: string }) => {
      mutedByHostRef.current.delete(data.userId);
      setParticipants((prev) => prev.map((p) => (p.userId === data.userId ? { ...p, mutedByHost: false } : p)));
      if (data.userId !== currentUserId) return;
      // Lifting the forced mute does not itself re-enable the mic — matches every other app's
      // convention (server-unmute clears the block, the user still has to press mic themselves).
      setForcedMuted(false);
    };

    socket.on(SERVER_EVENTS.VOICE_JOINED, onVoiceJoined);
    socket.on(SERVER_EVENTS.VOICE_USER_JOINED, onUserJoined);
    socket.on(SERVER_EVENTS.VOICE_USER_LEFT, onUserLeft);
    socket.on(SERVER_EVENTS.VOICE_OFFER, onOffer);
    socket.on(SERVER_EVENTS.VOICE_ANSWER, onAnswer);
    socket.on(SERVER_EVENTS.VOICE_ICE, onIce);
    socket.on(SERVER_EVENTS.VOICE_SPEAKING, onSpeaking);
    socket.on(SERVER_EVENTS.MEMBER_MUTED, onMemberMuted);
    socket.on(SERVER_EVENTS.MEMBER_UNMUTED, onMemberUnmuted);

    return () => {
      socket.off(SERVER_EVENTS.VOICE_JOINED, onVoiceJoined);
      socket.off(SERVER_EVENTS.VOICE_USER_JOINED, onUserJoined);
      socket.off(SERVER_EVENTS.VOICE_USER_LEFT, onUserLeft);
      socket.off(SERVER_EVENTS.VOICE_OFFER, onOffer);
      socket.off(SERVER_EVENTS.VOICE_ANSWER, onAnswer);
      socket.off(SERVER_EVENTS.VOICE_ICE, onIce);
      socket.off(SERVER_EVENTS.VOICE_SPEAKING, onSpeaking);
      socket.off(SERVER_EVENTS.MEMBER_MUTED, onMemberMuted);
      socket.off(SERVER_EVENTS.MEMBER_UNMUTED, onMemberUnmuted);
    };
  }, [socket, active, createPeerAndOffer, getOrCreatePeer, closePeer, currentUserId]);

  // TURN credentials, fetched before any peer exists so the first connection already has a relay.
  useEffect(() => {
    if (!active) return;
    let alive = true;
    fetch('/api/rooms/turn', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { iceServers?: RTCIceServer[] } | null) => {
        if (alive && body?.iceServers?.length) iceServersRef.current = body.iceServers;
      })
      .catch(() => { /* keep STUN */ });
    return () => { alive = false; };
  }, [active]);

  useEffect(() => () => teardown(), [teardown]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const joinVoice = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      // getUserMedia is gated behind a secure context — over plain http (other than localhost)
      // the API is simply absent, which is worth saying rather than failing silently.
      setErrorMsg('Mikrofon faqat HTTPS orqali ishlaydi');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      stream.getAudioTracks().forEach((track) => { track.enabled = !isMuted; });
      startSpeakingDetection(stream);
      socket?.emit(CLIENT_EVENTS.VOICE_JOIN);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Mikrofonga ruxsat berilmadi');
    }
  }, [socket, isMuted, startSpeakingDetection]);

  const leaveVoice = useCallback(() => {
    teardown();
    socket?.emit(CLIENT_EVENTS.VOICE_LEAVE);
    setIsJoined(false);
    setParticipants([]);
    setErrorMsg(null);
  }, [socket, teardown]);

  const toggleMute = useCallback(() => {
    // Owner-forced mute blocks self-unmute entirely — otherwise MUTE_MEMBER would be purely
    // cosmetic (target just clicks their own mic back on).
    if (forcedMuted) return;
    setIsMuted((prev) => {
      const next = !prev;
      localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next; });
      if (next && wasSpeakingRef.current) {
        wasSpeakingRef.current = false;
        socket?.emit(CLIENT_EVENTS.VOICE_SPEAKING, { speaking: false });
      }
      return next;
    });
  }, [socket, forcedMuted]);

  // Local-only per-participant playback level — a Discord/Zoom-style personal mixer, not a
  // moderation action (nothing is sent to the server; each listener sets their own).
  const setParticipantVolume = useCallback((userId: string, volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    volumesRef.current.set(userId, clamped);
    const el = audioElsRef.current.get(userId);
    if (el) el.volume = clamped;
    setParticipants((prev) => prev.map((p) => (p.userId === userId ? { ...p, volume: clamped } : p)));
  }, []);

  // Auto-join muted once per room session. The ref means a deliberate leaveVoice() is not
  // immediately undone by this effect — same behaviour as mobile.
  const autoJoinedRef = useRef(false);
  useEffect(() => {
    if (!active || !socket) return;
    if (autoJoinedRef.current || isJoined || isLoading) return;
    autoJoinedRef.current = true;
    void joinVoice();
  }, [active, socket, isJoined, isLoading, joinVoice]);

  return {
    isJoined, isMuted, forcedMuted, participants, isLoading, errorMsg, isSpeaking,
    joinVoice, leaveVoice, toggleMute, setParticipantVolume,
  };
}
