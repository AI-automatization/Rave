import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';

const APP_STORE_URL = 'https://apps.apple.com/app/wewatch/id6743666430';

export function UpdateRequiredScreen() {
  const { colors } = useTheme();
  const { t } = useT();

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
      backgroundColor: colors.primary + '18',
      borderWidth: 1,
      borderColor: colors.primary + '30',
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
    updateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    updateText: {
      ...typography.label,
      color: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="arrow-up-circle-outline" size={44} color={colors.primary} />
      </View>
      <Text style={styles.title}>{t('update', 'title')}</Text>
      <Text style={styles.subtitle}>{t('update', 'subtitle')}</Text>
      <TouchableOpacity style={styles.updateBtn} onPress={() => Linking.openURL(APP_STORE_URL)} activeOpacity={0.8}>
        <Ionicons name="logo-apple-appstore" size={16} color="#fff" />
        <Text style={styles.updateText}>{t('update', 'btn')}</Text>
      </TouchableOpacity>
    </View>
  );
}
