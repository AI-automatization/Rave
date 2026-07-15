'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DMListItem } from '@/lib/dm/dm-date-groups';
import { dmScrollPositionStorage } from '@/lib/dm/scroll-position-storage';
import { sendReadUpTo } from '@/hooks/use-dm';

// Web analog of mobile's useDMChatViewport (apps/mobile/src/hooks/useDMChatViewport.ts).
// FlatList's single onViewableItemsChanged becomes one IntersectionObserver on the chat's
// scroll container, shared by three concerns exactly like the mobile hook: (1) sticky date
// header label, (2) view-based read marking, (3) scroll-position memory. The sticky header's
// own fade-in/fade-out timing lives in the StickyDateHeader component (mirrors mobile, where
// the hook only reports `label`/`activityKey` and StickyDateHeader.tsx owns the 1300ms timer).
const READ_DEBOUNCE_MS = 400;
const SCROLL_SAVE_DEBOUNCE_MS = 600;
const RESTORE_DELAY_MS = 100;

interface ViewportResult {
  visibleLabel: string | null;
  scrollActivity: number;
  registerItem: (id: string, el: HTMLElement | null) => void;
  onScroll: () => void;
  scrollToId: (id: string) => void;
}

export function useDmViewport(
  peerId: string | null,
  scrollRef: React.RefObject<HTMLElement | null>,
  listData: DMListItem[],
  messagesCount: number,
): ViewportResult {
  const [visibleLabel, setVisibleLabel] = useState<string | null>(null);
  const [scrollActivity, setScrollActivity] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const visibleIdsRef = useRef<Set<string>>(new Set());
  const indexByIdRef = useRef<Map<string, number>>(new Map());
  const listDataRef = useRef<DMListItem[]>(listData);

  const currentDateKeyRef = useRef<string | null>(null);
  const lastReadUpToIdRef = useRef<string | null>(null);
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleTopIdRef = useRef<string | null>(null);
  const restoredForPeerRef = useRef<string | null>(null);

  // Keep an id→index lookup in sync with the rendered list (list order == visual top-to-bottom
  // order, so "furthest down" among currently-visible ids is just the max index).
  useEffect(() => {
    listDataRef.current = listData;
    const map = new Map<string, number>();
    listData.forEach((item, idx) => map.set(item.id, idx));
    indexByIdRef.current = map;
  }, [listData]);

  const processVisibility = useCallback(() => {
    const visible = visibleIdsRef.current;
    if (visible.size === 0) return;
    const data = listDataRef.current;

    let topIdx = Infinity;
    let topId: string | null = null;
    let bottomMsgIdx = -1;
    let bottomMsgId: string | null = null;

    visible.forEach((id) => {
      const idx = indexByIdRef.current.get(id);
      if (idx === undefined) return;
      if (idx < topIdx) { topIdx = idx; topId = id; }
      const item = data[idx];
      if (item?.kind === 'message' && item.message.senderId === peerId && idx > bottomMsgIdx) {
        bottomMsgIdx = idx;
        bottomMsgId = item.message._id;
      }
    });

    // 1) Sticky date header — label of the topmost visible item's day.
    if (topId !== null) {
      const item = data[indexByIdRef.current.get(topId)!];
      if (item && item.dateKey !== currentDateKeyRef.current) {
        currentDateKeyRef.current = item.dateKey;
        setVisibleLabel(item.label);
      }
    }

    // 2) View-based read marking — only the peer's own messages, debounced, dedupe by id.
    if (bottomMsgId && bottomMsgId !== lastReadUpToIdRef.current && peerId) {
      if (readTimerRef.current) clearTimeout(readTimerRef.current);
      const targetId = bottomMsgId;
      readTimerRef.current = setTimeout(() => {
        lastReadUpToIdRef.current = targetId;
        void sendReadUpTo(peerId, targetId);
      }, READ_DEBOUNCE_MS);
    }

    // 3) Scroll-position memory — debounce-save the topmost visible message id.
    if (topId && peerId) {
      visibleTopIdRef.current = topId;
      if (scrollSaveTimerRef.current) clearTimeout(scrollSaveTimerRef.current);
      const idToSave = topId;
      scrollSaveTimerRef.current = setTimeout(() => {
        dmScrollPositionStorage.save(peerId, idToSave);
      }, SCROLL_SAVE_DEBOUNCE_MS);
    }
  }, [peerId]);

  // IntersectionObserver lifecycle — recreated when the scroll root changes.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.dmItemId;
          if (!id) continue;
          if (entry.isIntersecting) visibleIdsRef.current.add(id);
          else visibleIdsRef.current.delete(id);
        }
        processVisibility();
      },
      { root, threshold: 0 },
    );
    observerRef.current = observer;
    elementsRef.current.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [scrollRef, processVisibility]);

  const registerItem = useCallback((id: string, el: HTMLElement | null) => {
    const prev = elementsRef.current.get(id);
    if (prev && prev !== el) {
      observerRef.current?.unobserve(prev);
      elementsRef.current.delete(id);
      visibleIdsRef.current.delete(id);
    }
    if (el) {
      el.dataset.dmItemId = id;
      elementsRef.current.set(id, el);
      observerRef.current?.observe(el);
    }
  }, []);

  const onScroll = useCallback(() => {
    setScrollActivity((n) => n + 1);
  }, []);

  // Used by DatePickerModal ("jump to date") and PinnedMessagesBar ("jump to pin") — looks up
  // an already-registered rendered row by DMListItem id and scrolls it into view.
  const scrollToId = useCallback((id: string) => {
    elementsRef.current.get(id)?.scrollIntoView({ block: 'start' });
  }, []);

  // Restore scroll position once per peer (or jump to bottom if nothing saved).
  useEffect(() => {
    if (!peerId || messagesCount === 0) return;
    if (restoredForPeerRef.current === peerId) return;
    restoredForPeerRef.current = peerId;

    const savedId = dmScrollPositionStorage.get(peerId);
    const timer = setTimeout(() => {
      const root = scrollRef.current;
      if (!root) return;
      const el = savedId ? elementsRef.current.get(savedId) : undefined;
      if (el) {
        el.scrollIntoView({ block: 'start' });
      } else {
        root.scrollTop = root.scrollHeight;
      }
    }, RESTORE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [peerId, messagesCount, scrollRef]);

  // Flush the pending position save immediately on unmount (quick open→back shouldn't lose it).
  useEffect(() => {
    return () => {
      if (peerId && visibleTopIdRef.current) {
        dmScrollPositionStorage.save(peerId, visibleTopIdRef.current);
      }
      if (readTimerRef.current) clearTimeout(readTimerRef.current);
      if (scrollSaveTimerRef.current) clearTimeout(scrollSaveTimerRef.current);
    };
  }, [peerId]);

  return { visibleLabel, scrollActivity, registerItem, onScroll, scrollToId };
}
