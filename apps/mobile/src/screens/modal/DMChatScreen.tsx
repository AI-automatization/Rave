// WeWatch Mobile — DM Chat Screen (T-E137)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, Text,
  StyleSheet, ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth.store';
import { dmApi } from '@api/user.api';
import { IDMMessage, ModalStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';
import { useEnsureSocket } from '@hooks/useEnsureSocket';
import { useDMChatViewport } from '@hooks/useDMChatViewport';
import { memberColor } from '@utils/dmFormat';
import { buildDMList, findJumpIndex, dateKeyFromDate, dateFromKey, type DMListItem } from '@utils/dmDateGroups';
import { MessageItem } from '@components/dm/MessageItem';
import { ForwardPicker } from '@components/dm/ForwardPicker';
import { MessageActionSheet } from '@components/dm/MessageActionSheet';
import { DateSeparator } from '@components/dm/DateSeparator';
import { StickyDateHeader } from '@components/dm/StickyDateHeader';
import { DatePickerModal } from '@components/dm/DatePickerModal';
import { DMChatHeader } from '@components/dm/DMChatHeader';
import { ReplyPreviewBar } from '@components/dm/ReplyPreviewBar';
import { DMChatInput } from '@components/dm/DMChatInput';
import { PinnedMessagesBar } from '@components/dm/PinnedMessagesBar';
import { ChatWallpaper } from '@components/dm/ChatWallpaper';

type RouteType = RouteProp<ModalStackParamList, 'DMChat'>;

export function DMChatScreen() {
  const { params } = useRoute<RouteType>();
  const { peerId, peerName } = params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { user } = useAuthStore();
  const myId = user?._id ?? '';
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<DMListItem>>(null);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<IDMMessage | null>(null);
  const [actionMsg, setActionMsg] = useState<IDMMessage | null>(null);
  const [forwardMsg, setForwardMsg] = useState<IDMMessage | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);

  // DM realtime uchun socket ulanishini kafolatlash (bug fix: socket null edi)
  useEnsureSocket();

  const { data: messages = [], isLoading } = useQuery<IDMMessage[]>({
    queryKey: ['dm-history', peerId],
    queryFn: () => dmApi.getHistory(peerId),
    staleTime: 0,
  });

  const { data: pinnedMessages = [] } = useQuery<IDMMessage[]>({
    queryKey: ['dm-pinned', peerId],
    queryFn: () => dmApi.getPinnedMessages(peerId),
    staleTime: 0,
  });

  // Pin state is shared between both DM participants — refresh on refocus so a pin
  // the peer made while this screen was backgrounded shows up without a reopen.
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['dm-pinned', peerId] });
    }, [peerId, queryClient]),
  );

  // Telegram-style day grouping — flat list of date separators + messages, built once
  // per messages/language change (not per render, since it re-walks every message).
  const listData = useMemo(() => buildDMList(messages, t), [messages, t]);
  const markedDateKeys = useMemo(
    () => new Set(messages.map(m => dateKeyFromDate(new Date(m.createdAt)))),
    [messages],
  );

  const {
    visibleLabel, visibleDateKey, scrollActivity, handleScroll,
    onViewableItemsChanged, viewabilityConfig,
  } = useDMChatViewport(peerId, listRef, listData, messages.length);

  // Listen for incoming DM messages via socket
  const handleIncoming = useCallback((msg: IDMMessage) => {
    const isThisConv =
      (msg.senderId === peerId && msg.receiverId === myId) ||
      (msg.senderId === myId && msg.receiverId === peerId);
    if (!isThisConv) return;

    queryClient.setQueryData<IDMMessage[]>(['dm-history', peerId], (old = []) => {
      if (old.some(m => m._id === msg._id)) return old;
      // Replace our optimistic placeholder once the server echoes the real message back.
      // Faqat BIRINCHI mos temp'ni o'chiramiz — ketma-ket yuborilgan bir xil matnli
      // ikki xabar birinchi echo kelganda ikkalasi ham yo'qolib qolmasligi uchun.
      let removed = false;
      const base = msg.senderId === myId
        ? old.filter(m => {
            if (!removed && m._id.startsWith('temp-') && m.text === msg.text) {
              removed = true;
              return false;
            }
            return true;
          })
        : old;
      return [...base, msg];
    });

    // Read-marking for this new message happens the normal way — via the viewport
    // tracker above, once it actually scrolls into view (see scrollToEnd below).
    void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [peerId, myId, queryClient]);

  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    sock.on(SERVER_EVENTS.DM_MESSAGE, handleIncoming);
    return () => { sock.off(SERVER_EVENTS.DM_MESSAGE, handleIncoming); };
  }, [handleIncoming]);

  // Realtime tick update: the peer just read some of MY messages — flip their
  // checkmarks to "read" without waiting for a chat reopen.
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    const onRead = (data: { peerId: string; upToCreatedAt: string }) => {
      if (data.peerId !== peerId) return;
      const upTo = new Date(data.upToCreatedAt).getTime();
      queryClient.setQueryData<IDMMessage[]>(['dm-history', peerId], (old = []) =>
        old.map(m => (
          m.senderId === myId && !m.read && new Date(m.createdAt).getTime() <= upTo
            ? { ...m, read: true }
            : m
        )),
      );
    };
    sock.on(SERVER_EVENTS.DM_READ, onRead);
    return () => { sock.off(SERVER_EVENTS.DM_READ, onRead); };
  }, [peerId, myId, queryClient]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const activeReply = replyTo;
    setReplyTo(null);

    // Optimistic insert — the message shows instantly and never "disappears" if the
    // socket echo is slow or lost. The real message (socket echo or REST reply) replaces it.
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimistic: IDMMessage = {
      _id: tempId, senderId: myId, receiverId: peerId, text,
      read: false,
      replyToId: activeReply?._id ?? null,
      replyToText: activeReply ? activeReply.text.slice(0, 300) : null,
      replyToSender: activeReply ? (activeReply.senderId === myId ? (user?.username ?? '') : peerName) : null,
      forwardFrom: null,
      createdAt: nowIso, updatedAt: nowIso,
    };
    queryClient.setQueryData<IDMMessage[]>(['dm-history', peerId], (old = []) => [...old, optimistic]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

    const sock = getSocket();
    if (sock?.connected) {
      sock.emit(CLIENT_EVENTS.DM_SEND, { receiverId: peerId, text, replyToId: activeReply?._id });
    } else {
      // Fallback to REST when socket isn't connected
      void dmApi.sendMessage(peerId, text, activeReply?._id)
        .then(msg => {
          queryClient.setQueryData<IDMMessage[]>(['dm-history', peerId], (old = []) => {
            const withoutTemp = old.filter(m => m._id !== tempId);
            return withoutTemp.some(m => m._id === msg._id) ? withoutTemp : [...withoutTemp, msg];
          });
          void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
        })
        .catch(() => { /* keep the optimistic message so it isn't lost */ });
    }
  };

  const handleCopy = async (msg: IDMMessage) => {
    setActionMsg(null);
    await Clipboard.setStringAsync(msg.text).catch(() => null);
  };

  const handleTogglePin = async (msg: IDMMessage) => {
    try {
      await dmApi.togglePinMessage(peerId, msg._id, !msg.pinned);
      void queryClient.invalidateQueries({ queryKey: ['dm-pinned', peerId] });
    } catch { /* best-effort — message may have been deleted meanwhile */ }
  };

  const handleJumpToPinned = (msg: IDMMessage) => {
    const idx = listData.findIndex(i => i.kind === 'message' && i.message._id === msg._id);
    if (idx !== -1) listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
  };

  // Jump-to-date: land on the day's separator (or the closest earlier day if that day
  // has no messages) — same "closest real message" fallback Telegram uses.
  const handleSelectDate = (date: Date) => {
    setCalendarVisible(false);
    const idx = findJumpIndex(listData, dateKeyFromDate(date));
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
    });
  };

  const onScrollToIndexFailed = (info: { index: number; averageItemLength: number }) => {
    listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
    setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: true }), 100);
  };

  const accentColor = memberColor(peerId);

  const replyPreviewSender = replyTo
    ? (replyTo.senderId === myId ? (user?.username ?? '') : peerName)
    : '';

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      {/* Header */}
      <DMChatHeader
        peerName={peerName}
        accentColor={accentColor}
        topInset={insets.top}
        onBack={() => navigation.goBack()}
      />
      <PinnedMessagesBar pinnedMessages={pinnedMessages} onJump={handleJumpToPinned} onUnpin={m => void handleTogglePin(m)} />

      {/* Messages */}
      <View style={s.listWrap}>
        <ChatWallpaper />
        {isLoading ? (
          <View style={s.loader}>
            <ActivityIndicator color="#7B72F8" />
          </View>
        ) : messages.length === 0 ? (
          <View style={s.empty}>
            <View style={[s.emptyAvatarRing, { borderColor: accentColor }]}>
              <View style={[s.emptyAvatarFallback, { backgroundColor: accentColor }]}>
                <Text style={s.emptyAvatarInitial}>{peerName.slice(0, 1).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.emptyTitle}>{peerName}</Text>
            <Text style={s.emptySub}>{t('dm', 'emptySub')}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={listData}
            keyExtractor={item => item.id}
            renderItem={({ item }: ListRenderItemInfo<DMListItem>) => (
              item.kind === 'date'
                ? <DateSeparator label={item.label} onPress={() => setCalendarVisible(true)} />
                : <MessageItem item={item.message} currentUserId={myId} onLongPress={setActionMsg} onSwipeReply={setReplyTo} />
            )}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScrollToIndexFailed={onScrollToIndexFailed}
          />
        )}
        <StickyDateHeader
          label={visibleLabel}
          activityKey={scrollActivity}
          onPress={() => setCalendarVisible(true)}
        />
      </View>

      {/* Reply preview */}
      {replyTo && (
        <ReplyPreviewBar
          senderName={replyPreviewSender}
          text={replyTo.text}
          onCancel={() => setReplyTo(null)}
        />
      )}

      {/* Input */}
      <DMChatInput
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        placeholder={t('dm', 'placeholder')}
        bottomInset={insets.bottom}
      />

      {/* Long-press action sheet */}
      <MessageActionSheet
        message={actionMsg}
        onReply={setReplyTo}
        onForward={setForwardMsg}
        onCopy={m => void handleCopy(m)}
        onTogglePin={m => void handleTogglePin(m)}
        onClose={() => setActionMsg(null)}
      />

      {/* Forward peer picker */}
      <ForwardPicker
        message={forwardMsg}
        currentPeerId={peerId}
        onClose={() => setForwardMsg(null)}
      />

      {/* Jump-to-date calendar */}
      <DatePickerModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onSelect={handleSelectDate}
        markedDateKeys={markedDateKeys}
        initialDate={visibleDateKey ? dateFromKey(visibleDateKey) : null}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  listWrap: {
    flex: 1,
    position: 'relative',
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
    paddingBottom: 60,
  },
  emptyAvatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyAvatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAvatarInitial: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  emptySub: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  list: {
    padding: 16,
    gap: 6,
  },
});
