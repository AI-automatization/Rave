// WeWatch Mobile — BlockedAccountModal
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import { appealApi } from '@api/appeal.api';

interface BlockedAccountModalProps {
  visible: boolean;
  reason?: string;
  userId?: string;
  onClose: () => void;
}

type ScreenView = 'blocked' | 'appeal' | 'done';

export function BlockedAccountModal({ visible, reason, userId, onClose }: BlockedAccountModalProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useT();
  const [view, setView] = useState<ScreenView>('blocked');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitAppeal = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      await appealApi.create(message.trim(), reason, userId);
      setView('done');
    } catch {
      setError('Не удалось отправить. Проверьте соединение и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setView('blocked');
    setMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {view === 'blocked' && (
              <>
                <View style={styles.iconWrap}>
                  <Ionicons name="ban-outline" size={48} color={colors.error} />
                </View>
                <Text style={styles.title}>{t('blocked', 'title')}</Text>
                <Text style={styles.message}>{t('blocked', 'message')}</Text>
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonText}>{reason || t('blocked', 'noReason')}</Text>
                </View>
                <TouchableOpacity style={styles.appealBtn} onPress={() => setView('appeal')}>
                  <Ionicons name="document-text-outline" size={18} color="#fff" />
                  <Text style={styles.appealBtnText}>Подать апелляцию</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.okBtn} onPress={handleClose}>
                  <Text style={styles.okText}>{t('common', 'ok')}</Text>
                </TouchableOpacity>
              </>
            )}

            {view === 'appeal' && (
              <>
                <TouchableOpacity style={styles.backRow} onPress={() => setView('blocked')}>
                  <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
                  <Text style={styles.backText}>Назад</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Апелляция</Text>
                <Text style={styles.message}>Объясните, почему считаете блокировку несправедливой. Мы рассмотрим в течение 3 рабочих дней.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ваше сообщение..."
                  placeholderTextColor={colors.textSecondary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                {!!error && <Text style={styles.errorText}>{error}</Text>}
                <TouchableOpacity
                  style={[styles.appealBtn, !message.trim() && styles.disabledBtn]}
                  onPress={handleSubmitAppeal}
                  disabled={!message.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.appealBtnText}>Отправить</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {view === 'done' && (
              <>
                <View style={[styles.iconWrap, styles.iconSuccess]}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Апелляция отправлена</Text>
                <Text style={styles.message}>Мы рассмотрим ваш запрос и свяжемся с вами.</Text>
                <TouchableOpacity style={styles.okBtn} onPress={handleClose}>
                  <Text style={styles.okText}>Закрыть</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    width: '100%',
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconSuccess: {
    backgroundColor: 'rgba(123,114,248,0.12)',
  },
  title: {
    ...typography.h2,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  reasonBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  reasonText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  backText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.bgOverlay,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
    width: '100%',
    minHeight: 100,
    marginBottom: spacing.lg,
  },
  appealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    width: '100%',
    marginBottom: spacing.md,
  },
  appealBtnText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  okBtn: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  okText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
}));
