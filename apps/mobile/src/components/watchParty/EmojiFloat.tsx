// WeWatch Mobile — WatchParty Emoji Float
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, View, ScrollView, Image } from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';

interface EmojiFloatItemProps {
  emoji: string;
  x: number;
  avatar?: string | null;
  username?: string;
  onDone: () => void;
}

export function EmojiFloatItem({ emoji, x, avatar, username, onDone }: EmojiFloatItemProps) {
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
      {avatar ? (
        <Image source={{ uri: avatar }} style={s.floatAvatar} />
      ) : username ? (
        <View style={s.floatAvatarFallback}>
          <Text style={s.floatAvatarInitial}>{username.charAt(0).toUpperCase()}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👏', '😮', '😢', '🎉', '👍', '💯', '🍿'];

interface EmojiPickerBarProps {
  onSelect: (emoji: string) => void;
  /** Seconds left in a server-driven burst lockout (0 = enabled). Backend caps reactions at 20
   * per rolling 60s window per user per room — past that it stops broadcasting and tells the
   * sender how long to wait, so the picker dims and shows a countdown instead of taps going
   * nowhere (real report 2026-08-03). */
  cooldownSec?: number;
}

export function EmojiPickerBar({ onSelect, cooldownSec = 0 }: EmojiPickerBarProps) {
  const isCoolingDown = cooldownSec > 0;
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
        style={[s.pickerScroll, isCoolingDown && s.pickerScrollDisabled]}
        scrollEnabled={!isCoolingDown}
      >
        {QUICK_EMOJIS.map(e => (
          <TrackedTouchable
            trackId="watchparty:send_emoji"
            key={e}
            onPress={() => onSelect(e)}
            disabled={isCoolingDown}
            style={s.emojiBtn}
            activeOpacity={0.65}
            trackMeta={{ emoji: e }}
          >
            <Text style={s.emojiChar}>{e}</Text>
          </TrackedTouchable>
        ))}
      </ScrollView>
      {isCoolingDown && (
        <View style={s.cooldownBadge} pointerEvents="none">
          <Text style={s.cooldownText}>{cooldownSec}s</Text>
        </View>
      )}
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
  floatAvatar: {
    width: 16, height: 16, borderRadius: 8,
    position: 'absolute', bottom: -4, right: -4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)',
  },
  floatAvatarFallback: {
    width: 16, height: 16, borderRadius: 8,
    position: 'absolute', bottom: -4, right: -4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: '#7B72F8',
    alignItems: 'center', justifyContent: 'center',
  },
  floatAvatarInitial: { fontSize: 9, fontWeight: '700', color: '#fff' },

  barWrap: {
    alignItems: 'center',
  },
  pickerScroll: {
    flexGrow: 0,
    maxWidth: '100%',
    borderRadius: 30,
  },
  pickerScrollDisabled: {
    opacity: 0.35,
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
  cooldownBadge: {
    position: 'absolute',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  cooldownText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
});
