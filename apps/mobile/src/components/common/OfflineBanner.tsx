// CineSync Mobile — Offline Banner Component
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography } from '@theme/index';

interface OfflineBannerProps {
  isOnline: boolean;
  onRetry: () => Promise<void>;
}

const BANNER_HEIGHT = 44;

export function OfflineBanner({ isOnline, onRetry }: OfflineBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useStyles();
  const slideAnim = useRef(new Animated.Value(-BANNER_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline ? -BANNER_HEIGHT : 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [isOnline, slideAnim]);

  return (
    <Animated.View
      style={[
        s.container,
        { top: insets.top, transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={isOnline ? 'none' : 'auto'}
    >
      <View style={s.content}>
        <Ionicons name="wifi-outline" size={18} color={colors.textPrimary} />
        <Text style={s.label}>Internet aloqasi yo'q</Text>
      </View>
      <TouchableOpacity onPress={onRetry} style={s.retryBtn} activeOpacity={0.7}>
        <Text style={s.retryText}>Qayta urinish</Text>
        <Ionicons name="arrow-forward-outline" size={14} color={colors.textPrimary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: colors.warning + 'E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  retryText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
}));
