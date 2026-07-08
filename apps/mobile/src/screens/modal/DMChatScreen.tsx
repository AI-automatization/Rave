// WeWatch Mobile — DM Chat Screen (T-E137)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth.store';
import { dmApi } from '@api/user.api';
import { IDMMessage, IDMConversation, ModalStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { spacing } from '@theme/index';
import { getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';
import { useEnsureSocket } from '@hooks/useEnsureSocket';

type RouteType = RouteProp<ModalStackParamList, 'DMChat'>;

const BUBBLE_RADIUS = 20;

function memberColor(id: string): string {
  const palette = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function MessageItem({
  item, currentUserId, onLongPress,
}: {
  item: IDMMessage;
  currentUserId: string;
  onLongPress: (m: IDMMessage) => void;
}) {
  const isMine = item.senderId === currentUserId;
  const hasReply = !!item.replyToText;
  const isForward = !!item.forwardFrom;
  const { t } = useT();

  return (
    <Pressable
      onLongPress={() => onLongPress(item)}
      delayLongPress={220}
      style={[s.msgRow, isMine && s.msgRowMine]}
    >
      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
        {isForward && (
          <View style={s.fwdHeader}>
            <Ionicons name="arrow-redo" size={12} color={isMine ? 'rgba(255,255,255,0.75)' : '#7B72F8'} />
            <Text style={[s.fwdText, isMine && s.fwdTextMine]} numberOfLines={1}>
              {t('dm', 'forwardedFrom')}: {item.forwardFrom}
            </Text>
          </View>
        )}
        {hasReply && (
          <View style={[s.replyQuote, isMine && s.replyQuoteMine]}>
            <Text style={[s.replyQuoteSender, isMine && s.replyQuoteSenderMine]} numberOfLines={1}>
              {item.replyToSender || ''}
            </Text>
            <Text style={[s.replyQuoteText, isMine && s.replyQuoteTextMine]} numberOfLines={1}>
              {item.replyToText}
            </Text>
          </View>
        )}
        <Text style={[s.msgText, isMine && s.msgTextMine]}>{item.text}</Text>
        <Text style={[s.timeLabel, isMine && s.timeLabelMine]}>{formatTime(item.createdAt)}</Text>
      </View>
    </Pressable>
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
  const [replyTo, setReplyTo] = useState<IDMMessage | null>(null);
  const [actionMsg, setActionMsg] = useState<IDMMessage | null>(null);
  const [forwardMsg, setForwardMsg] = useState<IDMMessage | null>(null);

  // DM realtime uchun socket ulanishini kafolatlash (bug fix: socket null edi)
  useEnsureSocket();

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

    // Chat ochiq turganda peer'dan kelgan xabarni darhol "o'qilgan" deb belgilash —
    // aks holda unread hisoblagichi yig'ilib qoladi.
    if (msg.senderId === peerId) {
      void dmApi.markRead(peerId).catch(() => null);
    }
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
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={[s.peerDot, { backgroundColor: accentColor }]}>
          <Text style={s.peerInitial}>{peerName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={s.headerTextWrap}>
          <Text style={s.headerTitle} numberOfLines={1}>{peerName}</Text>
        </View>
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
            <MessageItem item={item} currentUserId={myId} onLongPress={setActionMsg} />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Reply preview */}
      {replyTo && (
        <View style={s.replyBar}>
          <View style={s.replyBarAccent} />
          <View style={s.replyBarBody}>
            <Text style={s.replyBarSender} numberOfLines={1}>{replyPreviewSender}</Text>
            <Text style={s.replyBarText} numberOfLines={1}>{replyTo.text}</Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)} style={s.replyBarClose} hitSlop={8}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
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

      {/* Long-press action sheet */}
      <Modal visible={!!actionMsg} transparent animationType="fade" onRequestClose={() => setActionMsg(null)}>
        <Pressable style={s.sheetBackdrop} onPress={() => setActionMsg(null)}>
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={s.sheetRow}
              activeOpacity={0.7}
              onPress={() => { if (actionMsg) setReplyTo(actionMsg); setActionMsg(null); }}
            >
              <Ionicons name="arrow-undo-outline" size={22} color="#fff" />
              <Text style={s.sheetLabel}>{t('dm', 'reply')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.sheetRow}
              activeOpacity={0.7}
              onPress={() => { const m = actionMsg; setActionMsg(null); if (m) setForwardMsg(m); }}
            >
              <Ionicons name="arrow-redo-outline" size={22} color="#fff" />
              <Text style={s.sheetLabel}>{t('dm', 'forward')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.sheetRow}
              activeOpacity={0.7}
              onPress={() => { if (actionMsg) void handleCopy(actionMsg); }}
            >
              <Ionicons name="copy-outline" size={22} color="#fff" />
              <Text style={s.sheetLabel}>{t('dm', 'copy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.sheetRow, s.sheetCancel]} activeOpacity={0.7} onPress={() => setActionMsg(null)}>
              <Text style={s.sheetCancelLabel}>{t('dm', 'cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Forward peer picker */}
      <ForwardPicker
        message={forwardMsg}
        currentPeerId={peerId}
        onClose={() => setForwardMsg(null)}
      />
    </KeyboardAvoidingView>
  );
}

// ── Forward peer picker ──────────────────────────────────────────────────────
function ForwardPicker({
  message, currentPeerId, onClose,
}: {
  message: IDMMessage | null;
  currentPeerId: string;
  onClose: () => void;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: conversations = [] } = useQuery<IDMConversation[]>({
    queryKey: ['dm-conversations'],
    queryFn: () => dmApi.getConversations(),
    enabled: !!message,
  });

  const doForward = async (peerId: string) => {
    if (!message || sending) return;
    setSending(true);
    setError(null);
    try {
      await dmApi.forwardMessage(peerId, message._id);
      onClose();
    } catch {
      setError(t('dm', 'forwardBlocked'));
    } finally {
      setSending(false);
    }
  };

  const targets = conversations.filter(c => c.peerId !== currentPeerId);

  return (
    <Modal visible={!!message} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.sheetBackdrop} onPress={onClose}>
        <Pressable style={[s.fwdSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
          <View style={s.fwdHandle} />
          <Text style={s.fwdTitle}>{t('dm', 'forwardTitle')}</Text>
          {error && <Text style={s.fwdError}>{error}</Text>}
          {sending && <ActivityIndicator color="#7B72F8" style={{ marginVertical: 8 }} />}
          <FlatList
            data={targets}
            keyExtractor={c => c.peerId}
            style={{ maxHeight: 360 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const bg = memberColor(item.peerId);
              const initials = (item.peerUsername ?? '?').slice(0, 2).toUpperCase();
              return (
                <TouchableOpacity style={s.fwdRow} activeOpacity={0.7} onPress={() => doForward(item.peerId)}>
                  {item.peerAvatar ? (
                    <Image source={{ uri: item.peerAvatar }} style={s.fwdAvatar} contentFit="cover" />
                  ) : (
                    <View style={[s.fwdAvatar, s.fwdAvatarFallback, { backgroundColor: bg }]}>
                      <Text style={s.fwdInitials}>{initials}</Text>
                    </View>
                  )}
                  <Text style={s.fwdName} numberOfLines={1}>{item.peerUsername}</Text>
                  <Ionicons name="send" size={16} color="#7B72F8" />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={s.fwdEmpty}>{t('dm', 'convEmpty')}</Text>}
          />
        </Pressable>
      </Pressable>
    </Modal>
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
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerInitial: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
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
    gap: 6,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 1,
  },
  msgRowMine: {
    flexDirection: 'row-reverse',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: BUBBLE_RADIUS,
    gap: 3,
  },
  bubbleMine: {
    backgroundColor: '#7B72F8',
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: '#1C1C2E',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fwdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  fwdText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#7B72F8',
    maxWidth: 180,
  },
  fwdTextMine: {
    color: 'rgba(255,255,255,0.8)',
  },
  replyQuote: {
    borderLeftWidth: 2.5,
    borderLeftColor: '#7B72F8',
    paddingLeft: 8,
    paddingVertical: 2,
    marginBottom: 3,
    backgroundColor: 'rgba(123,114,248,0.10)',
    borderRadius: 4,
  },
  replyQuoteMine: {
    borderLeftColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  replyQuoteSender: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9C93FF',
  },
  replyQuoteSenderMine: {
    color: '#fff',
  },
  replyQuoteText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  replyQuoteTextMine: {
    color: 'rgba(255,255,255,0.75)',
  },
  msgText: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.88)',
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
    color: 'rgba(255,255,255,0.55)',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: '#15152a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  replyBarAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: '#7B72F8',
  },
  replyBarBody: {
    flex: 1,
    gap: 1,
  },
  replyBarSender: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#9C93FF',
  },
  replyBarText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  replyBarClose: {
    padding: 4,
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
  // Action sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#16162a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  sheetLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  sheetCancel: {
    justifyContent: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  sheetCancelLabel: {
    fontSize: 16,
    color: '#F87171',
    fontWeight: '600',
  },
  // Forward picker
  fwdSheet: {
    backgroundColor: '#16162a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: spacing.md,
  },
  fwdHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  fwdTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  fwdError: {
    fontSize: 13,
    color: '#F87171',
    marginBottom: 8,
  },
  fwdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  fwdAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fwdAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fwdInitials: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  fwdName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  fwdEmpty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
