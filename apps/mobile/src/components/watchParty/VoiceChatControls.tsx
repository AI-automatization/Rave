// CineSync — VoiceChat action buttons (join, leave, mute/unmute)
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';

interface Props {
  isJoined: boolean;
  isMuted: boolean;
  isLoading: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
}

export function VoiceChatControls({ isJoined, isMuted, isLoading, onJoin, onLeave, onToggleMute }: Props) {
  return (
    <View style={s.controls}>
      {isJoined ? (
        <>
          <TouchableOpacity style={[s.controlBtn, isMuted && s.controlBtnMuted]} onPress={onToggleMute}>
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={20} color={isMuted ? '#9CA3AF' : '#fff'} />
            <Text style={[s.controlText, isMuted && s.controlTextMuted]}>
              {isMuted ? 'Включить' : 'Выключить'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.leaveBtn} onPress={onLeave}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={s.leaveBtnText}>Выйти</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={[s.joinBtn, isLoading && s.joinBtnLoading]} onPress={onJoin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="mic" size={20} color="#fff" />
          )}
          <Text style={s.joinBtnText}>{isLoading ? 'Подключение...' : 'Войти в голосовой чат'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  controls: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  joinBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    paddingVertical: spacing.md, borderRadius: borderRadius.lg,
  },
  joinBtnLoading: { opacity: 0.6 },
  joinBtnText: { ...typography.label, color: '#fff', fontWeight: '700' },
  controlBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: 'rgba(229,9,20,0.15)',
    paddingVertical: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(229,9,20,0.3)',
  },
  controlBtnMuted: { backgroundColor: 'rgba(107,114,128,0.15)', borderColor: 'rgba(107,114,128,0.3)' },
  controlText: { ...typography.caption, color: '#fff', fontWeight: '600' },
  controlTextMuted: { color: '#9CA3AF' },
  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: '#7F1D1D', paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg,
  },
  leaveBtnText: { ...typography.caption, color: '#fff', fontWeight: '700' },
});
