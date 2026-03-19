import { Socket } from 'socket.io';
import xss from 'xss';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

export const registerChatEvents = (
  socket: Socket,
  authSocket: AuthenticatedSocket,
  checkRateLimit: (userId: string) => boolean,
): void => {
  const { userId } = authSocket.user;

  // CHAT MESSAGE — broadcast to all in room (including sender)
  socket.on(CLIENT_EVENTS.SEND_MESSAGE, (data: { message: string }) => {
    if (!authSocket.roomId) return;
    if (!checkRateLimit(userId)) {
      socket.emit('error', { message: 'Rate limit: sekundiga 10 ta xabar' });
      return;
    }
    const safeMessage = xss(data.message.slice(0, 500));
    // Use socket.nsp to reach all in room (equivalent to io.to from handler context)
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.ROOM_MESSAGE, {
      userId,
      message: safeMessage,
      timestamp: Date.now(),
    });
    // Also emit to self so sender sees own message (matches original io.to behavior)
    socket.emit(SERVER_EVENTS.ROOM_MESSAGE, {
      userId,
      message: safeMessage,
      timestamp: Date.now(),
    });
  });

  // EMOJI REACTION — broadcast to all in room (including sender)
  socket.on(CLIENT_EVENTS.SEND_EMOJI, (data: { emoji: string }) => {
    if (!authSocket.roomId) return;
    if (!checkRateLimit(userId)) return;
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
