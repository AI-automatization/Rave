// WeWatch Mobile — inline "Today"/"Yesterday"/date pill between DM message groups (Telegram-style).
// Tappable — opens the jump-to-date calendar, same as the floating sticky header.
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

export function DateSeparator({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.wrap} activeOpacity={0.7} onPress={onPress} hitSlop={6}>
      <Text style={s.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(28,28,46,0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginVertical: 8,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
  },
});
