import { Server as SocketServer, Socket } from 'socket.io';
import xss from 'xss';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';
import { axios, userServiceUrl } from '@shared/utils/serviceConfig';
import { logger } from '@shared/utils/logger';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

export const registerDMEvents = (io: SocketServer, socket: Socket): void => {
  const authSocket = socket as AuthenticatedSocket;
  const { userId } = authSocket.user;
  const token = socket.handshake.auth.token as string;

  socket.on(CLIENT_EVENTS.DM_SEND, async (data: { receiverId: string; text: string; replyToId?: string }) => {
    try {
      const { receiverId, text, replyToId } = data ?? {};
      if (!receiverId || !text) return;

      const safeText = xss(String(text).trim().slice(0, 2000));
      if (!safeText) return;

      const { data: body } = await axios.post(
        `${userServiceUrl}/api/v1/users/dm/${receiverId}`,
        { text: safeText, replyToId: replyToId ?? undefined },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 },
      );

      const msg = body?.data ?? body;

      // Deliver to receiver if online
      io.to(`user:${receiverId}`).emit(SERVER_EVENTS.DM_MESSAGE, msg);
      // Echo to sender
      socket.emit(SERVER_EVENTS.DM_MESSAGE, msg);
    } catch (err) {
      logger.error('DM send error', { userId, error: (err as Error).message });
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to send message' });
    }
  });
};
