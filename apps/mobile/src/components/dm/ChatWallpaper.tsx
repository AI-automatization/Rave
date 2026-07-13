// WeWatch Mobile — DM chat background wallpaper: a scattered doodle-icon pattern
// behind the message list (Telegram-style chat wallpaper), using our own iconography
// and brand color instead of copying Telegram's proprietary pattern asset.
import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ICONS = ['film-outline', 'heart-outline', 'musical-notes-outline', 'chatbubble-ellipses-outline', 'star-outline', 'play-outline'] as const;
const CELL = 78;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COLS = Math.ceil(SCREEN_W / CELL) + 1;
const ROWS = Math.ceil(SCREEN_H / CELL) + 1;

export function ChatWallpaper() {
  const cells = useMemo(() => {
    const out: { key: string; x: number; y: number; icon: (typeof ICONS)[number]; rotate: string; size: number }[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        // Deterministic pseudo-scatter (no Math.random — stable across re-renders,
        // and identical on every screen open rather than reshuffling each time).
        const seed = (row * 7 + col * 13) % ICONS.length;
        const jitterX = ((row * 31 + col * 17) % 20) - 10;
        const jitterY = ((row * 11 + col * 23) % 20) - 10;
        const rotateSeed = (row * 19 + col * 5) % 40 - 20;
        // Offset every other row so icons don't line up into a rigid grid.
        const rowOffset = row % 2 === 0 ? 0 : CELL / 2;
        out.push({
          key: `${row}-${col}`,
          x: col * CELL + rowOffset + jitterX,
          y: row * CELL + jitterY,
          icon: ICONS[seed],
          rotate: `${rotateSeed}deg`,
          size: 22 + ((row + col) % 3) * 4,
        });
      }
    }
    return out;
  }, []);

  return (
    <View style={s.root} pointerEvents="none">
      {cells.map(c => (
        <Ionicons
          key={c.key}
          name={c.icon}
          size={c.size}
          color="rgba(123,114,248,0.09)"
          style={{ position: 'absolute', left: c.x, top: c.y, transform: [{ rotate: c.rotate }] }}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
