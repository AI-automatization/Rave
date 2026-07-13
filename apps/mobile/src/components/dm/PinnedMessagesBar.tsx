// WeWatch Mobile — pinned-messages bar shown below the DM header (Telegram-style).
// Tapping the body jumps to the current pinned message and cycles to the next one
// if there's more than one; the X unpins the currently shown message directly.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '@i18n/index';
import type { IDMMessage } from '@app-types/index';

export function PinnedMessagesBar({
  pinnedMessages, onJump, onUnpin,
}: {
  pinnedMessages: IDMMessage[];
  onJump: (message: IDMMessage) => void;
  onUnpin?: (message: IDMMessage) => void;
}) {
  const { t } = useT();
  const [index, setIndex] = useState(0);

  // New pin count changed (added/removed) — start from the most recent one again.
  useEffect(() => { setIndex(0); }, [pinnedMessages.length]);

  if (pinnedMessages.length === 0) return null;
  const current = pinnedMessages[Math.min(index, pinnedMessages.length - 1)];

  const handlePress = () => {
    onJump(current);
    if (pinnedMessages.length > 1) setIndex(i => (i + 1) % pinnedMessages.length);
  };

  return (
    <View style={s.bar}>
      <View style={s.accent} />
      <TouchableOpacity style={s.body} activeOpacity={0.7} onPress={handlePress}>
        <Text style={s.title} numberOfLines={1}>
          {pinnedMessages.length > 1 ? `${t('dm', 'pinnedMessage')} ${index + 1}/${pinnedMessages.length}` : t('dm', 'pinnedMessage')}
        </Text>
        <Text style={s.text} numberOfLines={1}>{current.text}</Text>
      </TouchableOpacity>
      {onUnpin && (
        <TouchableOpacity style={s.closeBtn} onPress={() => onUnpin(current)} hitSlop={8}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#111120',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  accent: {
    width: 3,
    height: 30,
    borderRadius: 2,
    backgroundColor: '#7B72F8',
  },
  body: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9C93FF',
  },
  text: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  closeBtn: {
    padding: 4,
  },
});
