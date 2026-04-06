// CineSync Mobile — VoiceChat
// WebRTC peer-to-peer audio for watch party rooms.
// Requires expo-dev-client (won't work in Expo Go — native modules needed).
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
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

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Ionicons name="mic" size={16} color={colors.primary} />
        <Text style={s.headerTitle}>Голосовой чат</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {errorMsg ? (
        <View style={s.errorBox}>
          <Ionicons name="warning-outline" size={16} color="#F59E0B" />
          <Text style={s.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <VoiceChatParticipants
        participants={isJoined ? participants : []}
        currentUserId={currentUserId}
        isMuted={isMuted}
      />

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
    backgroundColor: '#111118',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    maxHeight: 320,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: spacing.sm,
  },
  headerTitle: { flex: 1, ...typography.label, color: '#fff', fontWeight: '600' },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    margin: spacing.md, padding: spacing.md,
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: borderRadius.md,
  },
  errorText: { flex: 1, ...typography.caption, color: '#F59E0B', lineHeight: 18 },
});
