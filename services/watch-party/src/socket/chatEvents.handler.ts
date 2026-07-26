import { Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import xss from 'xss';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';
import { axios, userServiceUrl } from '@shared/utils/serviceConfig';
import { logger } from '@shared/utils/logger';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  /** Resolved once per connection by resolveAvatar(); `null` = looked up, user has none. */
  chatAvatar?: string | null;
}

interface ReplyToPayload {
  id: string;
  text: string;
  senderName: string;
}

const MAX_MESSAGE_LEN = 500;
const MAX_REPLY_TEXT_LEN = 120;
const MAX_ID_LEN = 64;
const MAX_NAME_LEN = 64;
const AVATAR_LOOKUP_TIMEOUT_MS = 3000;

// The JWT carries no avatar (JwtPayload in shared/src/types) and watch-party stores room members as
// bare id strings — so the URL has to come from user-service. Resolved once per socket and cached on
// it, NOT per message: an active room would otherwise hit user-service on every single chat line.
// A failed lookup caches `null` as well — a missing avatar isn't worth retrying in a hot path, both
// clients already fall back to the coloured initial-circle placeholder.
const resolveAvatar = async (authSocket: AuthenticatedSocket): Promise<string | undefined> => {
  if (authSocket.chatAvatar === undefined) {
    try {
      const { data: body } = await axios.get(
        `${userServiceUrl}/api/v1/users/${authSocket.user.userId}/public`,
        { timeout: AVATAR_LOOKUP_TIMEOUT_MS },
      );
      authSocket.chatAvatar = (body?.data?.avatar as string | undefined) ?? null;
    } catch (err) {
      logger.warn('Chat: avatar lookup failed', {
        userId: authSocket.user.userId,
        error: (err as Error).message,
      });
      authSocket.chatAvatar = null;
    }
  }
  return authSocket.chatAvatar ?? undefined;
};

// Room chat is never persisted (no collection, no Redis list) — the server therefore cannot look a
// quoted message up by id, so the sender supplies the snapshot it is replying to. Every field is
// untrusted user input and gets the same xss()+length treatment as the message body.
// `messageId` is accepted alongside `id` because that is the field name mobile has always sent
// (apps/mobile/src/hooks/useWatchParty.ts sendMessage) — installed builds can't be updated in
// lockstep with the server, and rejecting them would keep reply silently broken there.
const sanitizeReplyTo = (raw: unknown): ReplyToPayload | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const { id, messageId, text, senderName } = raw as Record<string, unknown>;
  const rawId = typeof id === 'string' ? id : messageId;
  if (typeof rawId !== 'string' || typeof text !== 'string') return undefined;

  const safeId = xss(rawId.slice(0, MAX_ID_LEN));
  const safeText = xss(text.slice(0, MAX_REPLY_TEXT_LEN));
  if (!safeId || !safeText) return undefined;

  return {
    id: safeId,
    text: safeText,
    senderName: xss(String(senderName ?? '').slice(0, MAX_NAME_LEN)),
  };
};

export const registerChatEvents = (
  socket: Socket,
  authSocket: AuthenticatedSocket,
  checkRateLimit: (userId: string) => Promise<boolean>,
): void => {
  const { userId, username = '' } = authSocket.user;

  // CHAT MESSAGE — broadcast to all in room (including sender)
  socket.on(CLIENT_EVENTS.SEND_MESSAGE, async (data: { message: string; replyTo?: unknown }) => {
    if (!authSocket.roomId) return;
    if (!await checkRateLimit(userId)) {
      socket.emit('error', { message: 'Rate limit: sekundiga 10 ta xabar' });
      return;
    }
    const safeMessage = xss(String(data?.message ?? '').slice(0, MAX_MESSAGE_LEN)).trim();
    if (!safeMessage) return;

    // ONE payload object for both emits. The previous version built two literals with two separate
    // Date.now() calls, so the sender's copy and everyone else's copy could carry different
    // timestamps — and both web and mobile derive the message key from `userId-timestamp`, which
    // made the same message reply-addressable under two different ids. The server-issued `id` below
    // removes that guesswork entirely; clients that don't read it yet keep their old fallback.
    const payload = {
      id: randomUUID(),
      userId,
      username,
      avatar: await resolveAvatar(authSocket),
      message: safeMessage,
      replyTo: sanitizeReplyTo(data?.replyTo),
      timestamp: Date.now(),
    };

    // Use socket.nsp to reach all in room (equivalent to io.to from handler context)
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.ROOM_MESSAGE, payload);
    // Also emit to self so sender sees own message (matches original io.to behavior)
    socket.emit(SERVER_EVENTS.ROOM_MESSAGE, payload);
  });

  // EMOJI REACTION — broadcast to all in room (including sender)
  socket.on(CLIENT_EVENTS.SEND_EMOJI, async (data: { emoji: string }) => {
    if (!authSocket.roomId) return;
    if (!await checkRateLimit(userId)) return;
    const safeEmoji = xss(data.emoji.slice(0, 10));
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.ROOM_EMOJI, {
      userId,
      emoji: safeEmoji,
      timestamp: Date.now(),
    });
    // Also emit to self (matches original io.to behavior)
    socket.emit(SERVER_EVENTS.ROOM_EMOJI, {
      userId,
      emoji: safeEmoji,
      timestamp: Date.now(),
    });
  });
};
