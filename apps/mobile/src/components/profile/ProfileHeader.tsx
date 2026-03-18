// CineSync Mobile — Profile gradient header (avatar, rank, progress)
import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { FadeInView, AnimatedProgressBar, PulsingDot } from './ProfileAnimations';
import type { RankMeta } from '@hooks/useProfileData';

const { width: SCREEN_W } = Dimensions.get('window');

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
}: ProfileHeaderProps) {
  const avatarScale = useRef(new Animated.Value(1)).current;
  const { rank, rankColor, rankIcon, totalPts, rankMin, rankMax, rankProgress, nextRank } = rankMeta;

  const handlePressAvatar = () => {
    Animated.sequence([
      Animated.timing(avatarScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(avatarScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPickAvatar();
  };

  return (
    <LinearGradient
      colors={[rankColor + '25', colors.bgBase]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[s.container, { paddingTop: paddingTop + spacing.md }]}
    >
      {/* Top row */}
      <View style={s.topRow}>
        <Text style={s.title}>{titleLabel}</Text>
        <TouchableOpacity onPress={onSettingsPress} style={s.settingsBtn} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <FadeInView delay={100} style={s.avatarSection}>
        <TouchableOpacity onPress={handlePressAvatar} activeOpacity={0.85}>
          <Animated.View style={[s.avatarRing, { borderColor: rankColor + '60', transform: [{ scale: avatarScale }] }]}>
            <Image
              source={avatarUri ? { uri: avatarUri } : require('../../../assets/icon.png')}
              style={s.avatar}
              contentFit="cover"
            />
          </Animated.View>
          <View style={[s.avatarEditBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={12} color={colors.white} />
          </View>
        </TouchableOpacity>
      </FadeInView>

      {/* Username + online */}
      <FadeInView delay={200} style={s.nameSection}>
        <TouchableOpacity onPress={onEditPress} activeOpacity={0.8} style={s.usernameRow}>
          <Text style={s.username}>{username}</Text>
          <Ionicons name="create-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={s.onlineRow}>
          <PulsingDot active={isOnline === true} />
          <Text style={[s.onlineText, { color: isOnline === true ? colors.success : colors.textMuted }]}>
            {isOnline === true ? 'Online' : 'Offline'}
          </Text>
        </View>
      </FadeInView>

      {/* Rank badge */}
      <FadeInView delay={300} style={s.rankSection}>
        <View style={[s.rankChip, { backgroundColor: rankColor + '18', borderColor: rankColor + '35' }]}>
          <Ionicons name={rankIcon} size={16} color={rankColor} />
          <Text style={[s.rankName, { color: rankColor }]}>{rank}</Text>
          <View style={s.rankDivider} />
          <Text style={[s.rankPts, { color: rankColor }]}>{totalPts} {pointsLabel}</Text>
        </View>
      </FadeInView>

      {bio ? (
        <FadeInView delay={350}>
          <Text style={s.bio}>{bio}</Text>
        </FadeInView>
      ) : null}

      {/* Rank progress */}
      <FadeInView delay={400} style={s.progressWrap}>
        <View style={s.progressLabelRow}>
          <Text style={s.progressLabel}>{totalPts}</Text>
          <Text style={s.progressLabel}>{rankMax}</Text>
        </View>
        <AnimatedProgressBar progress={rankProgress} color={rankColor} delay={500} />
        {nextRank ? (
          <Text style={s.progressSub}>{rank}  →  {nextRank}</Text>
        ) : (
          <Text style={[s.progressSub, { color: rankColor, fontWeight: '700' }]}>MAX RANK</Text>
        )}
      </FadeInView>
    </LinearGradient>
  );
});

const s = StyleSheet.create({
  container: { paddingBottom: spacing.xl, alignItems: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  settingsBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: { alignItems: 'center', marginBottom: spacing.md },
  avatarRing: {
    width: 100, height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2, right: 2,
    width: 28, height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bgBase,
  },
  nameSection: { alignItems: 'center', gap: spacing.xs },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  username: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  onlineText: { ...typography.caption, fontWeight: '600' },
  rankSection: { marginTop: spacing.sm },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  rankName: { fontSize: 14, fontWeight: '700' },
  rankDivider: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  rankPts: { fontSize: 12, fontWeight: '600' },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  progressWrap: { width: SCREEN_W - spacing.xxl * 2, marginTop: spacing.md },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressLabel: { ...typography.caption, color: colors.textMuted },
  progressSub: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
});
