import { Server as SocketServer, Socket } from 'socket.io';
import Redis from 'ioredis';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { REDIS_KEYS } from '@shared/constants';
import { logger } from '@shared/utils/logger';
import { JwtPayload } from '@shared/types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

// Max reactions per user per room per second
const REACTION_RATE_LIMIT = 10;
const REACTION_WINDOW_SEC = 1;

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

    const { userId } = authSocket.user;

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

    io.to(roomId).emit(SERVER_EVENTS.REACTION_BROADCAST, {
      userId,
      emoji,
      roomId,
      timestamp: Date.now(),
    });
  });
};
