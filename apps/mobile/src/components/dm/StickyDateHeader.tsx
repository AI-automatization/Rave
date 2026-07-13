// WeWatch Mobile — floating date pill pinned near the top of the DM message list while
// scrolling (Telegram-style). Fades in on scroll activity, auto-fades out after a short
// idle period. Tap opens the jump-to-date calendar.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HIDE_DELAY_MS = 1300;
const HEADER_HEIGHT_OFFSET = 64; // sits just below the DM header bar, not overlapping it

export function StickyDateHeader({
  label, activityKey, onPress,
}: {
  label: string | null;
  /** Bump this (e.g. a counter) on every scroll event to keep the pill visible while scrolling. */
  activityKey: number;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!label) return;
    setMounted(true);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(
        ({ finished }) => { if (finished) setMounted(false); },
      );
    }, HIDE_DELAY_MS);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityKey, label]);

  if (!label || !mounted) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[s.wrap, { top: insets.top + HEADER_HEIGHT_OFFSET, opacity }]}
    >
      <TouchableOpacity style={s.pill} activeOpacity={0.8} onPress={onPress}>
        <Text style={s.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  pill: {
    backgroundColor: 'rgba(28,28,46,0.92)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
