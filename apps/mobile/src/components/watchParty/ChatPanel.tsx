// CineSync Mobile — WatchParty ChatPanel
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ListRenderItemInfo,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@theme/index';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
}

function MessageItem({ item, currentUserId }: { item: ChatMessage; currentUserId: string }) {
  const isMine = item.userId === currentUserId;
  return (
    <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
      {!isMine && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {!isMine && <Text style={styles.username}>{item.username}</Text>}
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  );
}

export function ChatPanel({ messages, currentUserId, onSend }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  const renderItem = ({ item }: ListRenderItemInfo<ChatMessage>) => (
    <MessageItem item={item} currentUserId={currentUserId} />
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgOverlay },
  list: { padding: spacing.sm, gap: spacing.sm },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  messageRowMine: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  bubble: { maxWidth: '75%', padding: spacing.sm, borderRadius: borderRadius.md },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleOther: { backgroundColor: colors.bgElevated },
  username: { ...typography.caption, color: colors.secondary, marginBottom: 2 },
  messageText: { ...typography.body, color: colors.textPrimary },
  inputRow: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
});
