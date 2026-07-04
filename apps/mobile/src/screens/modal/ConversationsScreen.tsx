// WeWatch Mobile — DM Conversations Screen (T-E138)
import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { dmApi } from '@api/user.api';
import { IDMConversation, ChatsStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { spacing } from '@theme/index';

type NavProp = NativeStackNavigationProp<ChatsStackParamList, 'Conversations'>;

function memberColor(id: string): string {
  const palette = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
  const key = id ?? '';
  let h = 0;
  for (let i = 0; i < key.length; i++) h = key.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '<1 min';
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h`;
  return `${Math.floor(hr / 24)} d`;
}

function ConvItem({ item, onPress }: { item: IDMConversation; onPress: () => void }) {
  const bg = memberColor(item.peerId);
  const initials = (item.peerUsername ?? '?').slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.75}>
      {item.peerAvatar ? (
        <Image source={{ uri: item.peerAvatar }} style={[s.avatar, { borderColor: bg }]} contentFit="cover" />
      ) : (
        <View style={[s.avatarFallback, { backgroundColor: bg }]}>
          <Text style={s.avatarInitials}>{initials}</Text>
        </View>
      )}

      <View style={s.info}>
        <View style={s.topRow}>
          <Text style={[s.username, item.unreadCount > 0 && s.usernameUnread]} numberOfLines={1}>
            {item.peerUsername}
          </Text>
          <Text style={s.time}>{formatRelative(item.lastMessageAt)}</Text>
        </View>
        <View style={s.bottomRow}>
          <Text style={[s.lastMsg, item.unreadCount > 0 && s.lastMsgUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ConversationsScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { t } = useT();

  const { data: conversations = [], isLoading, refetch } = useQuery<IDMConversation[]>({
    queryKey: ['dm-conversations'],
    queryFn: () => dmApi.getConversations(),
    staleTime: 30_000,
  });

  // Refetch whenever the Chats tab regains focus so a conversation started elsewhere
  // (e.g. from a friend's profile) shows up immediately without restarting the app.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{t('dm', 'title')}</Text>
      </View>

      {isLoading ? (
        <View style={s.loader}>
          <ActivityIndicator color="#7B72F8" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="chatbubbles-outline" size={56} color="rgba(255,255,255,0.12)" />
          <Text style={s.emptyTitle}>{t('dm', 'convEmpty')}</Text>
          <Text style={s.emptySub}>{t('dm', 'convEmptySub')}</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.peerId}
          renderItem={({ item }: ListRenderItemInfo<IDMConversation>) => (
            <ConvItem
              item={item}
              onPress={() => navigation.navigate('DMChat', { peerId: item.peerId, peerName: item.peerUsername })}
            />
          )}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          onRefresh={refetch}
          refreshing={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: '#111120',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  headerRight: {
    width: 36,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.28)',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptySub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.18)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
  },
  usernameUnread: {
    color: '#fff',
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMsg: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    flex: 1,
  },
  lastMsgUnread: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#7B72F8',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 78,
  },
});
