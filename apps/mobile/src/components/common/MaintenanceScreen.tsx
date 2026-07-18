import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';

interface MaintenanceScreenProps {
  onRetry: () => void;
  retrying?: boolean;
}

export function MaintenanceScreen({ onRetry, retrying = false }: MaintenanceScreenProps) {
  const { colors } = useTheme();
  const { t } = useT();
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgBase,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    iconWrap: {
      width: 96,
      height: 96,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.warning + '18',
      borderWidth: 1,
      borderColor: colors.warning + '35',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xxl,
      maxWidth: 300,
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary + '18',
      borderWidth: 1,
      borderColor: colors.primary + '40',
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    retryText: {
      ...typography.label,
      color: colors.primary,
    },
    tag: {
      position: 'absolute',
      top: 60,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.warning + '14',
      borderWidth: 1,
      borderColor: colors.warning + '30',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    tagText: {
      ...typography.caption,
      color: colors.warning,
      fontWeight: '600',
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.warning,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.tag}>
        <Animated.View style={[styles.dot, { transform: [{ scale: pulse }] }]} />
        <Text style={styles.tagText}>{t('maintenance', 'tag')}</Text>
      </View>

      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <View style={styles.iconWrap}>
          <Ionicons name="construct-outline" size={44} color={colors.warning} />
        </View>
      </Animated.View>

      <Text style={styles.title}>{t('maintenance', 'title')}</Text>
      <Text style={styles.subtitle}>{t('maintenance', 'subtitle')}</Text>

      <TrackedTouchable trackId="maintenance:retry" style={styles.retryBtn} onPress={onRetry} disabled={retrying} activeOpacity={0.7}>
        {retrying
          ? <Ionicons name="hourglass-outline" size={16} color={colors.primary} />
          : <Ionicons name="refresh-outline" size={16} color={colors.primary} />
        }
        <Text style={styles.retryText}>{retrying ? t('common', 'loading') : t('maintenance', 'retry')}</Text>
      </TrackedTouchable>
    </View>
  );
}
