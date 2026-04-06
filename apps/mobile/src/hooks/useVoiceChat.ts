// CineSync — VoiceChat hook (WebRTC peer connections, socket signaling, audio tracks)
// Requires expo-dev-client — react-native-webrtc won't work in Expo Go.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoiceParticipant {
  userId: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

// ─── WebRTC lazy imports (won't crash Expo Go — voice just won't work) ────────

let RTCPeerConnection: typeof import('react-native-webrtc').RTCPeerConnection | null = null;
let RTCIceCandidate: typeof import('react-native-webrtc').RTCIceCandidate | null = null;
let RTCSessionDescription: typeof import('react-native-webrtc').RTCSessionDescription | null = null;
let mediaDevices: typeof import('react-native-webrtc').mediaDevices | null = null;
let isWebRTCAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webrtc = require('react-native-webrtc') as typeof import('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  mediaDevices = webrtc.mediaDevices;
  isWebRTCAvailable = true;
} catch {
  isWebRTCAvailable = false;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceChat(visible: boolean) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const peerRefs = useRef<Map<string, InstanceType<NonNullable<typeof RTCPeerConnection>>>>(new Map());
  const localStreamRef = useRef<import('react-native-webrtc').MediaStream | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Peer helpers ────────────────────────────────────────────────────────────

  const getOrCreatePeer = useCallback((userId: string) => {
    if (peerRefs.current.has(userId)) return peerRefs.current.get(userId)!;
    const pc = new RTCPeerConnection!({ iceServers: ICE_SERVERS });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
    }
    type IceCandidateEmitter = { addEventListener(type: 'icecandidate', h: (e: { candidate: { toJSON(): Record<string, unknown> } | null }) => void): void };
    (pc as unknown as IceCandidateEmitter).addEventListener('icecandidate', (e) => {
      if (e.candidate) {
        getSocket()?.emit(CLIENT_EVENTS.VOICE_ICE, { to: userId, candidate: e.candidate.toJSON() });
      }
    });
    peerRefs.current.set(userId, pc);
    return pc;
  }, []);

  const createPeerAndOffer = useCallback(async (userId: string) => {
    if (!RTCPeerConnection || !RTCSessionDescription) return;
    const pc = getOrCreatePeer(userId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    getSocket()?.emit(CLIENT_EVENTS.VOICE_OFFER, { to: userId, offer: pc.localDescription });
  }, [getOrCreatePeer]);

  const closePeer = useCallback((userId: string) => {
    const pc = peerRefs.current.get(userId);
    if (pc) { pc.close(); peerRefs.current.delete(userId); }
  }, []);

  const leaveVoiceInternal = useCallback(() => {
    peerRefs.current.forEach(pc => pc.close());
    peerRefs.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
  }, []);

  // ─── Socket event handlers ───────────────────────────────────────────────────

  const handleVoiceJoined = useCallback(async (data: { members: string[] }) => {
    for (const memberId of data.members) await createPeerAndOffer(memberId);
    setIsJoined(true);
    setIsLoading(false);
    setParticipants(prev => {
      const next = [...prev];
      for (const id of data.members) {
        if (!next.find(p => p.userId === id)) next.push({ userId: id, isMuted: false, isSpeaking: false });
      }
      return next;
    });
  }, [createPeerAndOffer]);

  const handleUserJoined = useCallback((data: { userId: string }) => {
    setParticipants(prev =>
      prev.find(p => p.userId === data.userId)
        ? prev
        : [...prev, { userId: data.userId, isMuted: false, isSpeaking: false }],
    );
  }, []);

  const handleUserLeft = useCallback((data: { userId: string }) => {
    closePeer(data.userId);
    setParticipants(prev => prev.filter(p => p.userId !== data.userId));
  }, [closePeer]);

  const handleOffer = useCallback(async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
    if (!RTCPeerConnection || !RTCSessionDescription || !RTCIceCandidate) return;
    const pc = getOrCreatePeer(data.from);
    await pc.setRemoteDescription(new RTCSessionDescription({ ...data.offer, sdp: data.offer.sdp ?? '' }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    getSocket()?.emit(CLIENT_EVENTS.VOICE_ANSWER, { to: data.from, answer: pc.localDescription });
  }, [getOrCreatePeer]);

  const handleAnswer = useCallback(async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
    if (!RTCSessionDescription) return;
    const pc = peerRefs.current.get(data.from);
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription({ ...data.answer, sdp: data.answer.sdp ?? '' }));
  }, []);

  const handleIce = useCallback(async (data: { from: string; candidate: RTCIceCandidateInit }) => {
    if (!RTCIceCandidate) return;
    const pc = peerRefs.current.get(data.from);
    if (pc) { try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch { /* ignore */ } }
  }, []);

  const handleSpeaking = useCallback((data: { userId: string; speaking: boolean }) => {
    setParticipants(prev => prev.map(p => p.userId === data.userId ? { ...p, isSpeaking: data.speaking } : p));
  }, []);

  // ─── Socket registration ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;
    const socket = getSocket();
    if (!socket) return;
    socket.on(SERVER_EVENTS.VOICE_JOINED, handleVoiceJoined);
    socket.on(SERVER_EVENTS.VOICE_USER_JOINED, handleUserJoined);
    socket.on(SERVER_EVENTS.VOICE_USER_LEFT, handleUserLeft);
    socket.on(SERVER_EVENTS.VOICE_OFFER, handleOffer);
    socket.on(SERVER_EVENTS.VOICE_ANSWER, handleAnswer);
    socket.on(SERVER_EVENTS.VOICE_ICE, handleIce);
    socket.on(SERVER_EVENTS.VOICE_SPEAKING, handleSpeaking);
    return () => {
      socket.off(SERVER_EVENTS.VOICE_JOINED, handleVoiceJoined);
      socket.off(SERVER_EVENTS.VOICE_USER_JOINED, handleUserJoined);
      socket.off(SERVER_EVENTS.VOICE_USER_LEFT, handleUserLeft);
      socket.off(SERVER_EVENTS.VOICE_OFFER, handleOffer);
      socket.off(SERVER_EVENTS.VOICE_ANSWER, handleAnswer);
      socket.off(SERVER_EVENTS.VOICE_ICE, handleIce);
      socket.off(SERVER_EVENTS.VOICE_SPEAKING, handleSpeaking);
    };
  }, [visible, handleVoiceJoined, handleUserJoined, handleUserLeft, handleOffer, handleAnswer, handleIce, handleSpeaking]);

  useEffect(() => () => { leaveVoiceInternal(); }, [leaveVoiceInternal]);

  // ─── Public actions ───────────────────────────────────────────────────────────

  const joinVoice = useCallback(async () => {
    if (!isWebRTCAvailable || !mediaDevices) {
      setErrorMsg('Voice chat требует нативную сборку (expo run:ios). Expo Go не поддерживает WebRTC.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream as import('react-native-webrtc').MediaStream;
      stream.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });
      speakingTimerRef.current = setInterval(() => {
        const track = stream.getAudioTracks()[0];
        if (!track?.enabled) getSocket()?.emit(CLIENT_EVENTS.VOICE_SPEAKING, { speaking: false });
      }, 3000);
      getSocket()?.emit(CLIENT_EVENTS.VOICE_JOIN);
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMsg((err as { message?: string })?.message ?? 'Не удалось получить доступ к микрофону.');
    }
  }, [isMuted]);

  const leaveVoice = useCallback(() => {
    leaveVoiceInternal();
    getSocket()?.emit(CLIENT_EVENTS.VOICE_LEAVE);
    setIsJoined(false);
    setParticipants([]);
    setErrorMsg(null);
  }, [leaveVoiceInternal]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next; });
      if (next) getSocket()?.emit(CLIENT_EVENTS.VOICE_SPEAKING, { speaking: false });
      return next;
    });
  }, []);

  return { isJoined, isMuted, participants, isLoading, errorMsg, joinVoice, leaveVoice, toggleMute };
}

