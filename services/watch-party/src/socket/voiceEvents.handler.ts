import { Socket } from 'socket.io';
import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

const VOICE_ROOM_KEY = (roomId: string) => `voice:room:${roomId}`;
const VOICE_MUTED_KEY = (roomId: string) => `voice:muted:${roomId}`;
const VOICE_TTL_SEC = 24 * 60 * 60;

export const registerVoiceEvents = (
  socket: Socket,
  authSocket: AuthenticatedSocket,
  redis: Redis,
): void => {
  const { userId } = authSocket.user;

  // JOIN VOICE — user must already be in a room
  socket.on(CLIENT_EVENTS.VOICE_JOIN, async () => {
    const roomId = authSocket.roomId;
    if (!roomId) return;

    const key = VOICE_ROOM_KEY(roomId);
    await redis.sadd(key, userId);
    await redis.expire(key, VOICE_TTL_SEC);

    // Reply with currently in-voice members (excluding self)
    const members = await redis.smembers(key);
    const existingMembers = members.filter((id) => id !== userId);
    // Who is currently muted (so a late joiner sees the right mic state)
    const mutedMembers = (await redis.smembers(VOICE_MUTED_KEY(roomId))).filter((id) => existingMembers.includes(id));
    socket.emit(SERVER_EVENTS.VOICE_JOINED, { members: existingMembers, muted: mutedMembers });

    socket.to(roomId).emit(SERVER_EVENTS.VOICE_USER_JOINED, { userId });
    logger.info('User joined voice chat', { userId, roomId });
  });

  // LEAVE VOICE
  socket.on(CLIENT_EVENTS.VOICE_LEAVE, async () => {
    const roomId = authSocket.roomId;
    if (!roomId) return;
    await redis.srem(VOICE_ROOM_KEY(roomId), userId);
    await redis.srem(VOICE_MUTED_KEY(roomId), userId);
    socket.to(roomId).emit(SERVER_EVENTS.VOICE_USER_LEFT, { userId });
    logger.info('User left voice chat', { userId, roomId });
  });

  // VOICE OFFER — relay to target by userId (via personal room)
  // Types are `unknown` because Node.js has no WebRTC globals; server just relays the payload.
  socket.on(CLIENT_EVENTS.VOICE_OFFER, (data: { to: string; offer: unknown }) => {
    socket.to(`user:${data.to}`).emit(SERVER_EVENTS.VOICE_OFFER, { from: userId, offer: data.offer });
  });

  // VOICE ANSWER — relay to target
  socket.on(CLIENT_EVENTS.VOICE_ANSWER, (data: { to: string; answer: unknown }) => {
    socket.to(`user:${data.to}`).emit(SERVER_EVENTS.VOICE_ANSWER, { from: userId, answer: data.answer });
  });

  // VOICE ICE — relay candidate to target
  socket.on(CLIENT_EVENTS.VOICE_ICE, (data: { to: string; candidate: unknown }) => {
    socket.to(`user:${data.to}`).emit(SERVER_EVENTS.VOICE_ICE, { from: userId, candidate: data.candidate });
  });

  // VOICE SPEAKING — relay speaking state to others in room
  socket.on(CLIENT_EVENTS.VOICE_SPEAKING, (data: { speaking: boolean }) => {
    const roomId = authSocket.roomId;
    if (!roomId) return;
    socket.to(roomId).emit(SERVER_EVENTS.VOICE_SPEAKING, { userId, speaking: data.speaking });
  });

  // VOICE MUTE — remember + relay mic mute state to others in room
  socket.on(CLIENT_EVENTS.VOICE_MUTE, async (data: { muted: boolean }) => {
    const roomId = authSocket.roomId;
    if (!roomId || typeof data?.muted !== 'boolean') return;
    const key = VOICE_MUTED_KEY(roomId);
    if (data.muted) {
      await redis.sadd(key, userId);
      await redis.expire(key, VOICE_TTL_SEC);
    } else {
      await redis.srem(key, userId);
    }
    socket.to(roomId).emit(SERVER_EVENTS.VOICE_MUTE, { userId, muted: data.muted });
  });
};
