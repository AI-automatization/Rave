// WeWatch — VoiceChat hook, rewritten from scratch (2026-11-01).
//
// Design (each rule exists because the previous version broke on it):
//  1. Mesh WebRTC, one RTCPeerConnection per other voice member; signaling over the room socket
//     (voice:offer/answer/ice — server only relays, see services/watch-party voiceEvents.handler.ts).
//  2. Who offers: the side with the SMALLER userId. Both sides learn about each other (VOICE_JOINED
//     list for the newcomer, VOICE_USER_JOINED for the existing members), so exactly one offer is made
//     per pair — no offer/offer collision when two people join at the same moment.
//  3. ICE candidates that arrive before the remote description is set are queued and applied after it
//     (the old code dropped them silently → no audio path).
//  4. The mic track exists from the start of the session and is only enabled/disabled (never re-added):
//     "muted" = track.enabled=false, and joining starts muted. Audio routing (speaker) via InCallManager.
//  5. Every step logs `[voice]` (dev), and a 3s stats probe logs bytes sent/received + audio levels, so
//     "mic does not work" can be told apart as capture / transport / playback straight from the Metro log.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';
import { getIceServers } from '@services/mesh/iceServers';
import { useT } from '@i18n/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoiceParticipant {
  userId: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

type WebRTC = typeof import('react-native-webrtc');
type PC = InstanceType<WebRTC['RTCPeerConnection']>;
type Stream = import('react-native-webrtc').MediaStream;

// ─── Native modules (lazy: Expo Go has neither; voice just stays off) ─────────

let webrtc: WebRTC | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  webrtc = require('react-native-webrtc') as WebRTC;
} catch {
  webrtc = null;
}

type InCallManagerLike = {
  start(opts?: { media?: 'audio' | 'video'; auto?: boolean }): void;
  stop(): void;
  setForceSpeakerphoneOn(flag: boolean): void;
};
let inCallManager: InCallManagerLike | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  inCallManager = (require('react-native-incall-manager') as { default: InCallManagerLike }).default ?? null;
} catch {
  inCallManager = null;
}

function vlog(...args: unknown[]) {
  if (__DEV__) console.log('[voice]', ...args);
}

function startCallAudio() {
  try {
    inCallManager?.start({ media: 'video', auto: false });
    inCallManager?.setForceSpeakerphoneOn(true);
    vlog('call audio started (speaker on)');
  } catch (e) { vlog('call audio start failed', String(e)); }
}

function stopCallAudio() {
  try { inCallManager?.stop(); } catch { /* ignore */ }
}

const STUN_ONLY: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * `active` keeps the voice connection alive for the whole room session (independent of which
 * bottom panel is visible). Auto-joins MUTED once active; the user unmutes with toggleMute().
 */
export function useVoiceChat(active: boolean, myUserId?: string) {
  const { t } = useT();
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(true);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const peers = useRef<Map<string, PC>>(new Map());
  // Candidates received before that peer's remote description was applied.
  const pendingIce = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteReady = useRef<Set<string>>(new Set());
  const localStream = useRef<Stream | null>(null);
  const iceServers = useRef<RTCIceServer[]>(STUN_ONLY);
  const myIdRef = useRef<string | undefined>(myUserId);
  myIdRef.current = myUserId;
  const joinedRef = useRef(false);

  // ─── Peers ─────────────────────────────────────────────────────────────────

  const closePeer = useCallback((uid: string) => {
    const pc = peers.current.get(uid);
    if (pc) { try { pc.close(); } catch { /* ignore */ } }
    peers.current.delete(uid);
    pendingIce.current.delete(uid);
    remoteReady.current.delete(uid);
  }, []);

  const getPeer = useCallback((uid: string): PC | null => {
    const existing = peers.current.get(uid);
    if (existing) return existing;
    if (!webrtc) return null;
    const pc = new webrtc.RTCPeerConnection({ iceServers: iceServers.current });
    const local = localStream.current;
    if (local) local.getTracks().forEach((tr) => pc.addTrack(tr, local));

    type Emitter = { addEventListener(type: string, h: (e: never) => void): void };
    const em = pc as unknown as Emitter;
    em.addEventListener('icecandidate', ((e: { candidate: { toJSON(): Record<string, unknown> } | null }) => {
      if (e.candidate) getSocket()?.emit(CLIENT_EVENTS.VOICE_ICE, { to: uid, candidate: e.candidate.toJSON() });
    }) as never);
    em.addEventListener('track', ((e: { track?: { kind?: string } }) => { vlog('remote track from', uid.slice(-4), e.track?.kind); }) as never);
    em.addEventListener('connectionstatechange', (() => {
      const st = (pc as unknown as { connectionState?: string }).connectionState;
      vlog('peer', uid.slice(-4), 'connectionState =', st);
      if (st === 'failed') { try { (pc as unknown as { restartIce?: () => void }).restartIce?.(); } catch { /* ignore */ } }
    }) as never);
    peers.current.set(uid, pc);
    return pc;
  }, []);

  const flushIce = useCallback(async (uid: string) => {
    const pc = peers.current.get(uid);
    const queued = pendingIce.current.get(uid);
    if (!pc || !queued?.length || !webrtc) return;
    pendingIce.current.delete(uid);
    for (const c of queued) {
      try { await pc.addIceCandidate(new webrtc.RTCIceCandidate(c)); } catch (e) { vlog('queued ICE failed', String(e)); }
    }
    vlog('flushed', queued.length, 'queued ICE for', uid.slice(-4));
  }, []);

  /** Smaller userId makes the offer, so each pair negotiates exactly once. */
  const shouldOffer = useCallback((uid: string): boolean => {
    const me = myIdRef.current;
    return !!me && me < uid;
  }, []);

  const offerTo = useCallback(async (uid: string) => {
    const pc = getPeer(uid);
    if (!pc) return;
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      getSocket()?.emit(CLIENT_EVENTS.VOICE_OFFER, { to: uid, offer: pc.localDescription });
      vlog('offer sent to', uid.slice(-4));
    } catch (e) { vlog('offer failed', String(e)); }
  }, [getPeer]);

  // ─── Socket handlers ───────────────────────────────────────────────────────

  const onJoined = useCallback((data: { members: string[]; muted?: string[] }) => {
    vlog('joined; others in voice =', data.members.length);
    const mutedIds = new Set(data.muted ?? []);
    setParticipants((prev) => {
      const next = [...prev];
      for (const id of data.members) {
        if (!next.find((p) => p.userId === id)) next.push({ userId: id, isMuted: mutedIds.has(id), isSpeaking: false });
      }
      return next;
    });
    setIsJoined(true);
    setIsLoading(false);
    joinedRef.current = true;
    for (const id of data.members) if (shouldOffer(id)) void offerTo(id);
    // Tell the others our mic state (starts muted).
    getSocket()?.emit(CLIENT_EVENTS.VOICE_MUTE, { muted: isMutedRef.current });
  }, [offerTo, shouldOffer]);

  const onUserJoined = useCallback((data: { userId: string }) => {
    vlog('user joined voice', data.userId.slice(-4));
    setParticipants((prev) => (prev.find((p) => p.userId === data.userId)
      ? prev
      : [...prev, { userId: data.userId, isMuted: true, isSpeaking: false }]));
    if (joinedRef.current && shouldOffer(data.userId)) void offerTo(data.userId);
  }, [offerTo, shouldOffer]);

  const onUserLeft = useCallback((data: { userId: string }) => {
    vlog('user left voice', data.userId.slice(-4));
    closePeer(data.userId);
    setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
  }, [closePeer]);

  const onOffer = useCallback(async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
    if (!webrtc) return;
    // A fresh offer replaces any stale connection to that user (e.g. they rejoined).
    closePeer(data.from);
    const pc = getPeer(data.from);
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new webrtc.RTCSessionDescription({ ...data.offer, sdp: data.offer.sdp ?? '' }));
      remoteReady.current.add(data.from);
      await flushIce(data.from);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      getSocket()?.emit(CLIENT_EVENTS.VOICE_ANSWER, { to: data.from, answer: pc.localDescription });
      vlog('answer sent to', data.from.slice(-4));
    } catch (e) { vlog('handle offer failed', String(e)); }
  }, [closePeer, getPeer, flushIce]);

  const onAnswer = useCallback(async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
    if (!webrtc) return;
    const pc = peers.current.get(data.from);
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new webrtc.RTCSessionDescription({ ...data.answer, sdp: data.answer.sdp ?? '' }));
      remoteReady.current.add(data.from);
      await flushIce(data.from);
      vlog('answer applied from', data.from.slice(-4));
    } catch (e) { vlog('handle answer failed', String(e)); }
  }, [flushIce]);

  const onIce = useCallback(async (data: { from: string; candidate: RTCIceCandidateInit }) => {
    if (!webrtc) return;
    const pc = peers.current.get(data.from);
    if (!pc || !remoteReady.current.has(data.from)) {
      const q = pendingIce.current.get(data.from) ?? [];
      q.push(data.candidate);
      pendingIce.current.set(data.from, q);
      return;
    }
    try { await pc.addIceCandidate(new webrtc.RTCIceCandidate(data.candidate)); } catch (e) { vlog('ICE failed', String(e)); }
  }, []);

  const onMute = useCallback((data: { userId: string; muted: boolean }) => {
    setParticipants((prev) => prev.map((p) => (p.userId === data.userId
      ? { ...p, isMuted: data.muted, isSpeaking: data.muted ? false : p.isSpeaking }
      : p)));
  }, []);

  const onSpeaking = useCallback((data: { userId: string; speaking: boolean }) => {
    setParticipants((prev) => prev.map((p) => (p.userId === data.userId ? { ...p, isSpeaking: data.speaking } : p)));
  }, []);

  // Register socket listeners while active.
  useEffect(() => {
    if (!active) return;
    const socket = getSocket();
    if (!socket) return;
    socket.on(SERVER_EVENTS.VOICE_JOINED, onJoined);
    socket.on(SERVER_EVENTS.VOICE_USER_JOINED, onUserJoined);
    socket.on(SERVER_EVENTS.VOICE_USER_LEFT, onUserLeft);
    socket.on(SERVER_EVENTS.VOICE_OFFER, onOffer);
    socket.on(SERVER_EVENTS.VOICE_ANSWER, onAnswer);
    socket.on(SERVER_EVENTS.VOICE_ICE, onIce);
    socket.on(SERVER_EVENTS.VOICE_MUTE, onMute);
    socket.on(SERVER_EVENTS.VOICE_SPEAKING, onSpeaking);
    return () => {
      socket.off(SERVER_EVENTS.VOICE_JOINED, onJoined);
      socket.off(SERVER_EVENTS.VOICE_USER_JOINED, onUserJoined);
      socket.off(SERVER_EVENTS.VOICE_USER_LEFT, onUserLeft);
      socket.off(SERVER_EVENTS.VOICE_OFFER, onOffer);
      socket.off(SERVER_EVENTS.VOICE_ANSWER, onAnswer);
      socket.off(SERVER_EVENTS.VOICE_ICE, onIce);
      socket.off(SERVER_EVENTS.VOICE_MUTE, onMute);
      socket.off(SERVER_EVENTS.VOICE_SPEAKING, onSpeaking);
    };
  }, [active, onJoined, onUserJoined, onUserLeft, onOffer, onAnswer, onIce, onMute, onSpeaking]);

  // TURN/STUN from the backend, before any peer is created.
  useEffect(() => {
    if (!active || !webrtc) return;
    let alive = true;
    getIceServers().then((s) => { if (alive && s.length) iceServers.current = s; }).catch(() => { /* keep STUN */ });
    return () => { alive = false; };
  }, [active]);

  // ─── Teardown ──────────────────────────────────────────────────────────────

  const teardown = useCallback(() => {
    peers.current.forEach((pc) => { try { pc.close(); } catch { /* ignore */ } });
    peers.current.clear();
    pendingIce.current.clear();
    remoteReady.current.clear();
    localStream.current?.getTracks().forEach((tr) => tr.stop());
    localStream.current = null;
    joinedRef.current = false;
    stopCallAudio();
  }, []);

  useEffect(() => () => { teardown(); }, [teardown]);

  // ─── Public actions ────────────────────────────────────────────────────────

  const joinVoice = useCallback(async () => {
    if (!webrtc) { setErrorMsg('Voice chat requires a native build (not Expo Go).'); return; }
    if (joinedRef.current || localStream.current) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const stream = (await webrtc.mediaDevices.getUserMedia({ audio: true, video: false })) as Stream;
      localStream.current = stream;
      stream.getAudioTracks().forEach((tr) => { tr.enabled = !isMutedRef.current; });
      vlog('mic captured; tracks =', stream.getAudioTracks().length, 'enabled =', !isMutedRef.current);
      startCallAudio();
      getSocket()?.emit(CLIENT_EVENTS.VOICE_JOIN);
    } catch (e) {
      vlog('getUserMedia failed', String(e));
      setIsLoading(false);
      setErrorMsg(t('watchParty', 'micError'));
    }
  }, [t]);

  const leaveVoice = useCallback(() => {
    teardown();
    getSocket()?.emit(CLIENT_EVENTS.VOICE_LEAVE);
    setIsJoined(false);
    setParticipants([]);
    setErrorMsg(null);
  }, [teardown]);

  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    localStream.current?.getAudioTracks().forEach((tr) => { tr.enabled = !next; });
    getSocket()?.emit(CLIENT_EVENTS.VOICE_MUTE, { muted: next });
    if (next) getSocket()?.emit(CLIENT_EVENTS.VOICE_SPEAKING, { speaking: false });
    vlog('mic', next ? 'MUTED' : 'LIVE');
  }, []);

  // Auto-join (muted) once per mount when the room is ready.
  const autoJoined = useRef(false);
  useEffect(() => {
    if (!active || !webrtc || !myUserId) return;
    if (autoJoined.current) return;
    autoJoined.current = true;
    void joinVoice();
  }, [active, myUserId, joinVoice]);

  // Dev stats probe: bytes + audio levels per peer every 3s.
  useEffect(() => {
    if (!__DEV__ || !active) return;
    const id = setInterval(() => {
      peers.current.forEach((pc, uid) => {
        (pc as unknown as { getStats(): Promise<Map<string, Record<string, unknown>>> }).getStats().then((report) => {
          const out: Record<string, unknown> = { peer: uid.slice(-4), state: (pc as unknown as { connectionState?: string }).connectionState };
          report.forEach((r) => {
            if (r.type === 'outbound-rtp' && r.kind === 'audio') { out.sentBytes = r.bytesSent; out.sentPackets = r.packetsSent; }
            if (r.type === 'inbound-rtp' && r.kind === 'audio') { out.recvBytes = r.bytesReceived; out.recvLevel = r.audioLevel; }
            if (r.type === 'media-source' && r.kind === 'audio') out.micLevel = r.audioLevel;
          });
          vlog('stats', JSON.stringify(out), 'muted=', isMutedRef.current);
        }).catch(() => { /* ignore */ });
      });
    }, 3000);
    return () => clearInterval(id);
  }, [active]);

  return { isJoined, isMuted, participants, isLoading, errorMsg, joinVoice, leaveVoice, toggleMute };
}
