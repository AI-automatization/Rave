// WeWatch — Support chat sub-components (extracted from SupportChatScreen)
import React from 'react';
import {
  View, Text, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import type { SupportMessage } from '@api/support.api';

// ─── Message bubble ──────────────────────────────────────────────────────────

export function MessageItem({ item }: { item: SupportMessage }) {
  const { t } = useT();
  const s = useStyles();
  const isUser = item.senderRole === 'user';
  return (
    <View style={[s.row, isUser && s.rowMine]}>
      {!isUser && (
        <View style={s.avatar}>
          <Ionicons name="headset-outline" size={14} color="#fff" />
        </View>
      )}
      <View style={[s.bubble, isUser ? s.bubbleMine : s.bubbleOther]}>
        {!isUser && <Text style={s.senderLabel}>{t('settings', 'supportTitle')}</Text>}
        <Text style={s.msgText}>{item.text}</Text>
        <Text style={s.timestamp}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

// ─── Rating bottom sheet ─────────────────────────────────────────────────────

export function RatingBottomSheet({
  score, setScore, comment, setComment, onSubmit, onSkip, submitting,
}: {
  score: number; setScore: (n: number) => void;
  comment: string; setComment: (s: string) => void;
  onSubmit: () => void; onSkip: () => void; submitting: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useT();
  const s = useRatingStyles();
  return (
    <View style={s.overlay}>
      <View style={s.sheet}>
        <Text style={s.title}>{t('settings', 'supportRateTitle')}</Text>
        <Text style={s.sub}>{t('settings', 'supportRateSub')}</Text>
        <View style={s.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <TrackedTouchable trackId="support:rate_star" key={n} onPress={() => setScore(n)} activeOpacity={0.7} trackMeta={{ score: n }}>
              <Ionicons
                name={n <= score ? 'star' : 'star-outline'}
                size={36}
                color={n <= score ? colors.gold : colors.textMuted}
              />
            </TrackedTouchable>
          ))}
        </View>
        <TextInput
          style={s.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder={t('settings', 'supportRateComment')}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={200}
        />
        <TrackedTouchable
          trackId="support:rate_submit"
          style={[s.submitBtn, (!score || submitting) && { opacity: 0.4 }]}
          onPress={onSubmit}
          disabled={!score || submitting}
          activeOpacity={0.8}
        >
          <Text style={s.submitText}>{submitting ? t('settings', 'supportSending') : t('common', 'send')}</Text>
        </TrackedTouchable>
        <TrackedTouchable trackId="support:rate_skip" onPress={onSkip} style={s.skipBtn}>
          <Text style={s.skipText}>{t('settings', 'supportSkip')}</Text>
        </TrackedTouchable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createThemedStyles((colors) => ({
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
  timestamp: { fontSize: 10, color: colors.textDim, alignSelf: 'flex-end', marginTop: 2 },
}));

const useRatingStyles = createThemedStyles((colors) => ({
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
    backgroundColor: colors.overlay, justifyContent: 'flex-end', zIndex: 100,
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
  submitText: { ...typography.body, color: colors.white, fontWeight: '700' },
  skipBtn: { paddingVertical: spacing.sm },
  skipText: { ...typography.caption, color: colors.textMuted },
}));
