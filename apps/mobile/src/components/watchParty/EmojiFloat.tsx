// WeWatch Mobile — WatchParty Emoji Float
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, View, ScrollView } from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';

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
      {/* 10 emojis at 36px + gaps + padding add up to ~440px — wider than most phone screens
          (360-410px CSS width), so the row silently overflowed past the screen edge with no way
          to reach the last couple of emojis (real report 2026-08-03: "выходит за экран"). A
          horizontal ScrollView is the one fix that's correct regardless of device width or how
          many quick-react emojis we ever add. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.pickerBar}
        style={s.pickerScroll}
      >
        {QUICK_EMOJIS.map(e => (
          <TrackedTouchable
            trackId="watchparty:send_emoji"
            key={e}
            onPress={() => onSelect(e)}
            style={s.emojiBtn}
            activeOpacity={0.65}
            trackMeta={{ emoji: e }}
          >
            <Text style={s.emojiChar}>{e}</Text>
          </TrackedTouchable>
        ))}
      </ScrollView>
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
  pickerScroll: {
    flexGrow: 0,
    maxWidth: '100%',
    borderRadius: 30,
  },
  pickerBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
