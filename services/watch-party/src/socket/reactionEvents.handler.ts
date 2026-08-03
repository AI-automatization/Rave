import { Server as SocketServer, Socket } from 'socket.io';
import Redis from 'ioredis';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { REDIS_KEYS } from '@shared/constants';
import { logger } from '@shared/utils/logger';
import { JwtPayload } from '@shared/types';
import { resolveAvatar } from './chatEvents.handler';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  chatAvatar?: string | null;
}

// Max reactions per user per room per second
const REACTION_RATE_LIMIT = 10;
const REACTION_WINDOW_SEC = 1;

// Above this many reactions inside the trailing window, the sender is locked out for the rest
// of it — distinct from the per-second flood guard above, which only smooths bursts. This is
// what actually stops someone spamming the picker for a full minute straight (real report
// 2026-08-03: 20+ reactions in a row should trigger a visible cooldown, not just get throttled).
const BURST_LIMIT = 20;
const BURST_WINDOW_SEC = 60;

// Allowed emoji — unicode ranges: basic emoji + common reactions
const ALLOWED_EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}){1,2}$/u;

// Strict text-based fallback list for environments where unicode properties aren't reliable
const EMOJI_WHITELIST = new Set([
  '❤️', '😂', '😍', '🔥', '👏', '😮', '😢', '😡', '🎉', '👍',
  '👎', '💯', '🤣', '😱', '🥳', '😎', '🤩', '💔', '👀', '🍿',
]);

const isValidEmoji = (emoji: string): boolean => {
  return EMOJI_WHITELIST.has(emoji) || ALLOWED_EMOJI_REGEX.test(emoji);
};

export const registerReactionEvents = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
  redis: Redis,
): void => {
  socket.on(CLIENT_EVENTS.SEND_REACTION, async (data: unknown) => {
    const roomId = authSocket.roomId;
    if (!roomId) return;

    const { userId, username = '' } = authSocket.user;

    if (
      typeof data !== 'object' ||
      data === null ||
      typeof (data as Record<string, unknown>).emoji !== 'string'
    ) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Invalid reaction payload' });
      return;
    }

    const emoji = ((data as Record<string, unknown>).emoji as string).trim();

    if (!isValidEmoji(emoji)) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Invalid emoji' });
      return;
    }

    // Redis rate limit: max 10 reactions/sec per user per room
    const rateKey = REDIS_KEYS.reactionRate(userId, roomId);
    try {
      const count = await redis.incr(rateKey);
      if (count === 1) {
        await redis.expire(rateKey, REACTION_WINDOW_SEC);
      }
      if (count > REACTION_RATE_LIMIT) {
        // Silent drop — no error emitted to avoid feedback loops
        return;
      }
    } catch (err) {
      // Redis down → allow (fail open, same policy as REST rate limiter)
      logger.warn('Redis unavailable for reaction rate limit — allowing', { userId, error: (err as Error).message });
    }

    // 20+ reactions inside a trailing 60s window → lock this sender out for the rest of it.
    // Unlike the per-second check above, this one DOES tell the client (REACTION_COOLDOWN) so
    // the UI can disable the picker and show a countdown instead of taps just going nowhere.
    const burstKey = REDIS_KEYS.reactionBurst(userId, roomId);
    try {
      const burstCount = await redis.incr(burstKey);
      if (burstCount === 1) {
        await redis.expire(burstKey, BURST_WINDOW_SEC);
      }
      if (burstCount > BURST_LIMIT) {
        const ttl = await redis.ttl(burstKey);
        socket.emit(SERVER_EVENTS.REACTION_COOLDOWN, { retryAfterSec: ttl > 0 ? ttl : BURST_WINDOW_SEC });
        return;
      }
    } catch (err) {
      logger.warn('Redis unavailable for reaction burst limit — allowing', { userId, error: (err as Error).message });
    }

    const avatar = await resolveAvatar(authSocket);

    io.to(roomId).emit(SERVER_EVENTS.REACTION_BROADCAST, {
      userId,
      username,
      avatar,
      emoji,
      roomId,
      timestamp: Date.now(),
    });
  });
};
