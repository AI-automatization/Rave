// CineSync Mobile — Support Chat Screen
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { useSupportSocket } from '@hooks/useSupportSocket';

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

function RatingBottomSheet({
  score, setScore, comment, setComment, onSubmit, onSkip, submitting,
}: {
  score: number; setScore: (n: number) => void;
  comment: string; setComment: (s: string) => void;
  onSubmit: () => void; onSkip: () => void; submitting: boolean;
}) {
  const { colors } = useTheme();
  const styles = useRatingStyles();
  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Оцените поддержку</Text>
        <Text style={styles.sub}>Как прошёл наш разговор?</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => setScore(n)} activeOpacity={0.7}>
              <Ionicons
                name={n <= score ? 'star' : 'star-outline'}
                size={36}
                color={n <= score ? '#FFD700' : colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Оставьте комментарий (необязательно)"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.submitBtn, (!score || submitting) && { opacity: 0.4 }]}
          onPress={onSubmit}
          disabled={!score || submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.submitText}>{submitting ? 'Отправляем…' : 'Отправить'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Пропустить</Text>
        </TouchableOpacity>
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

  const [showRating, setShowRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const { data: conversations, isLoading: convLoading } = useQuery<SupportConversation[]>({
    queryKey: ['support-conversations', userId],
    queryFn: () => supportApi.getConversations(userId),
    enabled: !!userId,
  });

  const activeConv = conversations?.find(c => c.status === 'open') ?? conversations?.[0];

  // Initialize rating state from existing conversation data
  useEffect(() => {
    if (activeConv?.rating?.score) {
      setRatingDone(true);
      setRatingScore(activeConv.rating.score);
    }
  }, [activeConv?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for conversation status change to 'closed'
  useEffect(() => {
    if (
      activeConv?.status === 'closed' &&
      !ratingDone &&
      !activeConv?.rating?.score
    ) {
      setShowRating(true);
    }
  }, [activeConv?.status, ratingDone, activeConv?.rating?.score]);

  const { data: messages, isLoading: msgLoading } = useQuery<SupportMessage[]>({
    queryKey: ['support-messages', activeConv?._id],
    queryFn: () => supportApi.listMessages(userId, activeConv!._id),
    enabled: !!activeConv,
    refetchInterval: 30_000,
  });

  const handleNewMessage = useCallback((msg: SupportMessage) => {
    if (!activeConv?._id) return;
    queryClient.setQueryData<SupportMessage[]>(
      ['support-messages', activeConv._id],
      (old) => {
        const existing = old ?? [];
        if (existing.some(m => m._id === msg._id)) return existing;
        return [...existing, msg];
      },
    );
  }, [activeConv?._id, queryClient]);

  const handleConvClosed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['support-conversations', userId] });
    setShowRating(true);
  }, [queryClient, userId]);

  useSupportSocket({
    convId: activeConv?._id,
    onMessage: handleNewMessage,
    onClosed: handleConvClosed,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      supportApi.sendMessage(userId, text, activeConv?._id),
    onSuccess: (newMsg) => {
      void queryClient.invalidateQueries({ queryKey: ['support-conversations', userId] });
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

  const submitRating = useCallback(async () => {
    if (!activeConv || !ratingScore || submittingRating) return;
    setSubmittingRating(true);
    try {
      await supportApi.rateConversation(userId, activeConv._id, ratingScore, ratingComment || undefined);
      setRatingDone(true);
      setShowRating(false);
      void queryClient.invalidateQueries({ queryKey: ['support-conversations', userId] });
    } catch { /* ignore */ }
    finally { setSubmittingRating(false); }
  }, [activeConv, ratingScore, ratingComment, submittingRating, userId, queryClient]);

  const isClosed = activeConv?.status === 'closed';
  const isLoading = convLoading || msgLoading;
  const allMessages: SupportMessage[] = messages ?? [];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
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

      {isClosed ? (
        <View style={styles.closedBanner}>
          {ratingDone || activeConv?.rating?.score ? (
            <>
              <Text style={styles.closedText}>Спасибо за оценку!</Text>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Ionicons
                    key={n}
                    name={n <= (ratingScore || activeConv?.rating?.score || 0) ? 'star' : 'star-outline'}
                    size={14}
                    color="#FFD700"
                  />
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.closedText}>Диалог закрыт</Text>
          )}
        </View>
      ) : (
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
      )}

      {showRating && !ratingDone && (
        <RatingBottomSheet
          score={ratingScore}
          setScore={setRatingScore}
          comment={ratingComment}
          setComment={setRatingComment}
          onSubmit={() => void submitRating()}
          onSkip={() => setShowRating(false)}
          submitting={submittingRating}
        />
      )}
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
  closedBanner: {
    padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bgSurface,
    alignItems: 'center', gap: spacing.xs,
  },
  closedText: { ...typography.caption, color: colors.textMuted },
}));

const useRatingStyles = createThemedStyles((colors) => ({
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, paddingBottom: spacing.xl + 16,
    alignItems: 'center', gap: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  commentInput: {
    width: '100%', backgroundColor: colors.bgElevated,
    color: colors.textPrimary, borderRadius: borderRadius.md,
    padding: spacing.md, fontSize: 14, minHeight: 72,
    textAlignVertical: 'top',
  },
  submitBtn: {
    width: '100%', backgroundColor: colors.primary,
    borderRadius: borderRadius.lg, paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitText: { ...typography.body, color: '#fff', fontWeight: '700' },
  skipBtn: { paddingVertical: spacing.sm },
  skipText: { ...typography.caption, color: colors.textMuted },
}));
