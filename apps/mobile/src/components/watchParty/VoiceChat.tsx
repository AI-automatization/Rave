// WeWatch Mobile — VoiceChat
// WebRTC peer-to-peer audio for watch party rooms.
// Requires expo-dev-client (won't work in Expo Go — native modules needed).
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceChat } from '@hooks/useVoiceChat';
import { VoiceChatParticipants } from './VoiceChatParticipants';
import { VoiceChatControls } from './VoiceChatControls';

interface VoiceChatProps {
  roomId: string;
  currentUserId: string;
  visible: boolean;
  onClose: () => void;
}

export function VoiceChat({ roomId: _roomId, currentUserId, visible, onClose }: VoiceChatProps) {
  const { isJoined, isMuted, participants, isLoading, errorMsg, joinVoice, leaveVoice, toggleMute } =
    useVoiceChat(visible);

  if (!visible) return null;

  const micActive = isJoined && !isMuted;

  return (
    <View style={s.container}>
      {/* Handle */}
      <View style={s.handle} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={[s.micBadge, micActive && s.micBadgeActive]}>
            <Ionicons
              name={micActive ? 'mic' : 'mic-outline'}
              size={16}
              color={micActive ? '#fff' : 'rgba(255,255,255,0.45)'}
            />
          </View>
          <View>
            <Text style={s.title}>Ovozli chat</Text>
            <Text style={s.subtitle}>
              {isJoined
                ? `${participants.length} ishtirokchi ulangan`
                : 'Real-vaqt WebRTC audio'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={s.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-down" size={22} color="rgba(255,255,255,0.45)" />
        </TouchableOpacity>
      </View>

      {/* Error */}
      {errorMsg ? (
        <View style={s.errorBox}>
          <Ionicons name="warning-outline" size={14} color="#F59E0B" />
          <Text style={s.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Participants */}
      <VoiceChatParticipants
        participants={isJoined ? participants : []}
        currentUserId={currentUserId}
        isMuted={isMuted}
      />

      {/* Controls */}
      <VoiceChatControls
        isJoined={isJoined}
        isMuted={isMuted}
        isLoading={isLoading}
        onJoin={joinVoice}
        onLeave={leaveVoice}
        onToggleMute={toggleMute}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#111120',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    maxHeight: 360,
    borderTopWidth: 1,
    borderTopColor: 'rgba(123,114,248,0.20)',
  },

  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  micBadge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  micBadgeActive: {
    backgroundColor: '#7B72F8',
    borderColor: '#7B72F8',
    shadowColor: '#7B72F8',
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  title: { fontSize: 14, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 },

  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    margin: 12,
    padding: 12,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.18)',
  },
  errorText: { flex: 1, fontSize: 12, color: '#F59E0B', lineHeight: 18 },
});
