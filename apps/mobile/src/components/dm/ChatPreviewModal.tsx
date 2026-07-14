// WeWatch Mobile — Telegram-style combined chat peek + action menu.
// Long-pressing a conversation row shows: a read-only preview of the chat (tapping
// it opens the real chat) and, right below, the same Pin/Mute actions as before —
// matching Telegram's single long-press gesture instead of two separate ones.
// The peek is read-only: fetches history under its own query key and never calls
// markRead/markReadUntil, so peeking never marks anything as read.
import React, { useRef } from 'react';
import { View, Text, FlatList, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { TrackedPressable } from '@components/common/TrackedPressable';
import { dmApi } from '@api/user.api';
import type { IDMConversation, IDMMessage } from '@app-types/index';
import { useT } from '@i18n/index';
import { memberColor, formatTime } from '@utils/dmFormat';
import { ChatWallpaper } from '@components/dm/ChatWallpaper';
import { PinnedMessagesBar } from '@components/dm/PinnedMessagesBar';

function PreviewBubble({ item, currentUserId }: { item: IDMMessage; currentUserId: string }) {
  const isMine = item.senderId === currentUserId;
  return (
    <View style={[s.msgRow, isMine && s.msgRowMine]}>
      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
        <Text style={[s.msgText, isMine && s.msgTextMine]}>{item.text}</Text>
        <Text style={[s.timeLabel, isMine && s.timeLabelMine]}>{formatTime(item.createdAt)}</Text>
      </View>
    </View>
  );
}

export function ChatPreviewModal({
  conversation, currentUserId, visible, onClose, onOpenFull, onToggleMute, onTogglePin,
}: {
  conversation: IDMConversation | null;
  currentUserId: string;
  visible: boolean;
  onClose: () => void;
  onOpenFull: () => void;
  onToggleMute: (c: IDMConversation) => void;
  onTogglePin: (c: IDMConversation) => void;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const peerId = conversation?.peerId ?? null;
  const peerName = conversation?.peerUsername ?? '';
  const accentColor = memberColor(peerId ?? '');
  const listRef = useRef<FlatList<IDMMessage>>(null);

  // Separate query key from the real chat screen's ['dm-history', peerId] — this is a
  // read-only peek, intentionally decoupled from the live chat's cache/side effects.
  const { data: messages = [], isLoading } = useQuery<IDMMessage[]>({
    queryKey: ['dm-preview', peerId],
    queryFn: () => dmApi.getHistory(peerId as string),
    enabled: visible && !!peerId,
    staleTime: 0,
  });
  const { data: pinnedMessages = [] } = useQuery<IDMMessage[]>({
    queryKey: ['dm-pinned', peerId],
    queryFn: () => dmApi.getPinnedMessages(peerId as string),
    enabled: visible && !!peerId,
    staleTime: 0,
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TrackedPressable trackId="dm:chat_preview_backdrop_close" style={[s.backdrop, { paddingTop: insets.top + 24 }]} onPress={onClose}>
        <TrackedPressable trackId="dm:chat_preview_open_full" style={s.card} onPress={onOpenFull}>
          <View style={[s.header, { borderBottomColor: accentColor + '30' }]}>
            <View style={[s.avatarDot, { backgroundColor: accentColor }]}>
              <Text style={s.avatarInitial}>{peerName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={s.headerTitle} numberOfLines={1}>{peerName}</Text>
          </View>
          <PinnedMessagesBar pinnedMessages={pinnedMessages} onJump={() => {}} />

          <View style={s.previewBody}>
            <ChatWallpaper />
            {isLoading ? (
              <View style={s.loader}><ActivityIndicator color="#7B72F8" /></View>
            ) : (
              <FlatList
                ref={listRef}
                data={messages.slice(-20)}
                keyExtractor={item => item._id}
                renderItem={({ item }) => <PreviewBubble item={item} currentUserId={currentUserId} />}
                contentContainerStyle={s.list}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              />
            )}
          </View>
        </TrackedPressable>

        {conversation && (
          <View style={s.menu}>
            <TrackedTouchable trackId="dm:chat_preview_toggle_pin" style={s.menuRow} activeOpacity={0.7} onPress={() => { onTogglePin(conversation); onClose(); }}>
              <Ionicons name={conversation.isPinned ? 'remove-circle-outline' : 'pin-outline'} size={20} color="#fff" />
              <Text style={s.menuLabel}>{t('dm', conversation.isPinned ? 'unpinChat' : 'pinChat')}</Text>
            </TrackedTouchable>
            <TrackedTouchable trackId="dm:chat_preview_toggle_mute" style={s.menuRow} activeOpacity={0.7} onPress={() => { onToggleMute(conversation); onClose(); }}>
              <Ionicons name={conversation.isMuted ? 'notifications-outline' : 'notifications-off-outline'} size={20} color="#fff" />
              <Text style={s.menuLabel}>{t('dm', conversation.isMuted ? 'unmute' : 'mute')}</Text>
            </TrackedTouchable>
          </View>
        )}
      </TrackedPressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    gap: 8,
  },
  card: {
    maxHeight: '58%',
    backgroundColor: '#16162a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
  },
  avatarDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  previewBody: {
    minHeight: 160,
    position: 'relative',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  list: {
    padding: 14,
    gap: 6,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  msgRowMine: {
    flexDirection: 'row-reverse',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 2,
  },
  bubbleMine: {
    backgroundColor: '#7B72F8',
    borderBottomRightRadius: 5,
  },
  bubbleOther: {
    backgroundColor: '#1C1C2E',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  msgText: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 18,
  },
  msgTextMine: {
    color: '#fff',
  },
  timeLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.28)',
    alignSelf: 'flex-end',
  },
  timeLabelMine: {
    color: 'rgba(255,255,255,0.55)',
  },
  menu: {
    backgroundColor: '#16162a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  menuLabel: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
});
