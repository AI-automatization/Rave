// CineSync Mobile — ExtractStatus component
// Shows video URL extraction state: loading, success, or fallback
import React from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { VideoExtractResult } from '@api/content.api';

interface ExtractStatusProps {
  isExtracting: boolean;
  extractResult: VideoExtractResult | null;
  fallbackMode: boolean;
}

export function ExtractStatus({ isExtracting, extractResult, fallbackMode }: ExtractStatusProps) {
  if (isExtracting) {
    return (
      <View style={styles.status}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.statusText}>Video aniqlanmoqda...</Text>
      </View>
    );
  }

  if (extractResult) {
    return (
      <View style={styles.success}>
        {extractResult.poster ? (
          <Image source={{ uri: extractResult.poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="film" size={20} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {extractResult.title || 'Video topildi'}
          </Text>
          <Text style={styles.meta}>
            {extractResult.platform} · {extractResult.type.toUpperCase()}
            {extractResult.isLive ? ' · LIVE' : ''}
          </Text>
        </View>
        <Ionicons name="checkmark-circle" size={22} color={colors.success} />
      </View>
    );
  }

  if (fallbackMode) {
    return (
      <View style={styles.fallback}>
        <Ionicons name="globe-outline" size={18} color={colors.warning} />
        <View style={styles.fallbackInfo}>
          <Text style={styles.fallbackTitle}>WebView rejimida ochiladi</Text>
          <Text style={styles.fallbackSub}>
            Video stream aniqlanmadi. Sayt to'g'ridan WebView da ochiladi.
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  statusText: { ...typography.caption, color: colors.textSecondary },
  success: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
  },
  poster: {
    width: 40,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgSurface,
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, gap: 2 },
  title: { ...typography.body, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textMuted },
  fallback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  fallbackInfo: { flex: 1, gap: 2 },
  fallbackTitle: { ...typography.body, color: colors.warning, fontWeight: '600' },
  fallbackSub: { ...typography.caption, color: colors.textMuted },
});
