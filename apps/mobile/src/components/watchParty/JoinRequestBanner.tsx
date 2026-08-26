// WeWatch — owner-side "knock to enter" queue banner (2026-08-26)
// Fed by useJoinRequests. Renders above the player, one row per pending requester. Usernames
// aren't in the socket payload (just userId) since the requester is often a stranger with no
// existing cache entry (unlike a room member) — resolved here via the same userApi public
// profile lookup other screens use for arbitrary userIds (e.g. FriendProfileScreen).
import React from 'react';
import { View, Text, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import { userApi } from '@api/user.api';
import type { PendingJoinRequest } from '@hooks/useJoinRequests';

interface Props {
  queue: PendingJoinRequest[];
  onApprove: (userId: string) => void;
  onDeny: (userId: string) => void;
}

export function JoinRequestBanner({ queue, onApprove, onDeny }: Props) {
  if (queue.length === 0) return null;
  return (
    <View style={{ gap: spacing.xs }}>
      {queue.map((req) => (
        <JoinRequestRow key={req.userId} userId={req.userId} onApprove={onApprove} onDeny={onDeny} />
      ))}
    </View>
  );
}

function JoinRequestRow({ userId, onApprove, onDeny }: { userId: string; onApprove: (id: string) => void; onDeny: (id: string) => void }) {
  const { colors } = useTheme();
  const { t } = useT();
  const styles = useStyles();
  const { data: profile } = useQuery({
    queryKey: ['user-public', userId],
    queryFn: () => userApi.getPublicProfile(userId),
    staleTime: 60_000,
  });

  return (
    <View style={styles.row}>
      {profile?.avatar ? (
        <Image source={{ uri: profile.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Ionicons name="person" size={16} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{profile?.username ?? userId.slice(-6)}</Text>
        <Text style={styles.sub}>{t('watchParty', 'joinRequestFrom')}</Text>
      </View>
      <TrackedTouchable trackId="join_request:deny" style={styles.denyBtn} onPress={() => onDeny(userId)} activeOpacity={0.8}>
        <Ionicons name="close" size={18} color={colors.textPrimary} />
      </TrackedTouchable>
      <TrackedTouchable trackId="join_request:approve" style={styles.approveBtn} onPress={() => onApprove(userId)} activeOpacity={0.8}>
        <Ionicons name="checkmark" size={18} color={colors.white} />
      </TrackedTouchable>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 32, height: 32, borderRadius: borderRadius.full },
  avatarFallback: { backgroundColor: colors.bgMuted, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { ...typography.body, fontWeight: '600' as const, color: colors.textPrimary },
  sub: { ...typography.caption, color: colors.textMuted },
  denyBtn: {
    width: 32, height: 32, borderRadius: borderRadius.full,
    backgroundColor: colors.bgMuted, alignItems: 'center', justifyContent: 'center',
  },
  approveBtn: {
    width: 32, height: 32, borderRadius: borderRadius.full,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
}));
