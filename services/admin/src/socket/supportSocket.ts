import http from 'http';
import { Server, Namespace, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '@shared/utils/logger';
import { config } from '../config/index';

interface SocketUser {
  userId: string;
  role?: string;
}

interface SupportSocketData {
  user: SocketUser;
}

let supportNs: Namespace | null = null;

export function initSupportSocket(httpServer: http.Server): void {
  const io = new Server(httpServer, {
    cors: {
      origin: config.adminUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  supportNs = io.of('/support');

  supportNs.use((socket: Socket<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, SupportSocketData>, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('unauthorized'));
    try {
      const payload = jwt.verify(token, config.jwtPublicKey, { algorithms: ['RS256'] }) as { userId?: string; sub?: string; role?: string };
      socket.data.user = {
        userId: payload.userId ?? payload.sub ?? 'unknown',
        role: payload.role,
      };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  supportNs.on('connection', (socket) => {
    const user = (socket.data as SupportSocketData).user;
    logger.info('[SupportSocket] connected', { userId: user?.userId });

    socket.on('support:join', (convId: string) => {
      if (typeof convId !== 'string' || !convId) return;
      void socket.join(`conv:${convId}`);
      logger.info('[SupportSocket] joined', { convId, userId: user?.userId });
    });

    socket.on('support:leave', (convId: string) => {
      if (typeof convId !== 'string' || !convId) return;
      void socket.leave(`conv:${convId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info('[SupportSocket] disconnected', { userId: user?.userId, reason });
    });
  });

  logger.info('[SupportSocket] /support namespace ready');
}

export function emitSupportMessage(convId: string, message: unknown): void {
  if (!supportNs) {
    logger.warn('[SupportSocket] not initialized', { convId });
    return;
  }
  supportNs.to(`conv:${convId}`).emit('support:message', message);
}

export function emitSupportClosed(convId: string): void {
  if (!supportNs) {
    logger.warn('[SupportSocket] not initialized', { convId });
    return;
  }
  supportNs.to(`conv:${convId}`).emit('support:closed', { convId });
}
