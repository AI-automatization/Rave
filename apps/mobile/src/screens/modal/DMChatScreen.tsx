// WeWatch Mobile — DM Chat Screen (T-E137)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth.store';
import { dmApi } from '@api/user.api';
import { IDMMessage, ModalStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { spacing, borderRadius } from '@theme/index';
import { getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';

type RouteType = RouteProp<ModalStackParamList, 'DMChat'>;

const BUBBLE_RADIUS = 18;

function memberColor(id: string): string {
  const palette = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function MessageItem({ item, currentUserId }: { item: IDMMessage; currentUserId: string }) {
  const isMine = item.senderId === currentUserId;
  return (
    <View style={[s.msgRow, isMine && s.msgRowMine]}>
      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
        <Text style={[s.msgText, isMine && s.msgTextMine]}>{item.text}</Text>
        <Text style={[s.timeLabel, isMine && s.timeLabelMine]}>{formatTime(item.createdAt)}</Text>
      </View>
    </View>
  );
}

export function DMChatScreen() {
  const { params } = useRoute<RouteType>();
  const { peerId, peerName } = params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { user } = useAuthStore();
  const myId = user?._id ?? '';
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<IDMMessage>>(null);
  const [input, setInput] = useState('');

  const { data: messages = [], isLoading } = useQuery<IDMMessage[]>({
    queryKey: ['dm-history', peerId],
    queryFn: () => dmApi.getHistory(peerId),
    staleTime: 0,
  });

  // Mark messages as read on open
  useEffect(() => {
    void dmApi.markRead(peerId).catch(() => null);
    void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
  }, [peerId, queryClient]);

  // Scroll to bottom when messages load or new ones arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  // Listen for incoming DM messages via socket
  const handleIncoming = useCallback((msg: IDMMessage) => {
    const isThisConv =
      (msg.senderId === peerId && msg.receiverId === myId) ||
      (msg.senderId === myId && msg.receiverId === peerId);
    if (!isThisConv) return;

    queryClient.setQueryData<IDMMessage[]>(['dm-history', peerId], (old = []) => {
      if (old.some(m => m._id === msg._id)) return old;
      // Replace our optimistic placeholder once the server echoes the real message back.
      const base = msg.senderId === myId
        ? old.filter(m => !(m._id.startsWith('temp-') && m.text === msg.text))
        : old;
      return [...base, msg];
    });
    void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [peerId, myId, queryClient]);

  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    sock.on(SERVER_EVENTS.DM_MESSAGE, handleIncoming);
    return () => { sock.off(SERVER_EVENTS.DM_MESSAGE, handleIncoming); };
  }, [handleIncoming]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    // Optimistic insert — the message shows instantly and never "disappears" if the
    // socket echo is slow or lost. The real message (socket echo or REST reply) replaces it.
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimistic: IDMMessage = {
      _id: tempId, senderId: myId, receiverId: peerId, text,
      read: false, createdAt: nowIso, updatedAt: nowIso,
    };
    queryClient.setQueryData<IDMMessage[]>(['dm-history', peerId], (old = []) => [...old, optimistic]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

    const sock = getSocket();
    if (sock?.connected) {
      sock.emit(CLIENT_EVENTS.DM_SEND, { receiverId: peerId, text });
    } else {
      // Fallback to REST when socket isn't connected
      void dmApi.sendMessage(peerId, text)
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

  const accentColor = memberColor(peerId);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={[s.peerDot, { backgroundColor: accentColor }]}>
          <Text style={s.peerInitial}>{peerName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={s.headerTitle} numberOfLines={1}>{peerName}</Text>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={s.loader}>
          <ActivityIndicator color="#7B72F8" />
        </View>
      ) : messages.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="chatbubbles-outline" size={48} color="rgba(255,255,255,0.15)" />
          <Text style={s.emptyTitle}>{t('dm', 'emptyTitle')}</Text>
          <Text style={s.emptySub}>{t('dm', 'emptySub')}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={({ item }: ListRenderItemInfo<IDMMessage>) => (
            <MessageItem item={item} currentUserId={myId} />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <View style={[s.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder={t('dm', 'placeholder')}
          placeholderTextColor="rgba(255,255,255,0.28)"
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[s.sendBtn, !input.trim() && s.sendBtnOff]}
          onPress={handleSend}
          disabled={!input.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
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
  peerDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
    gap: 8,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.28)',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.18)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  msgRowMine: {
    flexDirection: 'row-reverse',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BUBBLE_RADIUS,
    gap: 3,
  },
  bubbleMine: {
    backgroundColor: '#7B72F8',
    borderBottomRightRadius: 5,
  },
  bubbleOther: {
    backgroundColor: '#1C1C2E',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  msgText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  msgTextMine: {
    color: '#fff',
  },
  timeLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.28)',
    alignSelf: 'flex-end',
  },
  timeLabelMine: {
    color: 'rgba(255,255,255,0.48)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    backgroundColor: '#111120',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    flex: 1,
    backgroundColor: '#1C1C2E',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7B72F8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B72F8',
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 8,
  },
  sendBtnOff: {
    backgroundColor: 'rgba(123,114,248,0.30)',
    shadowOpacity: 0,
    elevation: 0,
  },
});
