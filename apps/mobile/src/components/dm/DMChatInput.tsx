// WeWatch Mobile — DM composer input row (text field + send button).
// Extracted from DMChatScreen.tsx to keep that file under the project's 400-line limit.
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@theme/index';

export function DMChatInput({
  value, onChangeText, onSend, placeholder, bottomInset,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  bottomInset: number;
}) {
  return (
    <View style={[s.row, { paddingBottom: Math.max(bottomInset, 12) }]}>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.28)"
        multiline
        maxLength={2000}
        returnKeyType="send"
        onSubmitEditing={onSend}
      />
      <TouchableOpacity
        style={[s.sendBtn, !value.trim() && s.sendBtnOff]}
        onPress={onSend}
        disabled={!value.trim()}
        activeOpacity={0.8}
      >
        <Ionicons name="send" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    backgroundColor: '#111120',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    flex: 1,
    backgroundColor: '#1C1C2E',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7B72F8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B72F8',
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 8,
  },
  sendBtnOff: {
    backgroundColor: 'rgba(123,114,248,0.30)',
    shadowOpacity: 0,
    elevation: 0,
  },
});
