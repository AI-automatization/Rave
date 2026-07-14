// WeWatch Mobile — DM Conversations Screen (T-E138)
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList,
  ActivityIndicator, StyleSheet, ListRenderItemInfo,
} from 'react-native';
import { TrackedPressable } from '@components/common/TrackedPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dmApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';
import { IDMConversation, IDMMessage, ChatsStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { spacing } from '@theme/index';
import { resolveMediaUrl } from '@utils/url';
import { memberColor } from '@utils/dmFormat';
import { useEnsureSocket } from '@hooks/useEnsureSocket';
import { getSocket, SERVER_EVENTS } from '@socket/client';
import { appAlert } from '@components/common/AppAlert';
import { ChatPreviewModal } from '@components/dm/ChatPreviewModal';

type NavProp = NativeStackNavigationProp<ChatsStackParamList, 'Conversations'>;

function formatRelative(dateStr: string, tr: (section: 'dm', key: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return tr('dm', 'timeNow');
  if (min < 60) return `${min} ${tr('dm', 'timeMin')}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ${tr('dm', 'timeHour')}`;
  return `${Math.floor(hr / 24)} ${tr('dm', 'timeDay')}`;
}

function ConvItem({
  item, onPress, onLongPress,
}: {
  item: IDMConversation;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { t } = useT();
  const bg = memberColor(item.peerId);
  const initials = (item.peerUsername ?? '?').slice(0, 2).toUpperCase();
  const unread = item.unreadCount > 0;

  return (
    <TrackedPressable trackId="conversations:open_chat" style={s.row} onPress={onPress} onLongPress={onLongPress} delayLongPress={280}>
      {(unread || item.isPinned) && (
        <View style={[s.unreadAccent, { backgroundColor: item.isPinned ? '#FBBF24' : bg }]} />
      )}
      <View style={[s.avatarRing, { borderColor: bg + (unread ? 'FF' : '55') }]}>
        {item.peerAvatar ? (
          <Image source={{ uri: resolveMediaUrl(item.peerAvatar) }} style={s.avatar} contentFit="cover" />
        ) : (
          <View style={[s.avatarFallback, { backgroundColor: bg }]}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>

      <View style={s.info}>
        <View style={s.topRow}>
          <View style={s.nameRow}>
            {item.isPinned && <Ionicons name="pin" size={12} color="#FBBF24" style={s.metaIcon} />}
            {item.isMuted && <Ionicons name="notifications-off" size={12} color="rgba(255,255,255,0.35)" style={s.metaIcon} />}
            <Text style={[s.username, unread && s.usernameUnread]} numberOfLines={1}>
              {item.peerUsername}
            </Text>
          </View>
          <Text style={[s.time, unread && s.timeUnread]}>{formatRelative(item.lastMessageAt, t)}</Text>
        </View>
        <View style={s.bottomRow}>
          <Text style={[s.lastMsg, unread && s.lastMsgUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {unread && (
            <View style={[s.badge, { backgroundColor: item.isMuted ? 'rgba(255,255,255,0.2)' : bg }]}>
              <Text style={s.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TrackedPressable>
  );
}

export function ConversationsScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const queryClient = useQueryClient();
  const myId = useAuthStore(st => st.user?._id ?? '');
  const [previewConversation, setPreviewConversation] = useState<IDMConversation | null>(null);

  // DM realtime uchun socket ulanishini kafolatlash
  useEnsureSocket();

  const { data: conversations = [], isLoading, isRefetching, refetch } = useQuery<IDMConversation[]>({
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

  // Jonli yangilanish: yangi DM kelganda suhbatlar ro'yxatini (so'nggi xabar,
  // unread badge) darhol yangilash — ekranni qayta ochmasdan.
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    const onDM = (_msg: IDMMessage) => {
      void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
    };
    sock.on(SERVER_EVENTS.DM_MESSAGE, onDM);
    return () => { sock.off(SERVER_EVENTS.DM_MESSAGE, onDM); };
  }, [queryClient]);

  const handleToggleMute = async (c: IDMConversation) => {
    await dmApi.toggleMute(c.peerId, !c.isMuted).catch(() => null);
    void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
  };

  const handleTogglePin = async (c: IDMConversation) => {
    try {
      await dmApi.togglePinConversation(c.peerId, !c.isPinned);
      void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
    } catch {
      // 400 = already at the 5-pin cap — the only failure mode this endpoint has.
      appAlert(t('dm', 'pinLimitReached'));
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{t('dm', 'title')}</Text>
      </View>
      <LinearGradient
        colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0)']}
        style={s.headerFade}
        pointerEvents="none"
      />

      {isLoading ? (
        <View style={s.loader}>
          <ActivityIndicator color="#7B72F8" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyGlow} />
          <Image source={require('../../../assets/icon.png')} style={s.emptyMark} contentFit="contain" />
          <Ionicons name="chatbubble-ellipses" size={40} color="rgba(123,114,248,0.55)" style={s.emptyIcon} />
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
              onLongPress={() => setPreviewConversation(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}

      <ChatPreviewModal
        conversation={previewConversation}
        currentUserId={myId}
        visible={!!previewConversation}
        onClose={() => setPreviewConversation(null)}
        onOpenFull={() => {
          if (previewConversation) navigation.navigate('DMChat', { peerId: previewConversation.peerId, peerName: previewConversation.peerUsername });
          setPreviewConversation(null);
        }}
        onToggleMute={c => void handleToggleMute(c)}
        onTogglePin={c => void handleTogglePin(c)}
      />
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
    paddingBottom: 14,
    paddingTop: 8,
    backgroundColor: '#111120',
    zIndex: 2,
  },
  headerFade: {
    height: 10,
    marginBottom: -10,
    zIndex: 1,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
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
    gap: 6,
    paddingBottom: 80,
  },
  emptyGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(123,114,248,0.10)',
  },
  emptyMark: {
    width: 72,
    height: 72,
    opacity: 0.9,
    marginBottom: -6,
  },
  emptyIcon: {
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptySub: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    paddingHorizontal: 44,
    lineHeight: 19,
  },
  listContent: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  unreadAccent: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  metaIcon: {
    marginRight: 1,
  },
  username: {
    fontSize: 15.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    flexShrink: 1,
  },
  usernameUnread: {
    color: '#fff',
    fontWeight: '700',
  },
  time: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.28)',
    marginLeft: 8,
  },
  timeUnread: {
    color: '#9C93FF',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMsg: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.35)',
    flex: 1,
  },
  lastMsgUnread: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  badge: {
    borderRadius: 10,
    minWidth: 21,
    height: 21,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
