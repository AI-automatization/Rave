// WeWatch Mobile — WatchParty Emoji Float
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, TouchableOpacity, View } from 'react-native';

interface EmojiFloatItemProps {
  emoji: string;
  x: number;
  onDone: () => void;
}

export function EmojiFloatItem({ emoji, x, onDone }: EmojiFloatItemProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 120,
      }),
      Animated.timing(translateY, { toValue: -200, duration: 2200, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View
      style={[
        s.floatItem,
        { left: x },
        { transform: [{ translateY }, { scale }], opacity },
      ]}
    >
      <Text style={s.floatEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👏', '😮', '😢', '🎉', '👍', '💯', '🍿'];

interface EmojiPickerBarProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPickerBar({ onSelect }: EmojiPickerBarProps) {
  return (
    <View style={s.barWrap}>
      <View style={s.pickerBar}>
        {QUICK_EMOJIS.map(e => (
          <TouchableOpacity
            key={e}
            onPress={() => onSelect(e)}
            style={s.emojiBtn}
            activeOpacity={0.65}
          >
            <Text style={s.emojiChar}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  floatItem: {
    position: 'absolute',
    bottom: 80,
    zIndex: 20,
  },
  floatEmoji: { fontSize: 30 },

  barWrap: {
    alignItems: 'center',
  },
  pickerBar: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(8,8,18,0.88)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  emojiBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 18,
  },
  emojiChar: { fontSize: 20 },
});
