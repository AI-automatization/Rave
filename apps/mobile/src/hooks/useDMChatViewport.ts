// WeWatch Mobile — DM chat viewport tracking: sticky date header, view-based read
// receipts, and "continue reading" scroll-position memory. All three share the same
// FlatList onViewableItemsChanged callback (FlatList only supports one), so they're
// bundled into a single hook rather than three separate ones.
// Extracted from DMChatScreen.tsx to keep that file under the project's 400-line limit.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlatList, ViewToken } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { dmApi } from '@api/user.api';
import { getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';
import { dmScrollPositionStorage } from '@utils/storage';
import type { DMListItem } from '@utils/dmDateGroups';

export function useDMChatViewport(
  peerId: string,
  listRef: React.RefObject<FlatList<DMListItem> | null>,
  listData: DMListItem[],
  messagesCount: number,
) {
  const queryClient = useQueryClient();

  // ── Sticky floating date header (Telegram-style) ────────────────────────────
  const currentDateKeyRef = useRef<string | null>(null);
  const [visibleLabel, setVisibleLabel] = useState<string | null>(null);
  const [visibleDateKey, setVisibleDateKey] = useState<string | null>(null);
  const [scrollActivity, setScrollActivity] = useState(0);

  // ── View-based read receipts ─────────────────────────────────────────────
  // A message only becomes "read" once the reader actually scrolls to it — not the
  // instant the chat opens. We track the furthest-down visible message from the
  // peer and, debounced, tell the server "everything up to here is read."
  const lastReadUpToIdRef = useRef<string | null>(null);
  const readDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitReadUpTo = useCallback((messageId: string) => {
    if (lastReadUpToIdRef.current === messageId) return;
    lastReadUpToIdRef.current = messageId;
    if (readDebounceRef.current) clearTimeout(readDebounceRef.current);
    readDebounceRef.current = setTimeout(() => {
      const sock = getSocket();
      if (sock?.connected) {
        sock.emit(CLIENT_EVENTS.DM_READ_UNTIL, { peerId, messageId });
      } else {
        void dmApi.markReadUpTo(peerId, messageId).catch(() => null);
      }
      void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
    }, 400);
  }, [peerId, queryClient]);

  // ── Remember scroll position ("continue reading", Telegram-style) ──────────
  const visibleTopIdRef = useRef<string | null>(null);
  const positionSaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;
      const top = viewableItems[0]?.item as DMListItem | undefined;
      if (top && top.dateKey !== currentDateKeyRef.current) {
        currentDateKeyRef.current = top.dateKey;
        setVisibleDateKey(top.dateKey);
        setVisibleLabel(top.label);
      }
      if (top) {
        visibleTopIdRef.current = top.id;
        if (positionSaveDebounceRef.current) clearTimeout(positionSaveDebounceRef.current);
        positionSaveDebounceRef.current = setTimeout(() => {
          void dmScrollPositionStorage.save(peerId, top.id);
        }, 600);
      }

      // Furthest-down (most recent) visible message that's actually FROM the peer —
      // own messages don't need marking, and reply/forward snapshots don't count.
      for (let i = viewableItems.length - 1; i >= 0; i--) {
        const entry = viewableItems[i]?.item as DMListItem | undefined;
        if (entry?.kind === 'message' && entry.message.senderId === peerId) {
          emitReadUpTo(entry.message._id);
          break;
        }
      }
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 0, minimumViewTime: 0 }).current;

  // Flush the last known scroll position on leaving the chat, so a position that
  // hasn't hit the 600ms debounce yet (e.g. quick open-then-back) isn't lost.
  useEffect(() => {
    return () => {
      if (positionSaveDebounceRef.current) clearTimeout(positionSaveDebounceRef.current);
      if (visibleTopIdRef.current) void dmScrollPositionStorage.save(peerId, visibleTopIdRef.current);
    };
  }, [peerId]);
  const handleScroll = useCallback(() => setScrollActivity(a => a + 1), []);

  // Initial position: restore where the reader left off last time instead of always
  // jumping to the newest message — keyed per-peerId so switching peers still restores
  // correctly if this screen instance gets reused across navigations.
  const restoredForPeerRef = useRef<string | null>(null);
  useEffect(() => {
    if (messagesCount === 0 || restoredForPeerRef.current === peerId) return;
    restoredForPeerRef.current = peerId;
    void dmScrollPositionStorage.get(peerId).then(savedId => {
      const idx = savedId ? listData.findIndex(i => i.id === savedId) : -1;
      setTimeout(() => {
        if (idx !== -1) {
          listRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
        } else {
          listRef.current?.scrollToEnd({ animated: false });
        }
      }, 100);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesCount, peerId]);

  return { visibleLabel, visibleDateKey, scrollActivity, handleScroll, onViewableItemsChanged, viewabilityConfig };
}
