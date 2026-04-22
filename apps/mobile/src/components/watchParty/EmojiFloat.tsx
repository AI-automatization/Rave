// CineSync Mobile — WatchParty Emoji Float
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated } from 'react-native';

interface EmojiFloatItemProps {
  emoji: string;
  x: number;
  onDone: () => void;
}

export function EmojiFloatItem({ emoji, x, onDone }: EmojiFloatItemProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -180, duration: 2000, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View
      style={[styles.floatItem, { left: x }, { transform: [{ translateY }], opacity }]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👏', '😮', '😢', '🎉', '👍', '💯', '🍿'];

interface EmojiPickerBarProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPickerBar({ onSelect }: EmojiPickerBarProps) {
  return (
    <Animated.View style={styles.pickerBar}>
      {QUICK_EMOJIS.map(e => (
        <Text key={e} style={styles.pickerEmoji} onPress={() => onSelect(e)}>
          {e}
        </Text>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatItem: {
    position: 'absolute',
    bottom: 80,
    zIndex: 99,
  },
  emoji: { fontSize: 28 },
  pickerBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
  },
  pickerEmoji: { fontSize: 22 },
});
