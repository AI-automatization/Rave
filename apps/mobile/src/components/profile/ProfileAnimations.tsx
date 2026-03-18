// CineSync Mobile — Profile animation primitives
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, borderRadius } from '@theme/index';

// ─── FadeInView ────────────────────────────────────────────────

interface FadeInViewProps {
  delay?: number;
  children: React.ReactNode;
  style?: object;
}

export const FadeInView = React.memo(function FadeInView({
  delay = 0,
  children,
  style,
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
});

// ─── AnimatedProgressBar ───────────────────────────────────────

interface AnimatedProgressBarProps {
  progress: number;
  color: string;
  delay?: number;
}

export const AnimatedProgressBar = React.memo(function AnimatedProgressBar({
  progress,
  color,
  delay = 300,
}: AnimatedProgressBarProps) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(width, { toValue: progress, duration: 800, useNativeDriver: false }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [progress, delay, width]);

  return (
    <View style={s.progressTrack}>
      <Animated.View
        style={[
          s.progressFill,
          {
            backgroundColor: color,
            width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
});

// ─── PulsingDot ────────────────────────────────────────────────

interface PulsingDotProps {
  active: boolean;
}

export const PulsingDot = React.memo(function PulsingDot({ active }: PulsingDotProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [active, scale]);

  return (
    <View style={s.onlineDotWrap}>
      {active && (
        <Animated.View
          style={[s.onlinePulse, { backgroundColor: colors.success + '40', transform: [{ scale }] }]}
        />
      )}
      <View style={[s.onlineDot, { backgroundColor: active ? colors.success : colors.textDim }]} />
    </View>
  );
});

const s = StyleSheet.create({
  progressTrack: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: borderRadius.full },
  onlineDotWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  onlinePulse: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
});
