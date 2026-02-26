import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import Redis from 'ioredis';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { morganStream } from '@shared/utils/logger';
import { createWatchPartyRouter } from './routes/watchParty.routes';
import { WatchPartyService } from './services/watchParty.service';
import { registerWatchPartySocket } from './socket/watchParty.socket';
import { config } from './config/index';

export const createApp = (redis: Redis): { app: express.Application; io: SocketServer } => {
  const app = express();
  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  app.use(helmet());
  app.use(cors({ origin: '*', credentials: true }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'watch-party', port: config.port });
  });

  app.use('/', createWatchPartyRouter(redis));

  // Register Socket.io handlers
  const watchPartyService = new WatchPartyService(redis);
  registerWatchPartySocket(io, watchPartyService);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app: app as express.Application, io };
};
