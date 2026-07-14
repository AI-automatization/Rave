// WeWatch Mobile — Support Chat Screen
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth.store';
import { supportApi, SupportMessage, SupportConversation } from '@api/support.api';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import { useSupportSocket } from '@hooks/useSupportSocket';
import { MessageItem, RatingBottomSheet } from '@components/common/SupportChatItems';

export function SupportChatScreen() {
  const { user } = useAuthStore();
  const userId = user?._id ?? '';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const s = useStyles();
  const { colors } = useTheme();
  const { t } = useT();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<SupportMessage>>(null);
  const [input, setInput] = useState('');

  const [showRating, setShowRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [creatingConv, setCreatingConv] = useState(false);

  const { data: conversations, isLoading: convLoading } = useQuery<SupportConversation[]>({
    queryKey: ['support-conversations', userId],
    queryFn: () => supportApi.getConversations(userId),
    enabled: !!userId,
  });

  const activeConv = conversations?.find(c => c.status === 'open') ?? conversations?.[0];

  useEffect(() => {
    if (activeConv?.rating?.score) {
      setRatingDone(true);
      setRatingScore(activeConv.rating.score);
    }
  }, [activeConv?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeConv?.status === 'closed' && !ratingDone && !activeConv?.rating?.score) {
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
    mutationFn: (text: string) => supportApi.sendMessage(userId, text, activeConv?._id),
    onSuccess: (newMsg) => {
      void queryClient.invalidateQueries({ queryKey: ['support-conversations', userId] });
      if (activeConv?._id) {
        queryClient.setQueryData<SupportMessage[]>(
          ['support-messages', activeConv._id],
          (old) => {
            const existing = old ?? [];
            if (existing.some(m => m._id === newMsg._id)) return existing;
            return [...existing, newMsg];
          },
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

  const startNewChat = useCallback(async () => {
    if (creatingConv) return;
    setCreatingConv(true);
    try {
      await supportApi.createConversation(userId);
      setRatingDone(false);
      setRatingScore(0);
      setRatingComment('');
      setShowRating(false);
      void queryClient.invalidateQueries({ queryKey: ['support-conversations', userId] });
    } catch { /* ignore */ }
    finally { setCreatingConv(false); }
  }, [creatingConv, userId, queryClient]);

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
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      <View style={s.header}>
        <TrackedTouchable trackId="support_chat:back" onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TrackedTouchable>
        <View style={s.headerInfo}>
          <Ionicons name="headset-outline" size={18} color={colors.primary} />
          <Text style={s.headerTitle}>{t('settings', 'supportTitle')}</Text>
        </View>
        <View style={s.spacer} />
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          {allMessages.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyTitle}>{t('settings', 'supportNoMessages')}</Text>
              <Text style={s.emptySub}>{t('settings', 'supportNoMessagesSub')}</Text>
            </View>
          )}
          <FlatList
            ref={listRef}
            data={allMessages}
            keyExtractor={item => item._id}
            renderItem={({ item }: ListRenderItemInfo<SupportMessage>) => <MessageItem item={item} />}
            contentContainerStyle={s.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {isClosed ? (
        <View style={s.closedBanner}>
          {ratingDone || activeConv?.rating?.score ? (
            <>
              <Text style={s.closedText}>{t('settings', 'supportThanks')}</Text>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Ionicons key={n}
                    name={n <= (ratingScore || activeConv?.rating?.score || 0) ? 'star' : 'star-outline'}
                    size={14} color={colors.gold}
                  />
                ))}
              </View>
            </>
          ) : (
            <Text style={s.closedText}>{t('settings', 'conversationClosed')}</Text>
          )}
          <TrackedTouchable trackId="support_chat:start_new_chat" style={s.newChatBtn} onPress={() => void startNewChat()} disabled={creatingConv} activeOpacity={0.8}>
            {creatingConv ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={16} color={colors.white} />
                <Text style={s.newChatText}>{t('settings', 'newChat')}</Text>
              </>
            )}
          </TrackedTouchable>
        </View>
      ) : (
        <View style={[s.inputRow, { paddingBottom: insets.bottom + spacing.xs }]}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('settings', 'writeMessage')}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TrackedTouchable
            trackId="support_chat:send"
            style={[s.sendBtn, (!input.trim() || sendMutation.isPending) && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            activeOpacity={0.8}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={colors.white} />
            )}
          </TrackedTouchable>
        </View>
      )}

      {showRating && !ratingDone && (
        <RatingBottomSheet
          score={ratingScore} setScore={setRatingScore}
          comment={ratingComment} setComment={setRatingComment}
          onSubmit={() => void submitRating()} onSkip={() => setShowRating(false)}
          submitting={submittingRating}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
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
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: spacing.sm, gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  input: {
    flex: 1, backgroundColor: colors.bgElevated, color: colors.textPrimary,
    borderRadius: borderRadius.lg, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: 14, maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  closedBanner: {
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bgSurface, alignItems: 'center', gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  closedText: { ...typography.caption, color: colors.textMuted },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, marginTop: spacing.xs,
    minWidth: 120, justifyContent: 'center',
  },
  newChatText: { ...typography.body, color: colors.white, fontWeight: '600' },
}));
