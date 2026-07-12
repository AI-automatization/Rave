import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@api/user.api';
import { spacing } from '@theme/index';
import { useT } from '@i18n/index';
import { resolveMediaUrl } from '@utils/url';

interface Props {
  activeMembers: string[];
  ownerId: string;
  currentUserId: string;
  onMemberPress?: (userId: string) => void;
}

const AVATAR_SIZE = 40;
const MAX_VISIBLE = 6;

function memberColor(userId: string): string {
  const palette = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function MemberAvatar({
  userId, isOwner, isSelf, onPress,
}: {
  userId: string; isOwner: boolean; isSelf: boolean; onPress?: () => void;
}) {
  const { t } = useT();
  const { data } = useQuery({
    queryKey: ['user-public', userId],
    queryFn: () => userApi.getPublicProfile(userId),
    staleTime: 5 * 60 * 1000,
  });

  const bg = memberColor(userId);
  const label = data?.username?.slice(0, 2).toUpperCase() ?? '??';
  const borderColor = isSelf ? '#7B72F8' : isOwner ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.10)';
  const borderWidth = isSelf || isOwner ? 2 : 1.5;

  const inner = (
    <View style={s.avatarWrap}>
      <View style={[s.avatarRing, { borderColor, borderWidth }]}>
        {data?.avatar ? (
          <Image source={{ uri: resolveMediaUrl(data.avatar) }} style={s.avatarImg} contentFit="cover" />
        ) : (
          <View style={[s.avatarFallback, { backgroundColor: bg }]}>
            <Text style={s.avatarInitials}>{label}</Text>
          </View>
        )}
      </View>
      {isOwner && (
        <View style={s.crownBadge}>
          <Ionicons name="star" size={8} color="#FFD700" />
        </View>
      )}
      <View style={s.onlineDot} />
      <Text style={[s.usernameLabel, isSelf && s.usernameLabelSelf]} numberOfLines={1}>
        {isSelf ? t('watchParty', 'youLabel') : (data?.username ?? '···')}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} delayLongPress={400}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

export function MembersStrip({ activeMembers, ownerId, currentUserId, onMemberPress }: Props) {
  const { t } = useT();
  if (activeMembers.length === 0) return null;

  const visible = activeMembers.slice(0, MAX_VISIBLE);
  const overflow = activeMembers.length - MAX_VISIBLE;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerLabel}>{t('watchParty', 'membersLabel')}</Text>
        <View style={s.onlinePill}>
          <View style={s.onlinePip} />
          <Text style={s.onlineText}>{activeMembers.length} {t('watchParty', 'onlineSuffix')}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {visible.map(uid => (
          <MemberAvatar
            key={uid}
            userId={uid}
            isOwner={uid === ownerId}
            isSelf={uid === currentUserId}
            onPress={onMemberPress && uid !== currentUserId ? () => onMemberPress(uid) : undefined}
          />
        ))}
        {overflow > 0 && (
          <View style={s.avatarWrap}>
            <View style={[s.avatarRing, s.overflowRing]}>
              <View style={s.overflowFallback}>
                <Text style={s.overflowText}>+{overflow}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  onlinePip: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: '#4ADE80',
  },
  onlineText: {
    fontSize: 10,
    color: '#4ADE80',
    fontWeight: '600',
  },

  scroll: {
    paddingHorizontal: spacing.md,
    gap: 14,
    alignItems: 'flex-start',
  },

  avatarWrap: {
    alignItems: 'center',
    gap: 4,
    width: AVATAR_SIZE + 8,
    position: 'relative',
  },

  avatarRing: {
    width: AVATAR_SIZE + 4, height: AVATAR_SIZE + 4,
    borderRadius: (AVATAR_SIZE + 4) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  overflowRing: {
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
  },

  avatarImg: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  overflowFallback: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },

  avatarInitials: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  overflowText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700' },

  crownBadge: {
    position: 'absolute',
    top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#0D0D1A',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    zIndex: 2,
  },

  onlineDot: {
    position: 'absolute',
    bottom: 18, right: 0,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#4ADE80',
    borderWidth: 1.5,
    borderColor: '#0D0D1A',
    zIndex: 2,
  },

  usernameLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.40)',
    maxWidth: AVATAR_SIZE + 8,
    textAlign: 'center',
  },
  usernameLabelSelf: {
    color: 'rgba(123,114,248,0.75)',
    fontWeight: '600',
  },
});
