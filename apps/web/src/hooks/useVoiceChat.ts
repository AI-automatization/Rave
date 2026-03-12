'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { logger } from '@/lib/logger';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // TURN — telefon ↔ noutbuk (turli network) da P2P uchun kerak
  { urls: 'turn:openrelay.metered.ca:80',  username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
];

// Speaking threshold — avg frequency power above this = talking
const SPEAKING_THRESHOLD = 18;
// Only emit speaking state change to server (debounced via interval)
const SPEAKING_INTERVAL_MS = 150;

export interface UseVoiceChatReturn {
  isInVoice: boolean;
  isMuted: boolean;
  speakingUsers: string[];
  voiceMembers: string[];
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
}

export function useVoiceChat(roomId: string, userId?: string): UseVoiceChatReturn {
  const [isInVoice, setIsInVoice]       = useState(false);
  const [isMuted, setIsMuted]           = useState(false);
  const [voiceMembers, setVoiceMembers] = useState<string[]>([]);
  const [speakingUsers, setSpeaking]    = useState<string[]>([]);

  const localStreamRef        = useRef<MediaStream | null>(null);
  const peersRef              = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef       = useRef<Map<string, HTMLAudioElement>>(new Map());
  const iceCandidateBufferRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const speakingTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef           = useRef<AudioContext | null>(null);
  const lastSpeakingRef       = useRef(false);
  const isInVoiceRef          = useRef(false); // sync ref — React state async bo'lgani uchun kerak

  /* ── Create peer connection to one remote user ─────────────── */
  const createPeer = useCallback((targetId: string): RTCPeerConnection => {
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(targetId, peer);

    localStreamRef.current?.getTracks().forEach((t) => {
      peer.addTrack(t, localStreamRef.current!);
    });

    peer.ontrack = (ev) => {
      let audio = remoteAudiosRef.current.get(targetId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        remoteAudiosRef.current.set(targetId, audio);
      }
      audio.srcObject = ev.streams[0];
      void audio.play().catch(() => {});
    };

    peer.onicecandidate = (ev) => {
      if (ev.candidate) {
        getSocket().emit('voice:ice', { to: targetId, candidate: ev.candidate });
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed' || peer.connectionState === 'closed') {
        peer.close();
        peersRef.current.delete(targetId);
      }
    };

    // Peer yaratilishidan oldin kelgan ICE kandidatlarni flush qilish
    const buffered = iceCandidateBufferRef.current.get(targetId);
    if (buffered?.length) {
      buffered.forEach((c) => void peer.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}));
      iceCandidateBufferRef.current.delete(targetId);
    }

    return peer;
  }, []);

  const destroyPeer = useCallback((targetId: string) => {
    peersRef.current.get(targetId)?.close();
    peersRef.current.delete(targetId);
    iceCandidateBufferRef.current.delete(targetId);
    const audio = remoteAudiosRef.current.get(targetId);
    if (audio) { audio.srcObject = null; remoteAudiosRef.current.delete(targetId); }
  }, []);

  /* ── Local speaking detection + relay ─────────────────────── */
  const startSpeakingDetection = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);

    speakingTimerRef.current = setInterval(() => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
      if (!userId) return;

      const speaking = avg > SPEAKING_THRESHOLD;

      // Update local speaking state
      setSpeaking((prev) => {
        const has = prev.includes(userId);
        if (speaking && !has) return [...prev, userId];
        if (!speaking && has) return prev.filter((id) => id !== userId);
        return prev;
      });

      // Relay speaking state change to server (only on toggle)
      if (speaking !== lastSpeakingRef.current) {
        lastSpeakingRef.current = speaking;
        getSocket().emit('voice:speaking', { speaking });
      }
    }, SPEAKING_INTERVAL_MS);
  }, [userId]);

  /* ── Socket listeners — doim aktiv (isInVoice ga bog'liq emas) ──
   *
   * BUG FIX: Avval isInVoice useEffect ichida edi — React state async
   * bo'lgani uchun joinVoice() offer yuborib, answer kelguncha listener
   * hali ro'yxatga olinmagan bo'lardi. isInVoiceRef (sync) bilan hal qilindi.
   * ──────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const socket = getSocket();

    const onOffer = async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      if (!isInVoiceRef.current) return;
      const peer = createPeer(data.from);
      await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('voice:answer', { to: data.from, answer });
    };

    const onAnswer = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      if (!isInVoiceRef.current) return;
      const peer = peersRef.current.get(data.from);
      if (peer?.signalingState === 'have-local-offer') {
        await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    };

    const onIce = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      if (!isInVoiceRef.current) return;
      const peer = peersRef.current.get(data.from);
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
      } else {
        // Peer hali yaratilmagan — bufferga saqlab tur
        const buf = iceCandidateBufferRef.current.get(data.from) ?? [];
        buf.push(data.candidate);
        iceCandidateBufferRef.current.set(data.from, buf);
      }
    };

    const onUserJoined = (data: { userId: string }) => {
      if (!isInVoiceRef.current) return;
      setVoiceMembers((p) => p.includes(data.userId) ? p : [...p, data.userId]);
    };

    const onUserLeft = (data: { userId: string }) => {
      if (!isInVoiceRef.current) return;
      setVoiceMembers((p) => p.filter((id) => id !== data.userId));
      setSpeaking((p) => p.filter((id) => id !== data.userId));
      destroyPeer(data.userId);
    };

    const onRemoteSpeaking = (data: { userId: string; speaking: boolean }) => {
      if (!isInVoiceRef.current) return;
      setSpeaking((prev) => {
        const has = prev.includes(data.userId);
        if (data.speaking && !has) return [...prev, data.userId];
        if (!data.speaking && has) return prev.filter((id) => id !== data.userId);
        return prev;
      });
    };

    socket.on('voice:offer',       (d: Parameters<typeof onOffer>[0])  => { void onOffer(d); });
    socket.on('voice:answer',      (d: Parameters<typeof onAnswer>[0]) => { void onAnswer(d); });
    socket.on('voice:ice',         (d: Parameters<typeof onIce>[0])    => { void onIce(d); });
    socket.on('voice:user_joined', onUserJoined);
    socket.on('voice:user_left',   onUserLeft);
    socket.on('voice:speaking',    onRemoteSpeaking);

    return () => {
      socket.off('voice:offer');
      socket.off('voice:answer');
      socket.off('voice:ice');
      socket.off('voice:user_joined');
      socket.off('voice:user_left');
      socket.off('voice:speaking');
    };
  }, [createPeer, destroyPeer]);

  /* ── Join voice ─────────────────────────────────────────────── */
  const joinVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      startSpeakingDetection(stream);

      const socket = getSocket();
      socket.emit('voice:join', { roomId });

      socket.once('voice:joined', async (data: { members: string[] }) => {
        const existingMembers = data.members.filter((id) => id !== userId);
        setVoiceMembers(userId ? [...existingMembers, userId] : existingMembers);
        // isInVoiceRef SYNC o'rnatiladi — React re-render kutilmaydi
        // Offerga javob (answer) kelguncha listener tayyor bo'lishi shart
        isInVoiceRef.current = true;
        setIsInVoice(true);

        for (const memberId of existingMembers) {
          const peer = createPeer(memberId);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('voice:offer', { to: memberId, offer });
        }
      });
    } catch (err) {
      logger.error('Mikrofon ruxsati rad etildi yoki ovozli chat xatosi', err);
    }
  }, [roomId, userId, createPeer, startSpeakingDetection]);

  /* ── Leave voice ────────────────────────────────────────────── */
  const leaveVoice = useCallback(() => {
    isInVoiceRef.current = false; // yangi eventlar ignore qilinadi
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    peersRef.current.forEach((_, id) => destroyPeer(id));
    remoteAudiosRef.current.forEach((a) => { a.srcObject = null; });
    remoteAudiosRef.current.clear();
    iceCandidateBufferRef.current.clear();

    if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
    if (audioCtxRef.current) void audioCtxRef.current.close();

    lastSpeakingRef.current = false;
    getSocket().emit('voice:leave', { roomId });
    setIsInVoice(false);
    setVoiceMembers([]);
    setSpeaking([]);
    setIsMuted(false);
  }, [roomId, destroyPeer]);

  /* ── Toggle mute ────────────────────────────────────────────── */
  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (isInVoiceRef.current) leaveVoice(); }, [leaveVoice]);

  return { isInVoice, isMuted, speakingUsers, voiceMembers, joinVoice, leaveVoice, toggleMute };
}
