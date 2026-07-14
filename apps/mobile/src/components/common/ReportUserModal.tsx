import React, { useState } from 'react';
import { View, Text, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import { reportApi, UserReportReason } from '@api/report.api';

interface ReportUserModalProps {
  visible: boolean;
  userId: string;
  username?: string;
  onClose: () => void;
}

export function ReportUserModal({ visible, userId, username, onClose }: ReportUserModalProps) {
  const { colors } = useTheme();
  const { t } = useT();
  const s = useStyles();
  const REASONS: { value: UserReportReason; label: string }[] = [
    { value: 'harassment',            label: t('common', 'reasonHarassment') },
    { value: 'spam',                  label: t('common', 'reasonSpam') },
    { value: 'inappropriate_content', label: t('common', 'reasonInappropriate') },
    { value: 'fake_account',          label: t('common', 'reasonFakeAccount') },
    { value: 'hate_speech',           label: t('common', 'reasonHateSpeech') },
    { value: 'other',                 label: t('common', 'reasonOther') },
  ];
  const [selected, setSelected] = useState<UserReportReason | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setSelected(null);
    setComment('');
    setDone(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await reportApi.reportUser(userId, selected, comment.trim() || undefined);
      setDone(true);
    } catch {
      setError(t('common', 'reportError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />

          {done ? (
            <View style={s.doneWrap}>
              <View style={s.doneIcon}>
                <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
              </View>
              <Text style={s.doneTitle}>{t('common', 'reportSent')}</Text>
              <Text style={s.doneSub}>{t('common', 'reportReview')}</Text>
              <TrackedTouchable trackId="report_user:done_close" style={s.closeBtn} onPress={handleClose}>
                <Text style={s.closeBtnText}>{t('common', 'close')}</Text>
              </TrackedTouchable>
            </View>
          ) : (
            <>
              <View style={s.header}>
                <View>
                  <Text style={s.title}>{t('common', 'reportUser')}</Text>
                  {username && <Text style={s.subtitle}>@{username}</Text>}
                </View>
                <TrackedTouchable trackId="report_user:close" onPress={handleClose} style={s.xBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TrackedTouchable>
              </View>

              <Text style={s.label}>{t('common', 'reportReason')}</Text>
              <ScrollView style={s.reasons} showsVerticalScrollIndicator={false}>
                {REASONS.map((r) => (
                  <TrackedTouchable
                    trackId="report_user:select_reason"
                    key={r.value}
                    style={[s.reasonRow, selected === r.value && s.reasonRowActive]}
                    onPress={() => setSelected(r.value)}
                    trackMeta={{ reason: r.value }}
                  >
                    <View style={[s.radio, selected === r.value && s.radioActive]}>
                      {selected === r.value && <View style={s.radioDot} />}
                    </View>
                    <Text style={[s.reasonLabel, selected === r.value && s.reasonLabelActive]}>
                      {r.label}
                    </Text>
                  </TrackedTouchable>
                ))}

                <Text style={[s.label, { marginTop: spacing.lg }]}>{t('common', 'reportComment')}</Text>
                <TextInput
                  style={s.input}
                  placeholder={t('common', 'reportCommentPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              {error && <Text style={s.errorText}>{error}</Text>}
              <TrackedTouchable
                trackId="report_user:submit"
                style={[s.submitBtn, !selected && s.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!selected || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.submitText}>{t('common', 'reportSend')}</Text>
                )}
              </TrackedTouchable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  xBtn: {
    padding: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasons: {
    flexGrow: 0,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  reasonRowActive: {
    backgroundColor: `${colors.primary}14`,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  reasonLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  reasonLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.bgOverlay,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: spacing.lg,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '700',
  },
  doneWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  doneIcon: {
    marginBottom: spacing.lg,
  },
  doneTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  doneSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
  },
  closeBtnText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    ...typography.caption,
    color: '#FF5757',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
}));
