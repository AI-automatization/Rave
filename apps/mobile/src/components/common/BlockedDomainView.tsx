// WeWatch Mobile — BlockedDomainView
// Shown instead of the video player when a domain is blocked by platform policy.
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';

interface Props {
  domain: string;
  onClose?: () => void;
}

export function BlockedDomainView({ domain, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useT();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="ban" size={48} color={colors.error} />
      </View>
      <Text style={styles.title}>{t('browser', 'domainBlocked')}</Text>
      <Text style={styles.domain}>{domain}</Text>
      <Text style={styles.message}>{t('browser', 'domainBlockedPolicy')}</Text>
      {onClose && (
        <TrackedTouchable trackId="blocked_domain:close" style={styles.btn} onPress={onClose}>
          <Text style={styles.btnText}>{t('common', 'close')}</Text>
        </TrackedTouchable>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.error,
    textAlign: 'center',
  },
  domain: {
    ...typography.body,
    color: colors.textMuted,
    fontFamily: 'monospace',
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
}));
