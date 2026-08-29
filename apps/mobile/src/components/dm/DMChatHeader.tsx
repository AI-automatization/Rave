// WeWatch Mobile — DM chat top bar (back button + peer avatar + name).
// Extracted from DMChatScreen.tsx to keep that file under the project's 400-line limit.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { spacing } from '@theme/index';

export function DMChatHeader({
  peerName, accentColor, topInset, onBack, onMenuPress,
}: {
  peerName: string;
  accentColor: string;
  topInset: number;
  onBack: () => void;
  onMenuPress: () => void;
}) {
  return (
    <View style={[s.header, { paddingTop: topInset + 8 }]}>
      <TrackedTouchable trackId="dm:chat_back" onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </TrackedTouchable>
      <View style={[s.peerDot, { backgroundColor: accentColor }]}>
        <Text style={s.peerInitial}>{peerName.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={s.headerTextWrap}>
        <Text style={s.headerTitle} numberOfLines={1}>{peerName}</Text>
      </View>
      <TrackedTouchable trackId="dm:chat_menu" onPress={onMenuPress} style={s.menuBtn} activeOpacity={0.75}>
        <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
      </TrackedTouchable>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    backgroundColor: '#111120',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerInitial: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  menuBtn: {
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
