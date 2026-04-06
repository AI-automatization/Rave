// CineSync — VoiceChat participant list
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { VoiceParticipant } from '@hooks/useVoiceChat';

interface Props {
  participants: VoiceParticipant[];
  currentUserId: string;
  isMuted: boolean;
}

export function VoiceChatParticipants({ participants, currentUserId, isMuted }: Props) {
  const self: VoiceParticipant = { userId: currentUserId, isMuted, isSpeaking: false };

  return (
    <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
      {[self, ...participants].map(p => (
        <View key={p.userId} style={s.row}>
          <View style={[s.avatar, p.isSpeaking && s.avatarSpeaking]}>
            <Ionicons name={p.isMuted ? 'mic-off' : 'mic'} size={14} color={p.isMuted ? '#6B7280' : colors.primary} />
          </View>
          <Text style={s.name} numberOfLines={1}>
            {p.userId === currentUserId ? 'Вы' : p.userId.slice(-6)}
          </Text>
          {p.isSpeaking && <View style={s.speakingDot} />}
          {p.isMuted && <Ionicons name="mic-off-outline" size={14} color="#6B7280" />}
        </View>
      ))}
      {participants.length === 0 && (
        <Text style={s.empty}>Никого нет в голосовом чате</Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  list: { maxHeight: 140, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSpeaking: {
    backgroundColor: 'rgba(229,9,20,0.2)',
    borderWidth: 1.5, borderColor: colors.primary,
  },
  name: { flex: 1, ...typography.caption, color: '#D1D5DB', fontSize: 13 },
  speakingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  empty: { ...typography.caption, color: '#6B7280', textAlign: 'center', paddingVertical: spacing.lg },
});
