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

      // Receiver broadcast now happens centrally in dm.service.ts (POST /users/dm/:id
      // itself triggers it) — a single source of truth so a message created via this
      // socket path or via a plain REST call (e.g. notification-reply) both live-update
      // the receiver's open chat the same way. Echo to sender stays here — that's
      // specific to whoever is connected through THIS socket.
      socket.emit(SERVER_EVENTS.DM_MESSAGE, msg);
    } catch (err) {
      logger.error('DM send error', { userId, error: (err as Error).message });
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to send message' });
    }
  });

  // Reader scrolled to (or past) a message from `peerId` — mark everything up to it
  // read and, if that actually changed anything, tell the ORIGINAL SENDER (peerId)
  // in realtime so their tick marks flip to "read" without reopening the chat.
  socket.on(CLIENT_EVENTS.DM_READ_UNTIL, async (data: { peerId: string; messageId: string }) => {
    try {
      const { peerId, messageId } = data ?? {};
      if (!peerId || !messageId) return;

      const { data: body } = await axios.patch(
        `${userServiceUrl}/api/v1/users/dm/${peerId}/read-until`,
        { messageId },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 },
      );

      const upToCreatedAt = body?.data?.upToCreatedAt;
      if (upToCreatedAt) {
        io.to(`user:${peerId}`).emit(SERVER_EVENTS.DM_READ, { peerId: userId, upToCreatedAt });
      }
    } catch (err) {
      logger.error('DM read-until error', { userId, error: (err as Error).message });
    }
  });
};
