'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { userApi } from '@/lib/api/user.api';
import type { DmMessage, Conversation } from '@/lib/api/user.api';
import { getSocket } from '@/lib/socket';
import { ApiError } from '@/lib/api-client';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await userApi.getConversations();
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useMessages(peerId: string | null) {
  return useQuery({
    queryKey: ['messages', peerId],
    queryFn: async () => {
      if (!peerId) return [];
      const res = await userApi.getMessages(peerId);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!peerId,
  });
}

export function usePinnedMessages(peerId: string | null) {
  return useQuery({
    queryKey: ['pinned', peerId],
    queryFn: async () => {
      if (!peerId) return [];
      const res = await userApi.getPinnedMessages(peerId);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!peerId,
  });
}

// Reconciles an incoming socket echo/broadcast against the optimistic cache: dedupe by real
// _id, and for own messages remove only the FIRST matching temp-* placeholder (not all of
// them) so two rapid identical sends don't both get wiped by one incoming echo. Ported from
// mobile's DMChatScreen handleIncoming.
function reconcileIncoming(list: DmMessage[], msg: DmMessage, myId: string | undefined): DmMessage[] {
  if (list.some((m) => m._id === msg._id)) return list;

  if (msg.senderId === myId) {
    const tempIdx = list.findIndex((m) => m._id.startsWith('temp-') && m.text === msg.text);
    if (tempIdx !== -1) {
      const next = list.slice();
      next.splice(tempIdx, 1, msg);
      return next;
    }
  }

  return [...list, msg];
}

// List-level realtime — always mounted (peerId=null) so the conversation list refreshes even
// when no chat is open; pass the open peerId to also reconcile/append into that chat's cache.
// myId comes from useAuthStore (see MessagesContent.tsx) — needed to tell "my own echoed
// message" apart from an incoming one when reconciling temp-* placeholders.
export function useDmRealtime(peerId: string | null, myId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    getSocket().then((socket) => {
      if (!mounted) return;

      const onMessage = (msg: DmMessage) => {
        if (!mounted) return;
        const isRelevant =
          peerId && (msg.senderId === peerId || msg.receiverId === peerId);

        if (isRelevant) {
          qc.setQueryData<DmMessage[]>(['messages', peerId], (old) =>
            reconcileIncoming(old ?? [], msg, myId));
        }
        qc.invalidateQueries({ queryKey: ['conversations'] });
      };

      // Fired when the PEER reads up to a given timestamp — flips our own sent messages to
      // read:true so the tick updates live. Only emitted over the socket path (see
      // services/watch-party/src/socket/dmEvents.handler.ts) — the REST read-until fallback
      // marks the DB but does not trigger this event, so a peer on REST-only won't show live.
      const onRead = (data: { peerId: string; upToCreatedAt: string }) => {
        if (!mounted || !peerId || data.peerId !== peerId) return;
        const upTo = new Date(data.upToCreatedAt).getTime();
        qc.setQueryData<DmMessage[]>(['messages', peerId], (old) =>
          (old ?? []).map((m) =>
            m.senderId === myId && !m.read && new Date(m.createdAt).getTime() <= upTo
              ? { ...m, read: true }
              : m));
      };

      socket.on(SERVER_EVENTS.DM_MESSAGE, onMessage);
      socket.on(SERVER_EVENTS.DM_READ, onRead);
      cleanup = () => {
        socket.off(SERVER_EVENTS.DM_MESSAGE, onMessage);
        socket.off(SERVER_EVENTS.DM_READ, onRead);
      };
    }).catch(() => {});

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [peerId, qc, myId]);
}

interface SendDmArgs {
  peerId: string;
  text: string;
  myId: string;
  replyToId?: string;
  replyToText?: string;
  replyToSender?: string;
}

// Optimistic send with temp-id reconciliation, ported from mobile's DMChatScreen.handleSend.
// Socket-first (so the room gets the message with minimal latency); REST fallback when the
// socket isn't connected. The temp message is reconciled away by useDmRealtime's onMessage
// once the real echo/broadcast arrives — this hook never removes it itself on success, since
// the socket path doesn't return the created message synchronously.
export function useSendDm() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ peerId, text, myId, replyToId, replyToText, replyToSender }: SendDmArgs) => {
      const now = new Date().toISOString();
      const temp: DmMessage = {
        _id: `temp-${Date.now()}`,
        senderId: myId,
        receiverId: peerId,
        text,
        read: false,
        replyToId: replyToId ?? null,
        replyToText: replyToText ?? null,
        replyToSender: replyToSender ?? null,
        forwardFrom: null,
        pinned: false,
        createdAt: now,
        updatedAt: now,
      };
      qc.setQueryData<DmMessage[]>(['messages', peerId], (old) => [...(old ?? []), temp]);

      try {
        const socket = await getSocket();
        if (socket.connected) {
          socket.emit(CLIENT_EVENTS.DM_SEND, { receiverId: peerId, text, replyToId });
          return temp;
        }
      } catch {
        // fall through to REST
      }

      const res = await userApi.sendDm(peerId, text, replyToId);
      if (!res.data) throw new Error('Empty response from sendDm');
      const sent = res.data;
      // REST path: reconcile immediately since there's no socket echo to do it for us.
      qc.setQueryData<DmMessage[]>(['messages', peerId], (old) =>
        reconcileIncoming((old ?? []).filter((m) => m._id !== temp._id), sent, myId));
      return sent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useToggleMute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ peerId, muted }: { peerId: string; muted: boolean }) =>
      userApi.toggleMute(peerId, muted),
    onMutate: async ({ peerId, muted }) => {
      await qc.cancelQueries({ queryKey: ['conversations'] });
      const prev = qc.getQueryData<Conversation[]>(['conversations']);
      qc.setQueryData<Conversation[]>(['conversations'], (old) =>
        (old ?? []).map((c) => (c.peerId === peerId ? { ...c, isMuted: muted } : c)));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['conversations'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useTogglePinConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ peerId, pinned }: { peerId: string; pinned: boolean }) =>
      userApi.togglePinConversation(peerId, pinned),
    onMutate: async ({ peerId, pinned }) => {
      await qc.cancelQueries({ queryKey: ['conversations'] });
      const prev = qc.getQueryData<Conversation[]>(['conversations']);
      qc.setQueryData<Conversation[]>(['conversations'], (old) =>
        (old ?? []).map((c) => (c.peerId === peerId ? { ...c, isPinned: pinned } : c)));
      return { prev };
    },
    // Rollback on error — most notably the server's 5-pin cap (403). Caller shows the toast.
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['conversations'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useTogglePinMessage(peerId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, pinned }: { messageId: string; pinned: boolean }) => {
      if (!peerId) throw new Error('No active conversation');
      return userApi.togglePinMessage(peerId, messageId, pinned);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pinned', peerId] });
      qc.invalidateQueries({ queryKey: ['messages', peerId] });
    },
  });
}

export function useForwardMessage() {
  return useMutation({
    mutationFn: ({ toPeerId, messageId }: { toPeerId: string; messageId: string }) =>
      userApi.forwardMessage(toPeerId, messageId),
  });
}

// Plain (non-hook) socket-first/REST-fallback read-until sender — used by use-dm-viewport's
// debounced view-based read marking, which isn't a user-triggered mutation so it doesn't need
// React Query's pending/error UI state, just fire-and-forget with a resilient fallback.
export async function sendReadUpTo(peerId: string, messageId: string): Promise<void> {
  try {
    const socket = await getSocket();
    if (socket.connected) {
      socket.emit(CLIENT_EVENTS.DM_READ_UNTIL, { peerId, messageId });
      return;
    }
  } catch {
    // fall through to REST
  }
  try {
    await userApi.markReadUpTo(peerId, messageId);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    // Swallow API errors here — this is a background best-effort read marker, not a
    // user-facing action; surfacing a toast for a failed read-receipt would be noise.
  }
}
