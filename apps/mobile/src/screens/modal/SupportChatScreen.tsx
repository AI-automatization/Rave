// CineSync Mobile — Support Chat Screen
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth.store';
import { supportApi, SupportMessage, SupportConversation } from '@api/support.api';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

function MessageItem({ item }: { item: SupportMessage }) {
  const styles = useStyles();
  const isUser = item.senderRole === 'user';
  return (
    <View style={[styles.row, isUser && styles.rowMine]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="headset-outline" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleMine : styles.bubbleOther]}>
        {!isUser && <Text style={styles.senderLabel}>Поддержка</Text>}
        <Text style={styles.msgText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

export function SupportChatScreen() {
  const { user } = useAuthStore();
  const userId = user?._id ?? '';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<SupportMessage>>(null);
  const [input, setInput] = useState('');

  const { data: conversations, isLoading: convLoading } = useQuery<SupportConversation[]>({
    queryKey: ['support-conversations', userId],
    queryFn: () => supportApi.getConversations(userId),
    enabled: !!userId,
  });

  const activeConv = conversations?.find(c => c.status === 'open') ?? conversations?.[0];

  const { data: messages, isLoading: msgLoading } = useQuery<SupportMessage[]>({
    queryKey: ['support-messages', activeConv?._id],
    queryFn: () => supportApi.listMessages(userId, activeConv!._id),
    enabled: !!activeConv,
    refetchInterval: 8000,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      supportApi.sendMessage(userId, text, activeConv?._id),
    onSuccess: (newMsg) => {
      // Always refresh conversations — picks up newly created conv (first message) or updates lastMessageAt
      void queryClient.invalidateQueries({ queryKey: ['support-conversations', userId] });
      // Optimistic update only when conversation already existed
      if (activeConv?._id) {
        queryClient.setQueryData<SupportMessage[]>(
          ['support-messages', activeConv._id],
          (old) => [...(old ?? []), newMsg],
        );
      }
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
    setInput('');
  }, [input, sendMutation]);

  const isLoading = convLoading || msgLoading;

  const allMessages: SupportMessage[] = messages ?? [];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Ionicons name="headset-outline" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>Поддержка</Text>
        </View>
        <View style={styles.spacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          {allMessages.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Нет сообщений</Text>
              <Text style={styles.emptySub}>
                Напишите нам — мы ответим как можно скорее
              </Text>
            </View>
          )}
          <FlatList
            ref={listRef}
            data={allMessages}
            keyExtractor={item => item._id}
            renderItem={({ item }: ListRenderItemInfo<SupportMessage>) => (
              <MessageItem item={item} />
            )}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.xs }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Написать сообщение..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sendMutation.isPending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sendMutation.isPending}
          activeOpacity={0.8}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  spacer: { width: 38 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { ...typography.h3, color: colors.textSecondary },
  emptySub: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  list: { padding: spacing.md, gap: spacing.md, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  rowMine: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28, height: 28, borderRadius: borderRadius.full,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  bubble: { maxWidth: '78%', padding: spacing.sm, borderRadius: borderRadius.md, gap: 2 },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleOther: { backgroundColor: colors.bgElevated },
  senderLabel: { fontSize: 10, fontWeight: '700', color: colors.secondary, marginBottom: 2 },
  msgText: { ...typography.body, color: colors.textPrimary },
  timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.4)', alignSelf: 'flex-end', marginTop: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
}));
