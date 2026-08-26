// WeWatch Mobile — owner-side "knock to enter" queue (2026-08-26)
// Mirrors useVirtualBrowser.ts's shape: a small standalone hook the room screen composes
// alongside useWatchPartyRoom, kept out of that file per its own "fragile, sync-critical"
// note (WatchPartyScreen.tsx) — this only needs isOwner, nothing sync-timing-related.
import { useCallback, useEffect, useState } from 'react';
import { getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';

export interface PendingJoinRequest {
  userId: string;
}

export function useJoinRequests(isOwner: boolean) {
  const [queue, setQueue] = useState<PendingJoinRequest[]>([]);

  useEffect(() => {
    if (!isOwner) return;
    const socket = getSocket();
    if (!socket) return;

    const onRequested = (data: { roomId: string; userId: string }) => {
      setQueue((prev) => (prev.some((r) => r.userId === data.userId) ? prev : [...prev, { userId: data.userId }]));
    };
    // ROOM_UPDATED already broadcasts on every approve/deny (roomEvents.handler.ts) so the
    // owner's own queue drops the entry the moment it's resolved, from any of their devices.
    const onRoomUpdated = (room: { pendingRequests?: { userId: string }[] }) => {
      if (!room.pendingRequests) return;
      const stillPending = new Set(room.pendingRequests.map((r) => r.userId));
      setQueue((prev) => prev.filter((r) => stillPending.has(r.userId)));
    };

    socket.on(SERVER_EVENTS.JOIN_REQUESTED, onRequested);
    socket.on(SERVER_EVENTS.ROOM_UPDATED, onRoomUpdated);
    return () => {
      socket.off(SERVER_EVENTS.JOIN_REQUESTED, onRequested);
      socket.off(SERVER_EVENTS.ROOM_UPDATED, onRoomUpdated);
    };
  }, [isOwner]);

  const approve = useCallback((targetUserId: string) => {
    getSocket()?.emit(CLIENT_EVENTS.APPROVE_JOIN_REQUEST, { targetUserId });
    setQueue((prev) => prev.filter((r) => r.userId !== targetUserId));
  }, []);

  const deny = useCallback((targetUserId: string) => {
    getSocket()?.emit(CLIENT_EVENTS.DENY_JOIN_REQUEST, { targetUserId });
    setQueue((prev) => prev.filter((r) => r.userId !== targetUserId));
  }, []);

  return { queue, approve, deny };
}
