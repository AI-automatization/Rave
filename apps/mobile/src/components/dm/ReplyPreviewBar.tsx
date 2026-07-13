// WeWatch Mobile — reply-preview bar shown above the DM input while composing a reply.
// Extracted from DMChatScreen.tsx to keep that file under the project's 400-line limit.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@theme/index';

export function ReplyPreviewBar({
  senderName, text, onCancel,
}: {
  senderName: string;
  text: string;
  onCancel: () => void;
}) {
  return (
    <View style={s.bar}>
      <View style={s.accent} />
      <View style={s.body}>
        <Text style={s.sender} numberOfLines={1}>{senderName}</Text>
        <Text style={s.text} numberOfLines={1}>{text}</Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={s.close} hitSlop={8}>
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: '#15152a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: '#7B72F8',
  },
  body: {
    flex: 1,
    gap: 1,
  },
  sender: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#9C93FF',
  },
  text: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  close: {
    padding: 4,
  },
});
