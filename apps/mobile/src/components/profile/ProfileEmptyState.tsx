// CineSync Mobile — Profile loading / not-found states
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';

interface ProfileEmptyStateProps {
  isLoading: boolean;
  titleLabel: string;
  retryLabel: string;
  onRetry: () => void;
}

export const ProfileEmptyState = React.memo(function ProfileEmptyState({
  isLoading,
  titleLabel,
  retryLabel,
  onRetry,
}: ProfileEmptyStateProps) {
  if (isLoading) {
    return (
      <View style={s.root}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.emptyIcon}>
        <Ionicons name="person-outline" size={40} color={colors.textDim} />
      </View>
      <Text style={s.emptyText}>{titleLabel}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={s.retryText}>{retryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
});

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
