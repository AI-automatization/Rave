// CineSync Mobile — VoiceChat
// WebRTC peer-to-peer audio for watch party rooms.
// Requires expo-dev-client (won't work in Expo Go — native modules needed).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';
import { colors, spacing, borderRadius, typography } from '@theme/index';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoiceParticipant {
  userId: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface VoiceChatProps {
  roomId: string;
  currentUserId: string;
  visible: boolean;
  onClose: () => void;
}

// ─── WebRTC lazy imports (won't crash Expo Go — just voice won't work) ────────

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

// ─── ICE servers (Google STUN) ────────────────────────────────────────────────

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function VoiceChat({ roomId, currentUserId, visible, onClose }: VoiceChatProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Peer connections map: userId → RTCPeerConnection
  const peerRefs = useRef<Map<string, InstanceType<NonNullable<typeof RTCPeerConnection>>>>(new Map());
  const localStreamRef = useRef<import('react-native-webrtc').MediaStream | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Socket event handlers ─────────────────────────────────────────────────

  const handleVoiceJoined = useCallback(
    async (data: { members: string[] }) => {
      // Server confirmed join — create peer connections to all existing members
      for (const memberId of data.members) {
        await createPeerAndOffer(memberId);
      }
      setIsJoined(true);
      setIsLoading(false);
      setParticipants(prev => {
        const next = [...prev];
        for (const id of data.members) {
          if (!next.find(p => p.userId === id)) {
            next.push({ userId: id, isMuted: false, isSpeaking: false });
          }
        }
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleUserJoined = useCallback((data: { userId: string }) => {
    setParticipants(prev =>
      prev.find(p => p.userId === data.userId)
        ? prev
        : [...prev, { userId: data.userId, isMuted: false, isSpeaking: false }],
    );
    // They will send an offer to us — no need to initiate here
  }, []);

  const handleUserLeft = useCallback((data: { userId: string }) => {
    closePeer(data.userId);
    setParticipants(prev => prev.filter(p => p.userId !== data.userId));
  }, []);

  const handleOffer = useCallback(
    async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      if (!RTCPeerConnection || !RTCSessionDescription || !RTCIceCandidate) return;
      const pc = getOrCreatePeer(data.from);
      await pc.setRemoteDescription(new RTCSessionDescription({ ...data.offer, sdp: data.offer.sdp ?? '' }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      getSocket()?.emit(CLIENT_EVENTS.VOICE_ANSWER, {
        to: data.from,
        answer: pc.localDescription,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleAnswer = useCallback(
    async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      if (!RTCSessionDescription) return;
      const pc = peerRefs.current.get(data.from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription({ ...data.answer, sdp: data.answer.sdp ?? '' }));
    },
    [],
  );

  const handleIce = useCallback(
    async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      if (!RTCIceCandidate) return;
      const pc = peerRefs.current.get(data.from);
      if (pc) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch { /* ignore */ }
      }
    },
    [],
  );

  const handleSpeaking = useCallback((data: { userId: string; speaking: boolean }) => {
    setParticipants(prev =>
      prev.map(p => p.userId === data.userId ? { ...p, isSpeaking: data.speaking } : p),
    );
  }, []);

  // ─── Register socket events ────────────────────────────────────────────────

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

  // ─── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      leaveVoiceInternal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Peer helpers ──────────────────────────────────────────────────────────

  function getOrCreatePeer(userId: string): InstanceType<NonNullable<typeof RTCPeerConnection>> {
    if (peerRefs.current.has(userId)) return peerRefs.current.get(userId)!;

    const pc = new RTCPeerConnection!({ iceServers: ICE_SERVERS });

    // Add local audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE candidate handler
    // react-native-webrtc EventTarget extends are not fully resolved by TS — cast needed
    type IceCandidateEmitter = { addEventListener(type: 'icecandidate', h: (e: { candidate: { toJSON(): Record<string, unknown> } | null }) => void): void };
    (pc as unknown as IceCandidateEmitter).addEventListener('icecandidate', (e) => {
      if (e.candidate) {
        getSocket()?.emit(CLIENT_EVENTS.VOICE_ICE, {
          to: userId,
          candidate: e.candidate.toJSON(),
        });
      }
    });

    peerRefs.current.set(userId, pc);
    return pc;
  }

  async function createPeerAndOffer(userId: string) {
    if (!RTCPeerConnection || !RTCSessionDescription) return;
    const pc = getOrCreatePeer(userId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    getSocket()?.emit(CLIENT_EVENTS.VOICE_OFFER, {
      to: userId,
      offer: pc.localDescription,
    });
  }

  function closePeer(userId: string) {
    const pc = peerRefs.current.get(userId);
    if (pc) { pc.close(); peerRefs.current.delete(userId); }
  }

  function closeAllPeers() {
    peerRefs.current.forEach(pc => pc.close());
    peerRefs.current.clear();
  }

  function leaveVoiceInternal() {
    closeAllPeers();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
  }

  // ─── Join / Leave ──────────────────────────────────────────────────────────

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

      // Mute state
      stream.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });

      // Periodic speaking detection via audio level (simplified)
      let speaking = false;
      speakingTimerRef.current = setInterval(() => {
        // Without AudioContext (not available in RN), we use a simple toggle based on stream activity
        // A proper implementation would use audio worklets or native level monitoring
        const track = stream.getAudioTracks()[0];
        if (!track || !track.enabled) {
          if (speaking) {
            speaking = false;
            getSocket()?.emit(CLIENT_EVENTS.VOICE_SPEAKING, { speaking: false });
          }
        }
      }, 3000);

      getSocket()?.emit(CLIENT_EVENTS.VOICE_JOIN);
      // handleVoiceJoined will set isJoined=true after server confirms
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = (err as { message?: string })?.message ?? 'Не удалось получить доступ к микрофону.';
      setErrorMsg(msg);
    }
  }, [isMuted]);

  const leaveVoice = useCallback(() => {
    leaveVoiceInternal();
    getSocket()?.emit(CLIENT_EVENTS.VOICE_LEAVE);
    setIsJoined(false);
    setParticipants([]);
    setErrorMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      const tracks = localStreamRef.current?.getAudioTracks() ?? [];
      tracks.forEach((t) => { t.enabled = !next; });
      if (next) getSocket()?.emit(CLIENT_EVENTS.VOICE_SPEAKING, { speaking: false });
      return next;
    });
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!visible) return null;

  // Self participant entry
  const selfEntry: VoiceParticipant = {
    userId: currentUserId,
    isMuted,
    isSpeaking: false,
  };
  const allParticipants = isJoined
    ? [selfEntry, ...participants]
    : participants;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="mic" size={16} color={colors.primary} />
        <Text style={styles.headerTitle}>Голосовой чат</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Error */}
      {errorMsg ? (
        <View style={styles.errorBox}>
          <Ionicons name="warning-outline" size={16} color="#F59E0B" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Participants */}
      <ScrollView style={styles.participantList} showsVerticalScrollIndicator={false}>
        {allParticipants.map(p => (
          <View key={p.userId} style={styles.participantRow}>
            <View style={[styles.avatarCircle, p.isSpeaking && styles.avatarSpeaking]}>
              <Ionicons
                name={p.isMuted ? 'mic-off' : 'mic'}
                size={14}
                color={p.isMuted ? '#6B7280' : colors.primary}
              />
            </View>
            <Text style={styles.participantName} numberOfLines={1}>
              {p.userId === currentUserId ? 'Вы' : p.userId.slice(-6)}
            </Text>
            {p.isSpeaking && (
              <View style={styles.speakingDot} />
            )}
            {p.isMuted && (
              <Ionicons name="mic-off-outline" size={14} color="#6B7280" />
            )}
          </View>
        ))}
        {allParticipants.length === 0 && (
          <Text style={styles.emptyText}>Никого нет в голосовом чате</Text>
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        {isJoined ? (
          <>
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.controlBtnMuted]}
              onPress={toggleMute}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={20}
                color={isMuted ? '#9CA3AF' : '#fff'}
              />
              <Text style={[styles.controlText, isMuted && styles.controlTextMuted]}>
                {isMuted ? 'Включить' : 'Выключить'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.leaveBtn} onPress={leaveVoice}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.leaveBtnText}>Выйти</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, isLoading && styles.joinBtnLoading]}
            onPress={joinVoice}
            disabled={isLoading}
          >
            <Ionicons name="mic" size={20} color="#fff" />
            <Text style={styles.joinBtnText}>
              {isLoading ? 'Подключение...' : 'Войти в голосовой чат'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111118',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    maxHeight: 320,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: borderRadius.md,
  },
  errorText: {
    flex: 1,
    ...typography.caption,
    color: '#F59E0B',
    lineHeight: 18,
  },
  participantList: {
    maxHeight: 140,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSpeaking: {
    backgroundColor: 'rgba(229,9,20,0.2)',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  participantName: {
    flex: 1,
    ...typography.caption,
    color: '#D1D5DB',
    fontSize: 13,
  },
  speakingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyText: {
    ...typography.caption,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  joinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  joinBtnLoading: {
    opacity: 0.6,
  },
  joinBtnText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '700',
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(229,9,20,0.15)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.3)',
  },
  controlBtnMuted: {
    backgroundColor: 'rgba(107,114,128,0.15)',
    borderColor: 'rgba(107,114,128,0.3)',
  },
  controlText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  controlTextMuted: {
    color: '#9CA3AF',
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#7F1D1D',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  leaveBtnText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
  },
});
