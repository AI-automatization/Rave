// CineSync Mobile — WatchParty ChatPanel
import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ListRenderItemInfo, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ReplyTo {
  messageId: string;
  senderName: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  text: string;
  timestamp: number;
  replyTo?: ReplyTo;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string, replyTo?: ReplyTo) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function memberColor(userId: string): string {
  const palette = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function MessageItem({
  item, currentUserId, onReply,
}: {
  item: ChatMessage; currentUserId: string; onReply: (msg: ChatMessage) => void;
}) {
  const isMine = item.userId === currentUserId;
  const avatarColor = memberColor(item.userId);

  return (
    <TouchableOpacity onLongPress={() => onReply(item)} activeOpacity={0.85} delayLongPress={400}>
      <View style={[s.messageRow, isMine && s.messageRowMine]}>
        {!isMine && (
          <View style={[s.avatar, { backgroundColor: avatarColor }]}>
            <Text style={s.avatarText}>{item.username[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={[s.bubbleGroup, isMine && s.bubbleGroupMine]}>
          {!isMine && (
            <Text style={s.senderName}>{item.username}</Text>
          )}
          <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
            {item.replyTo && (
              <View style={[s.replyPreview, isMine && s.replyPreviewMine]}>
                <View style={[s.replyAccent, isMine && s.replyAccentMine]} />
                <View style={s.replyContent}>
                  <Text style={[s.replyAuthor, isMine && s.replyAuthorMine]}>
                    {item.replyTo.senderName}
                  </Text>
                  <Text style={[s.replyText, isMine && s.replyTextMine]} numberOfLines={1}>
                    {item.replyTo.text}
                  </Text>
                </View>
              </View>
            )}
            <Text style={[s.messageText, isMine && s.messageTextMine]}>{item.text}</Text>
            <Text style={[s.timeLabel, isMine && s.timeLabelMine]}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ChatPanel({ messages, currentUserId, onSend }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const handleReply = (msg: ChatMessage) => {
    setReplyTo({ messageId: msg.id, senderName: msg.username, text: msg.text });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed, replyTo ?? undefined);
    setInput('');
    setReplyTo(null);
  };

  const renderItem = ({ item }: ListRenderItemInfo<ChatMessage>) => (
    <MessageItem item={item} currentUserId={currentUserId} onReply={handleReply} />
  );

  const canSend = input.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="chatbubbles" size={14} color="#7B72F8" />
          <Text style={s.headerTitle}>Xona chati</Text>
        </View>
        <Text style={s.msgCount}>{messages.length} xabar</Text>
      </View>

      {/* Messages / empty state */}
      {messages.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="chatbubble-outline" size={36} color="rgba(255,255,255,0.08)" />
          <Text style={s.emptyTitle}>Hali xabarlar yo&apos;q</Text>
          <Text style={s.emptySub}>Birinchi bo&apos;lib yozing!</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
        />
      )}

      {/* Reply preview */}
      {replyTo && (
        <View style={s.replyBar}>
          <View style={s.replyBarAccent} />
          <View style={s.replyBarContent}>
            <Text style={s.replyBarLabel}>{replyTo.senderName}ga javob</Text>
            <Text style={s.replyBarText} numberOfLines={1}>{replyTo.text}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setReplyTo(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.35)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Xabar yozing..."
          placeholderTextColor="rgba(255,255,255,0.28)"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          maxLength={200}
          multiline={false}
        />
        <TouchableOpacity
          style={[s.sendBtn, !canSend && s.sendBtnOff]}
          onPress={handleSend}
          activeOpacity={0.8}
          disabled={!canSend}
        >
          <Ionicons name="send" size={15} color="#fff" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const BUBBLE_RADIUS = 18;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#111120',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.1 },
  msgCount: { fontSize: 11, color: 'rgba(255,255,255,0.28)' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 48,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.22)' },
  emptySub: { fontSize: 12, color: 'rgba(255,255,255,0.14)' },

  list: { padding: 12, gap: 10 },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowMine: { flexDirection: 'row-reverse' },

  avatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginBottom: 2,
  },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  bubbleGroup: { maxWidth: '76%', gap: 3 },
  bubbleGroupMine: { alignItems: 'flex-end' },

  senderName: {
    fontSize: 11, fontWeight: '600',
    color: 'rgba(255,255,255,0.42)',
    paddingLeft: 4,
  },

  bubble: {
    paddingHorizontal: 13,
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

  replyPreview: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 10,
    padding: 7,
    marginBottom: 3,
  },
  replyPreviewMine: { backgroundColor: 'rgba(0,0,0,0.25)' },

  replyAccent: {
    width: 2.5, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
    flexShrink: 0,
  },
  replyAccentMine: { backgroundColor: 'rgba(255,255,255,0.65)' },

  replyContent: { flex: 1, minWidth: 0 },
  replyAuthor: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.65)', marginBottom: 1 },
  replyAuthorMine: { color: 'rgba(255,255,255,0.75)' },
  replyText: { fontSize: 11, color: 'rgba(255,255,255,0.42)', lineHeight: 14 },
  replyTextMine: { color: 'rgba(255,255,255,0.58)' },

  messageText: { fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 20 },
  messageTextMine: { color: '#fff' },

  timeLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.28)',
    alignSelf: 'flex-end',
    marginTop: 1,
  },
  timeLabelMine: { color: 'rgba(255,255,255,0.48)' },

  // Reply bar
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#111120',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  replyBarAccent: {
    width: 3, height: 30, borderRadius: 2,
    backgroundColor: '#7B72F8',
    flexShrink: 0,
  },
  replyBarContent: { flex: 1, minWidth: 0 },
  replyBarLabel: { fontSize: 11, fontWeight: '600', color: '#7B72F8', marginBottom: 1 },
  replyBarText: { fontSize: 11, color: 'rgba(255,255,255,0.38)' },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
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
  },
  sendBtn: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: '#7B72F8',
    alignItems: 'center', justifyContent: 'center',
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
