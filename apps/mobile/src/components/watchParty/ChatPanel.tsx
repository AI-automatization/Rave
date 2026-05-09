// CineSync Mobile — WatchParty ChatPanel
import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

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

function ReplyPreview({ replyTo, text }: { replyTo: ReplyTo; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.replyPreviewWrap}>
      <View style={styles.replyBar} />
      <View style={styles.replyPreviewContent}>
        <Text style={styles.replyPreviewName}>{replyTo.senderName}</Text>
        <Text style={styles.replyPreviewText} numberOfLines={1}>{text}</Text>
      </View>
    </View>
  );
}

function MessageItem({ item, currentUserId, onReply }: { item: ChatMessage; currentUserId: string; onReply: (msg: ChatMessage) => void }) {
  const styles = useStyles();
  const isMine = item.userId === currentUserId;
  return (
    <TouchableOpacity onLongPress={() => onReply(item)} activeOpacity={0.85} delayLongPress={400}>
      <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
        {!isMine && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {!isMine && <Text style={styles.username}>{item.username}</Text>}
          {item.replyTo && (
            <ReplyPreview replyTo={item.replyTo} text={item.replyTo.text} />
          )}
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ChatPanel({ messages, currentUserId, onSend }: ChatPanelProps) {
  const { colors } = useTheme();
  const styles = useStyles();
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
      {replyTo && (
        <View style={styles.replyBar2}>
          <Ionicons name="return-down-forward" size={14} color="rgba(255,255,255,0.4)" />
          <Text style={styles.replyBarName} numberOfLines={1}>
            {replyTo.senderName}: <Text style={styles.replyBarText}>{replyTo.text}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Xabar yozing..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          maxLength={200}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.8}>
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.bgOverlay },
  list: { padding: spacing.sm, gap: spacing.sm },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  messageRowMine: { flexDirection: 'row-reverse' },
  avatar: { width: 28, height: 28, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  bubble: { maxWidth: '75%', padding: spacing.sm, borderRadius: borderRadius.md },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleOther: { backgroundColor: colors.bgElevated },
  username: { ...typography.caption, color: colors.secondary, marginBottom: 2 },
  messageText: { ...typography.body, color: colors.textPrimary },
  replyPreviewWrap: { flexDirection: 'row', marginBottom: spacing.xs, gap: spacing.xs },
  replyBar: { width: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  replyPreviewContent: { flex: 1 },
  replyPreviewName: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 1 },
  replyPreviewText: { fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 14 },
  replyBar2: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: 'rgba(255,255,255,0.05)', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)' },
  replyBarName: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  replyBarText: { color: 'rgba(255,255,255,0.4)' },
  inputRow: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, fontSize: 14 },
  sendBtn: { width: 40, height: 40, backgroundColor: colors.primary, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
}));
