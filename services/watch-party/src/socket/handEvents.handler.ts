import { Server as SocketServer, Socket } from 'socket.io';
import Redis from 'ioredis';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { logger } from '@shared/utils/logger';
import { JwtPayload } from '@shared/types';
import { WatchPartyService } from '../services/watchParty.service';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  roomOwnerId?: string;
}

// Google Meet style "raise hand": a member asks for the floor, everyone sees ✋ next to the name,
// the member (or the room owner) lowers it. State lives in a Redis set per room so a reload or a
// late joiner still sees who is waiting.
const HANDS_TTL_SEC = 6 * 60 * 60;
const handsKey = (roomId: string): string => `room:${roomId}:hands`;

export async function clearHand(io: SocketServer, redis: Redis, roomId: string, userId: string): Promise<void> {
  try {
    if (await redis.srem(handsKey(roomId), userId)) {
      io.to(roomId).emit(SERVER_EVENTS.HANDS_UPDATED, { raised: await redis.smembers(handsKey(roomId)) });
    }
  } catch (err) {
    logger.warn('hands: clear failed', { roomId, userId, error: (err as Error).message });
  }
}

export const registerHandEvents = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
  watchPartyService: WatchPartyService,
  redis: Redis,
): void => {
  socket.on(CLIENT_EVENTS.RAISE_HAND, async (data: { raised?: boolean; targetUserId?: string; sync?: boolean }) => {
    const roomId = authSocket.roomId;
    if (!roomId || typeof data !== 'object' || data === null) return;
    const { userId } = authSocket.user;
    const key = handsKey(roomId);

    try {
      if (data.sync) {
        socket.emit(SERVER_EVENTS.HANDS_UPDATED, { raised: await redis.smembers(key) });
        return;
      }

      let target = userId;
      if (data.targetUserId && data.targetUserId !== userId) {
        // Only the owner may touch someone else's hand, and only to lower it.
        if (data.raised !== false) return;
        if (authSocket.roomOwnerId === undefined) {
          authSocket.roomOwnerId = (await watchPartyService.getRoom(roomId)).ownerId;
        }
        if (authSocket.roomOwnerId !== userId) return;
        target = data.targetUserId;
      }

      if (data.raised) {
        await redis.sadd(key, target);
        await redis.expire(key, HANDS_TTL_SEC);
      } else {
        await redis.srem(key, target);
      }
      io.to(roomId).emit(SERVER_EVENTS.HANDS_UPDATED, {
        raised: await redis.smembers(key),
        changed: { userId: target, raised: !!data.raised, username: target === userId ? authSocket.user.username : undefined },
      });
    } catch (err) {
      logger.warn('hands: update failed', { roomId, userId, error: (err as Error).message });
    }
  });
};
