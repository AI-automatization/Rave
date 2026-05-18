// CineSync Mobile — Profile card header (web-style horizontal layout)
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@theme/index';
import { useProfileHeaderStyles } from './ProfileHeader.styles';
import { FadeInView, PulsingDot } from './ProfileAnimations';

interface ProfileHeaderProps {
  avatarUri?: string | null;
  username: string;
  bio?: string | null;
  isOnline?: boolean;
  points?: number;
  paddingTop: number;
  onPickAvatar: () => void;
  onEditPress: () => void;
  onSettingsPress: () => void;
  titleLabel: string;
  pointsLabel: string;
  joinDate?: string;
  email?: string | null;
  friendsCount?: number;
}

export const ProfileHeader = React.memo(function ProfileHeader({
  avatarUri, username, bio, isOnline, points = 0, paddingTop,
  onPickAvatar, onEditPress, onSettingsPress, titleLabel, pointsLabel, joinDate,
  email, friendsCount,
}: ProfileHeaderProps) {
  const { colors } = useTheme();
  const s = useProfileHeaderStyles();
  const avatarScale = useRef(new Animated.Value(1)).current;

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
            <Animated.View style={[s.avatarRing, { borderColor: colors.primary, transform: [{ scale: avatarScale }] }]}>
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
            <FadeInView delay={300}>
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <Ionicons name="star" size={14} color={colors.gold} />
                  <Text style={s.metaValue}>{points.toLocaleString()}</Text>
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
            {(email || friendsCount !== undefined) && (
              <FadeInView delay={380}>
                <View style={s.cardDivider} />
                <View style={s.infoChips}>
                  {email ? (
                    <View style={s.infoChip}>
                      <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
                      <Text style={s.infoChipText} numberOfLines={1}>{email}</Text>
                    </View>
                  ) : null}
                  {friendsCount !== undefined ? (
                    <View style={s.infoChip}>
                      <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                      <Text style={s.infoChipText}>{friendsCount}</Text>
                    </View>
                  ) : null}
                </View>
              </FadeInView>
            )}
          </View>
        </View>
      </FadeInView>
    </View>
  );
});
