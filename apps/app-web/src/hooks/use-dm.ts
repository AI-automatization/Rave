'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { userApi } from '@/lib/api/user.api';
import type { DmMessage, Conversation } from '@/lib/api/user.api';
import { reportApi } from '@/lib/api/report.api';
import type { UserReportReason } from '@/lib/api/report.api';
import { getSocket } from '@/lib/socket';
import { ApiError } from '@/lib/api-client';
import { toast } from '@/store/toast.store';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await userApi.getConversations();
      return Array.isArray(res.data) ? res.data : [];
    },
    // useDmRealtime only mounts on the /messages page itself (peerId=null there), so a sidebar
    // badge shown on OTHER pages never gets the socket-driven invalidate — poll instead.
    refetchInterval: 30000,
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
  const t = useTranslations('dm');

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

      // Server-side send failure over the socket path (e.g. rejected because the peer
      // blocked you — see services/user/src/services/dm.service.ts sendMessage) has no
      // ack, so the optimistic temp-* bubble in useSendDm would otherwise sit there
      // looking sent forever. Pop the newest temp placeholder and surface a toast.
      const onError = () => {
        if (!mounted || !peerId) return;
        qc.setQueryData<DmMessage[]>(['messages', peerId], (old) => {
          if (!old) return old;
          const idx = [...old].reverse().findIndex((m) => m._id.startsWith('temp-'));
          if (idx === -1) return old;
          const realIdx = old.length - 1 - idx;
          return [...old.slice(0, realIdx), ...old.slice(realIdx + 1)];
        });
        toast.error(t('sendFailed'));
      };

      socket.on(SERVER_EVENTS.DM_MESSAGE, onMessage);
      socket.on(SERVER_EVENTS.DM_READ, onRead);
      socket.on(SERVER_EVENTS.ERROR, onError);
      cleanup = () => {
        socket.off(SERVER_EVENTS.DM_MESSAGE, onMessage);
        socket.off(SERVER_EVENTS.DM_READ, onRead);
        socket.off(SERVER_EVENTS.ERROR, onError);
      };
    }).catch(() => {});

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [peerId, qc, myId, t]);
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
  const t = useTranslations('dm');

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

      try {
        const res = await userApi.sendDm(peerId, text, replyToId);
        if (!res.data) throw new Error('Empty response from sendDm');
        const sent = res.data;
        // REST path: reconcile immediately since there's no socket echo to do it for us.
        qc.setQueryData<DmMessage[]>(['messages', peerId], (old) =>
          reconcileIncoming((old ?? []).filter((m) => m._id !== temp._id), sent, myId));
        return sent;
      } catch (err) {
        // e.g. 403 — the peer blocked you (services/user/src/services/dm.service.ts
        // sendMessage). Drop the optimistic bubble instead of leaving it looking sent.
        qc.setQueryData<DmMessage[]>(['messages', peerId], (old) =>
          (old ?? []).filter((m) => m._id !== temp._id));
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError && err.status === 403
        ? t('sendBlocked')
        : t('sendFailed'));
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

export function useReportUser() {
  return useMutation({
    mutationFn: ({ userId, reason, comment }: { userId: string; reason: UserReportReason; comment?: string }) =>
      reportApi.reportUser(userId, reason, comment),
  });
}

// Mirrors mobile's userApi.blockUser (apps/mobile/src/api/user.api.ts): server-side DM block
// (peer can no longer message you, either direction — enforced in dm.service.ts sendMessage)
// + remove friendship (if any) + file an automatic harassment report for moderators to review.
export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (peerId: string) => {
      // toggleBlock is the actual block — must throw on failure so the dialog shows an
      // error instead of closing as if the user were blocked. Unfriend + auto-report are
      // best-effort side effects and stay allSettled so neither one failing blocks the flow.
      await userApi.toggleBlock(peerId, true);
      await Promise.allSettled([
        userApi.removeFriend(peerId),
        reportApi.reportUser(peerId, 'harassment', 'User blocked by reporter'),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

// Unblock — lets the peer message you again. No unfriend-equivalent undo (blocking already
// removed the friendship; re-adding is a separate friend request).
export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (peerId: string) => userApi.toggleBlock(peerId, false),
    onMutate: async (peerId) => {
      await qc.cancelQueries({ queryKey: ['conversations'] });
      const prev = qc.getQueryData<Conversation[]>(['conversations']);
      qc.setQueryData<Conversation[]>(['conversations'], (old) =>
        (old ?? []).map((c) => (c.peerId === peerId ? { ...c, isBlocked: false } : c)));
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
