// WeWatch — Friend list item components (extracted from FriendsScreen)
import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { RANK_COLORS } from '@theme/index';
import { useT } from '@i18n/index';
import type { IUserPublic } from '@app-types/index';
import { DEFAULT_AVATAR } from '@utils/assets';

// ─── Friend Row ───────────────────────────────────────────────────────────────

export const FriendRow = React.memo(function FriendRow({
  item,
  isOnline,
  onPress,
}: {
  item: IUserPublic;
  isOnline: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const rankColor = RANK_COLORS[item.rank];
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 15, tension: 300 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 150 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={s.row}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        <View style={s.avatarWrap}>
          <View style={[s.avatarRing, { borderColor: rankColor + '80' }]}>
            <Image
              source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR}
              style={s.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>
          <View style={[s.onlineDot, {
            backgroundColor: isOnline ? colors.success : colors.bgMuted,
            borderColor: colors.bgElevated,
          }]} />
        </View>

        <View style={s.rowInfo}>
          <Text style={s.rowUsername}>{item.username}</Text>
          <View style={s.rowMeta}>
            <View style={[s.rankPill, { borderColor: rankColor + '50' }]}>
              <View style={[s.rankDot, { backgroundColor: rankColor }]} />
              <Text style={[s.rankLabel, { color: rankColor }]}>{item.rank}</Text>
            </View>
            <Text style={s.rowPoints}>⭐ {item.totalPoints}</Text>
          </View>
        </View>

        <View style={s.rowRight}>
          {isOnline && (
            <View style={s.onlinePill}>
              <View style={s.onlinePillDot} />
              <Text style={s.onlinePillText}>online</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Request Card ─────────────────────────────────────────────────────────────

export const RequestCard = React.memo(function RequestCard({
  item,
  onAccept,
  onReject,
}: {
  item: { _id: string; requester: IUserPublic };
  onAccept: () => void;
  onReject: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useT();
  const s = useStyles();
  const rankColor = RANK_COLORS[item.requester.rank];

  return (
    <View style={s.requestCard}>
      <View style={s.avatarWrap}>
        <View style={[s.avatarRing, { borderColor: rankColor + '80' }]}>
          <Image
            source={item.requester.avatar ? { uri: item.requester.avatar } : DEFAULT_AVATAR}
            style={s.avatar}
            contentFit="cover"
          />
        </View>
      </View>
      <View style={s.rowInfo}>
        <Text style={s.rowUsername}>{item.requester.username}</Text>
        <View style={s.rowMeta}>
          <View style={[s.rankPill, { borderColor: rankColor + '50' }]}>
            <View style={[s.rankDot, { backgroundColor: rankColor }]} />
            <Text style={[s.rankLabel, { color: rankColor }]}>{item.requester.rank}</Text>
          </View>
        </View>
      </View>
      <View style={s.requestBtns}>
        <TouchableOpacity style={s.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={15} color={colors.white} />
          <Text style={s.acceptBtnText}>{t('friends', 'accept')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.rejectBtn} onPress={onReject} activeOpacity={0.8}>
          <Ionicons name="close" size={17} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─── Empty State ──────────────────────────────────────────────────────────────

export function FriendsEmptyState({ icon, title, subtitle, action, onAction }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <View style={s.empty}>
      <View style={s.emptyIconWrap}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={s.emptySubtext}>{subtitle}</Text> : null}
      {action && onAction ? (
        <TouchableOpacity style={s.emptyBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={s.emptyBtnText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = createThemedStyles((colors) => ({
  // Friend Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: { position: 'relative', alignSelf: 'flex-start' },
  avatarRing: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 13, height: 13, borderRadius: 7, borderWidth: 2,
  },
  rowInfo: { flex: 1, gap: 5 },
  rowUsername: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rankPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  rankDot: { width: 7, height: 7, borderRadius: 4 },
  rankLabel: { fontSize: 11, fontWeight: '700' },
  rowPoints: { ...typography.caption, color: colors.textMuted },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.success + '18',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  onlinePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  onlinePillText: { fontSize: 10, color: colors.success, fontWeight: '700' },

  // Request Card
  requestCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated, borderRadius: borderRadius.xl,
    padding: spacing.md, gap: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  requestBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  acceptBtnText: { fontSize: 12, color: colors.white, fontWeight: '700' },
  rejectBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },

  // Empty state
  empty: {
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingTop: 72, paddingHorizontal: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.primary + '25',
  },
  emptyTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  emptySubtext: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full, marginTop: spacing.sm,
  },
  emptyBtnText: { ...typography.label, color: colors.white },
}));
