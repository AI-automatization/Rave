// CineSync Mobile — Profile card header (web-style horizontal layout)
import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { FadeInView, PulsingDot } from './ProfileAnimations';
import type { RankMeta } from '@hooks/useProfileData';
import { RANK_COLORS } from '@theme/colors';
import type { UserRank } from '@app-types/index';

interface ProfileHeaderProps {
  avatarUri?: string | null;
  username: string;
  bio?: string | null;
  isOnline?: boolean;
  rankMeta: RankMeta;
  paddingTop: number;
  onPickAvatar: () => void;
  onEditPress: () => void;
  onSettingsPress: () => void;
  titleLabel: string;
  pointsLabel: string;
  joinDate?: string;
}

export const ProfileHeader = React.memo(function ProfileHeader({
  avatarUri,
  username,
  bio,
  isOnline,
  rankMeta,
  paddingTop,
  onPickAvatar,
  onEditPress,
  onSettingsPress,
  titleLabel,
  pointsLabel,
  joinDate,
}: ProfileHeaderProps) {
  const { colors } = useTheme();
  const s = useStyles();
  const avatarScale = useRef(new Animated.Value(1)).current;
  const { rank, rankColor, totalPts } = rankMeta;

  const handlePressAvatar = () => {
    Animated.sequence([
      Animated.timing(avatarScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(avatarScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPickAvatar();
  };

  return (
    <View style={[s.container, { paddingTop: paddingTop + spacing.md }]}>
      {/* Top row — title + settings */}
      <View style={s.topRow}>
        <Text style={s.title}>{titleLabel}</Text>
        <TouchableOpacity onPress={onSettingsPress} style={s.settingsBtn} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Profile card — web style horizontal */}
      <FadeInView delay={100} style={s.profileCard}>
        <View style={s.cardContent}>
          {/* Avatar */}
          <TouchableOpacity onPress={handlePressAvatar} activeOpacity={0.85}>
            <Animated.View style={[s.avatarRing, { borderColor: rankColor, transform: [{ scale: avatarScale }] }]}>
              <Image
                source={avatarUri ? { uri: avatarUri } : require('../../../assets/icon.png')}
                style={s.avatar}
                contentFit="cover"
              />
            </Animated.View>
            <View style={[s.avatarEditBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={10} color={colors.white} />
            </View>
            {/* Online dot on avatar */}
            <View style={[s.onlineDotAbsolute, { backgroundColor: isOnline ? colors.success : colors.textDim, borderColor: colors.bgElevated }]} />
          </TouchableOpacity>

          {/* Info section */}
          <View style={s.infoSection}>
            <View style={s.nameEditRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.username}>{username.toUpperCase()}</Text>
                {bio ? <Text style={s.bio} numberOfLines={2}>{bio}</Text> : null}
              </View>
              <TouchableOpacity onPress={onEditPress} style={s.editBtn} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Rank badge */}
            <FadeInView delay={200}>
              <View style={[s.rankBadge, { backgroundColor: rankColor + '15', borderColor: rankColor + '30' }]}>
                <Text style={[s.rankText, { color: rankColor }]}>{rank}</Text>
              </View>
            </FadeInView>

            {/* Meta row — points + online */}
            <FadeInView delay={300}>
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <Ionicons name="star" size={14} color={colors.gold} />
                  <Text style={s.metaValue}>{totalPts.toLocaleString()}</Text>
                  <Text style={s.metaLabel}>{pointsLabel}</Text>
                </View>
                {joinDate ? (
                  <View style={s.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                    <Text style={s.metaLabel}>{joinDate}</Text>
                  </View>
                ) : null}
                <View style={s.metaItem}>
                  <PulsingDot active={isOnline === true} />
                  <Text style={[s.metaLabel, { color: isOnline ? colors.success : colors.textMuted }]}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </FadeInView>
          </View>
        </View>
      </FadeInView>
    </View>
  );
});

const useStyles = createThemedStyles((colors) => ({
  container: { paddingBottom: spacing.sm },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgElevated,
  },
  onlineDotAbsolute: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  infoSection: { flex: 1, gap: spacing.sm },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  bio: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
    lineHeight: 16,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
}));
