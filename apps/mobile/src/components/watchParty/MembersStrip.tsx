import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@api/user.api';
import { colors, spacing, borderRadius } from '@theme/index';

interface Props {
  activeMembers: string[];
  ownerId: string;
  currentUserId: string;
  onMemberPress?: (userId: string) => void;
}

const AVATAR_SIZE = 36;
const MAX_VISIBLE = 6;

function memberColor(userId: string): string {
  const palette = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function MemberAvatar({ userId, isOwner, isSelf, onPress }: { userId: string; isOwner: boolean; isSelf: boolean; onPress?: () => void }) {
  const { data } = useQuery({
    queryKey: ['user-public', userId],
    queryFn: () => userApi.getPublicProfile(userId),
    staleTime: 5 * 60 * 1000,
  });

  const bg = memberColor(userId);
  const label = data?.username?.slice(0, 2).toUpperCase() ?? '??';

  const inner = (
    <View style={s.avatarWrap}>
      <View style={[s.avatarBorder, isSelf && s.selfBorder]}>
        {data?.avatar ? (
          <Image source={{ uri: data.avatar }} style={s.avatarImg} contentFit="cover" />
        ) : (
          <View style={[s.avatarFallback, { backgroundColor: bg }]}>
            <Text style={s.avatarInitials}>{label}</Text>
          </View>
        )}
        {isOwner && (
          <View style={s.crownBadge}>
            <Ionicons name="star" size={9} color="#FFD700" />
          </View>
        )}
      </View>
      <Text style={s.username} numberOfLines={1}>
        {isSelf ? 'Вы' : (data?.username ?? '...')}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} delayLongPress={400}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

export function MembersStrip({ activeMembers, ownerId, currentUserId, onMemberPress }: Props) {
  if (activeMembers.length === 0) return null;

  const visible = activeMembers.slice(0, MAX_VISIBLE);
  const overflow = activeMembers.length - MAX_VISIBLE;

  return (
    <View style={s.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {visible.map((uid) => (
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
            <View style={[s.avatarFallback, s.overflowCircle]}>
              <Text style={s.overflowText}>+{overflow}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: spacing.xs,
  },
  scroll: { paddingHorizontal: spacing.md, gap: spacing.md, alignItems: 'flex-start' },
  avatarWrap: { alignItems: 'center', gap: 3, width: AVATAR_SIZE + 4 },
  avatarBorder: {
    width: AVATAR_SIZE + 2, height: AVATAR_SIZE + 2, borderRadius: (AVATAR_SIZE + 2) / 2,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  selfBorder: { borderColor: colors.primary },
  avatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarFallback: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 12, fontWeight: '700' },
  crownBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center', justifyContent: 'center',
  },
  username: { fontSize: 9, color: 'rgba(255,255,255,0.5)', maxWidth: AVATAR_SIZE + 4 },
  overflowCircle: { backgroundColor: 'rgba(255,255,255,0.1)' },
  overflowText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
