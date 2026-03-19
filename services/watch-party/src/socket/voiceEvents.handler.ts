import { Socket } from 'socket.io';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

export const registerVoiceEvents = (
  socket: Socket,
  authSocket: AuthenticatedSocket,
  voiceRooms: Map<string, Set<string>>,
): void => {
  const { userId } = authSocket.user;

  // JOIN VOICE — user must already be in a room
  socket.on(CLIENT_EVENTS.VOICE_JOIN, () => {
    const roomId = authSocket.roomId;
    if (!roomId) return;

    if (!voiceRooms.has(roomId)) voiceRooms.set(roomId, new Set());
    voiceRooms.get(roomId)!.add(userId);

    // Reply with currently in-voice members (excluding self)
    const existingMembers = [...voiceRooms.get(roomId)!].filter((id) => id !== userId);
    socket.emit(SERVER_EVENTS.VOICE_JOINED, { members: existingMembers });

    // Notify others in room
    socket.to(roomId).emit(SERVER_EVENTS.VOICE_USER_JOINED, { userId });
    logger.info('User joined voice chat', { userId, roomId });
  });

  // LEAVE VOICE
  socket.on(CLIENT_EVENTS.VOICE_LEAVE, () => {
    const roomId = authSocket.roomId;
    if (!roomId) return;
    voiceRooms.get(roomId)?.delete(userId);
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
};
