// WeWatch Mobile — DM forward target picker (bottom sheet listing your conversations).
// Extracted from DMChatScreen.tsx to keep that file under the project's 400-line limit.
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { TrackedPressable } from '@components/common/TrackedPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useQuery } from '@tanstack/react-query';
import { dmApi } from '@api/user.api';
import type { IDMConversation, IDMMessage } from '@app-types/index';
import { useT } from '@i18n/index';
import { spacing } from '@theme/index';
import { resolveMediaUrl } from '@utils/url';
import { memberColor } from '@utils/dmFormat';

export function ForwardPicker({
  message, currentPeerId, onClose,
}: {
  message: IDMMessage | null;
  currentPeerId: string;
  onClose: () => void;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: conversations = [] } = useQuery<IDMConversation[]>({
    queryKey: ['dm-conversations'],
    queryFn: () => dmApi.getConversations(),
    enabled: !!message,
  });

  const doForward = async (peerId: string) => {
    if (!message || sending) return;
    setSending(true);
    setError(null);
    try {
      await dmApi.forwardMessage(peerId, message._id);
      onClose();
    } catch {
      setError(t('dm', 'forwardBlocked'));
    } finally {
      setSending(false);
    }
  };

  const targets = conversations.filter(c => c.peerId !== currentPeerId);

  return (
    <Modal visible={!!message} transparent animationType="slide" onRequestClose={onClose}>
      <TrackedPressable trackId="dm:forward_picker_backdrop_close" style={s.sheetBackdrop} onPress={onClose}>
        <Pressable style={[s.fwdSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
          <View style={s.fwdHandle} />
          <Text style={s.fwdTitle}>{t('dm', 'forwardTitle')}</Text>
          {error && <Text style={s.fwdError}>{error}</Text>}
          {sending && <ActivityIndicator color="#7B72F8" style={{ marginVertical: 8 }} />}
          <FlatList
            data={targets}
            keyExtractor={c => c.peerId}
            style={{ maxHeight: 360 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const bg = memberColor(item.peerId);
              const initials = (item.peerUsername ?? '?').slice(0, 2).toUpperCase();
              return (
                <TrackedTouchable trackId="dm:forward_to_peer" style={s.fwdRow} activeOpacity={0.7} onPress={() => doForward(item.peerId)}>
                  {item.peerAvatar ? (
                    <Image source={{ uri: resolveMediaUrl(item.peerAvatar) }} style={s.fwdAvatar} contentFit="cover" />
                  ) : (
                    <View style={[s.fwdAvatar, s.fwdAvatarFallback, { backgroundColor: bg }]}>
                      <Text style={s.fwdInitials}>{initials}</Text>
                    </View>
                  )}
                  <Text style={s.fwdName} numberOfLines={1}>{item.peerUsername}</Text>
                  <Ionicons name="send" size={16} color="#7B72F8" />
                </TrackedTouchable>
              );
            }}
            ListEmptyComponent={<Text style={s.fwdEmpty}>{t('dm', 'convEmpty')}</Text>}
          />
        </Pressable>
      </TrackedPressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  fwdSheet: {
    backgroundColor: '#16162a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: spacing.md,
  },
  fwdHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  fwdTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  fwdError: {
    fontSize: 13,
    color: '#F87171',
    marginBottom: 8,
  },
  fwdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  fwdAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fwdAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fwdInitials: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  fwdName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  fwdEmpty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
