// CineSync Mobile — BlockedAccountModal
import React from 'react';
import { View, Text, TouchableOpacity, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';

const SUPPORT_EMAIL = 'support@cinesync.app';

interface BlockedAccountModalProps {
  visible: boolean;
  reason?: string;
  onClose: () => void;
}

export function BlockedAccountModal({ visible, reason, onClose }: BlockedAccountModalProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useT();

  const handleContact = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="ban-outline" size={48} color={colors.error} />
          </View>

          <Text style={styles.title}>{t('blocked', 'title')}</Text>
          <Text style={styles.message}>{t('blocked', 'message')}</Text>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonText}>
              {reason || t('blocked', 'noReason')}
            </Text>
          </View>

          <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={styles.contactText}>{t('common', 'contact')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.okBtn} onPress={onClose}>
            <Text style={styles.okText}>{t('common', 'ok')}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  contactText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  okBtn: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
  },
  okText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
}));
