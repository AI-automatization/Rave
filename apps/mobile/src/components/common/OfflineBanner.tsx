// CineSync Mobile — Offline Banner Component
// Positions correctly below status bar using safe area insets.
// Slides in from ABOVE the screen (not from behind the status bar).
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, typography } from '@theme/index';

interface OfflineBannerProps {
  isOnline: boolean;
  onRetry: () => Promise<void>;
}

const CONTENT_HEIGHT = 40;

export function OfflineBanner({ isOnline, onRetry }: OfflineBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Total banner height = status bar area + content area
  const bannerHeight = insets.top + CONTENT_HEIGHT;
  const slideAnim = useRef(new Animated.Value(-bannerHeight)).current;

  useEffect(() => {
    // Animate to 0 (visible, covering top area) or -bannerHeight (fully above screen)
    Animated.spring(slideAnim, {
      toValue: isOnline ? -bannerHeight : 0,
      useNativeDriver: true,
      bounciness: 3,
      speed: 14,
    }).start();
  }, [isOnline, bannerHeight, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: bannerHeight,
          paddingTop: insets.top,
          backgroundColor: colors.warning + 'F0',
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={isOnline ? 'none' : 'auto'}
    >
      <View style={styles.content}>
        <Ionicons name="wifi-outline" size={16} color="#000" />
        <Text style={styles.label}>Internet aloqasi yo'q</Text>
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn} activeOpacity={0.7}>
          <Text style={styles.retryText}>Qayta urinish</Text>
          <Ionicons name="refresh-outline" size={13} color="#000" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    justifyContent: 'flex-end',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
    height: CONTENT_HEIGHT,
  },
  label: {
    ...typography.caption,
    color: '#000',
    fontWeight: '700',
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
  },
  retryText: {
    ...typography.caption,
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
});
