// CineSync Mobile — Profile card header (web-style horizontal layout)
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@theme/index';
import { useProfileHeaderStyles } from './ProfileHeader.styles';
import { FadeInView, PulsingDot } from './ProfileAnimations';
import type { RankMeta } from '@hooks/useProfileData';

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
  avatarUri, username, bio, isOnline, rankMeta, paddingTop,
  onPickAvatar, onEditPress, onSettingsPress, titleLabel, pointsLabel, joinDate,
}: ProfileHeaderProps) {
  const { colors } = useTheme();
  const s = useProfileHeaderStyles();
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
      <View style={s.topRow}>
        <Text style={s.title}>{titleLabel}</Text>
        <TouchableOpacity onPress={onSettingsPress} style={s.settingsBtn} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FadeInView delay={100} style={s.profileCard}>
        <View style={s.cardContent}>
          <TouchableOpacity onPress={handlePressAvatar} activeOpacity={0.85}>
            <Animated.View style={[s.avatarRing, { borderColor: rankColor, transform: [{ scale: avatarScale }] }]}>
              <Image
                source={avatarUri ? { uri: avatarUri } : require('../../../assets/icon.png')}
                style={s.avatar} contentFit="cover"
              />
            </Animated.View>
            <View style={[s.avatarEditBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={10} color={colors.white} />
            </View>
            <View style={[s.onlineDotAbsolute, { backgroundColor: isOnline ? colors.success : colors.textDim, borderColor: colors.bgElevated }]} />
          </TouchableOpacity>

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
            <FadeInView delay={200}>
              <View style={[s.rankBadge, { backgroundColor: rankColor + '15', borderColor: rankColor + '30' }]}>
                <Text style={[s.rankText, { color: rankColor }]}>{rank}</Text>
              </View>
            </FadeInView>
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
