// WeWatch — compact always-visible voice strip (T-S167, variant C)
//
// Replaces the old separate full-screen VoiceChat panel that only showed when `showVoice` was
// true — which meant it was mutually exclusive with chat (`showChat`/`showVoice` toggled each
// other off, see WatchPartyScreen.tsx before this change), so a user reading chat had no visual
// signal that voice was even active, let alone who was talking. This sits directly above the
// (now always-open) chat panel: small avatars, a live speaking pulse, one join/leave control.
// Mute itself lives in RoomInfoBar instead — reachable with the panel fully closed too.
import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { userApi } from '@api/user.api';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import type { VoiceParticipant } from '@hooks/useVoiceChat';

interface Props {
  currentUserId: string;
  isJoined: boolean;
  isMuted: boolean;
  isLoading: boolean;
  errorMsg: string | null;
  participants: VoiceParticipant[];
  onJoin: () => void;
  onLeave: () => void;
}

function Avatar({ p, isSelf, isMuted }: { p: VoiceParticipant; isSelf: boolean; isMuted: boolean }) {
  const { t } = useT();
  // Same queryKey MembersStrip/VoiceChatParticipants use — resolved username/avatar comes from
  // the react-query cache already populated by the member list, no extra fetch for participants
  // who are also room members (the common case).
  const { data } = useQuery({
    queryKey: ['user-public', p.userId],
    queryFn: () => userApi.getPublicProfile(p.userId),
    staleTime: 5 * 60 * 1000,
    enabled: !isSelf,
  });
  const initial = (isSelf ? t('watchParty', 'youLabel') : (data?.username ?? '?'))[0]?.toUpperCase() ?? '?';

  return (
    <View style={s.avatarWrap}>
      <View style={[s.avatar, p.isSpeaking && s.avatarSpeaking]}>
        <Text style={s.avatarInitial}>{initial}</Text>
      </View>
      {isMuted && (
        <View style={s.mutedBadge}>
          <Ionicons name="mic-off" size={8} color="#9CA3AF" />
        </View>
      )}
    </View>
  );
}

export function VoiceStrip({ currentUserId, isJoined, isMuted, isLoading, errorMsg, participants, onJoin, onLeave }: Props) {
  const { t } = useT();

  if (errorMsg) {
    return (
      <View style={s.errorRow}>
        <Text style={s.errorText} numberOfLines={1}>{errorMsg}</Text>
        <TrackedTouchable trackId="voicestrip:retry" style={s.retryBtn} onPress={onJoin}>
          <Text style={s.retryText}>{t('watchParty', 'voiceRetry')}</Text>
        </TrackedTouchable>
      </View>
    );
  }

  const all: VoiceParticipant[] = isJoined
    ? [{ userId: currentUserId, isMuted, isSpeaking: false }, ...participants]
    : participants;

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Ionicons name="radio" size={12} color={all.some((p) => p.isSpeaking) ? '#4ADE80' : 'rgba(255,255,255,0.4)'} />
        <Text style={s.headerText}>{t('watchParty', 'voiceTitle')}</Text>
        {isLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" style={s.headerLoader} />}
      </View>

      {all.length === 0 ? (
        <TrackedTouchable trackId="voicestrip:join" style={s.joinBtn} onPress={onJoin} disabled={isLoading}>
          <Ionicons name="mic" size={15} color="#fff" />
          <Text style={s.joinBtnText}>{t('watchParty', 'voiceJoin')}</Text>
        </TrackedTouchable>
      ) : (
        <View style={s.row}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.avatarScroll} contentContainerStyle={s.avatarScrollContent}>
            {all.map((p) => (
              <Avatar key={p.userId} p={p} isSelf={p.userId === currentUserId} isMuted={p.isMuted} />
            ))}
          </ScrollView>
          {isJoined && (
            <TrackedTouchable trackId="voicestrip:leave" style={s.leaveBtn} onPress={onLeave}>
              <Ionicons name="call" size={15} color="#F87171" style={s.leaveIcon} />
            </TrackedTouchable>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(123,114,248,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(123,114,248,0.16)',
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { ...typography.caption, fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.3 },
  headerLoader: { marginLeft: 'auto' },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarScroll: { flex: 1 },
  avatarScrollContent: { flexDirection: 'row', gap: 10, paddingVertical: 2 },

  avatarWrap: { position: 'relative' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarSpeaking: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74,222,128,0.15)',
    // RN has no CSS box-shadow pulse animation without Animated/Reanimated wiring — a static
    // colored ring is the honest signal here; still far more visible than the old plain grey dot.
    shadowColor: '#4ADE80', shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  avatarInitial: { color: '#fff', fontSize: 12, fontWeight: '700' },
  mutedBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#14101F', borderWidth: 1.5, borderColor: '#14101F',
    alignItems: 'center', justifyContent: 'center',
  },

  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8, borderRadius: borderRadius.md,
  },
  joinBtnText: { ...typography.caption, color: '#fff', fontWeight: '700' },

  leaveBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(248,113,113,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  leaveIcon: { transform: [{ rotate: '135deg' }] },

  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg, marginTop: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  errorText: { flex: 1, ...typography.caption, fontSize: 12, color: '#FCA5A5' },
  retryText: { ...typography.caption, fontSize: 11, fontWeight: '700', color: '#fff' },
  retryBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 5, paddingHorizontal: 10, borderRadius: borderRadius.sm },
});
