// WeWatch Mobile — DM long-press action sheet (Reply / Forward / Copy / Cancel).
// Extracted from DMChatScreen.tsx to keep that file under the project's 400-line limit.
import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '@i18n/index';
import type { IDMMessage } from '@app-types/index';

export function MessageActionSheet({
  message, onReply, onForward, onCopy, onTogglePin, onClose,
}: {
  message: IDMMessage | null;
  onReply: (m: IDMMessage) => void;
  onForward: (m: IDMMessage) => void;
  onCopy: (m: IDMMessage) => void;
  onTogglePin: (m: IDMMessage) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={!!message} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={s.row}
            activeOpacity={0.7}
            onPress={() => { if (message) onReply(message); onClose(); }}
          >
            <Ionicons name="arrow-undo-outline" size={22} color="#fff" />
            <Text style={s.label}>{t('dm', 'reply')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.row}
            activeOpacity={0.7}
            onPress={() => { if (message) onForward(message); onClose(); }}
          >
            <Ionicons name="arrow-redo-outline" size={22} color="#fff" />
            <Text style={s.label}>{t('dm', 'forward')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.row}
            activeOpacity={0.7}
            onPress={() => { if (message) onTogglePin(message); onClose(); }}
          >
            <Ionicons name={message?.pinned ? 'remove-circle-outline' : 'pin-outline'} size={22} color="#fff" />
            <Text style={s.label}>{t('dm', message?.pinned ? 'unpinMessage' : 'pinMessage')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.row}
            activeOpacity={0.7}
            onPress={() => { if (message) onCopy(message); }}
          >
            <Ionicons name="copy-outline" size={22} color="#fff" />
            <Text style={s.label}>{t('dm', 'copy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.row, s.cancel]} activeOpacity={0.7} onPress={onClose}>
            <Text style={s.cancelLabel}>{t('dm', 'cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#16162a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  cancel: {
    justifyContent: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  cancelLabel: {
    fontSize: 16,
    color: '#F87171',
    fontWeight: '600',
  },
});
