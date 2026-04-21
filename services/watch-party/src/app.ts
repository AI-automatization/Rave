import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import Redis from 'ioredis';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { requestId } from '@shared/middleware/requestId.middleware';
import { timeout } from '@shared/middleware/timeout.middleware';
import { morganStream } from '@shared/utils/logger';
import { createWatchPartyRouter } from './routes/watchParty.routes';
import { WatchPartyService } from './services/watchParty.service';
import { registerWatchPartySocket } from './socket/watchParty.socket';
import { swaggerSpec } from './utils/swagger';
import { config } from './config/index';

export const createApp = (redis: Redis): { app: express.Application; io: SocketServer; httpServer: ReturnType<typeof createServer> } => {
  const app = express();

  // Railway reverse proxy
  app.set('trust proxy', 1);
  const httpServer = createServer(app);

  const allowedOrigins = config.corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Redis pub/sub adapter — multi-instance scaling uchun
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '10kb' }));
  app.use(requestId);
  app.use(timeout());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'watch-party', port: config.port });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/api/v1/watch-party', createWatchPartyRouter(redis, io));

  // Register Socket.io handlers
  const watchPartyService = new WatchPartyService(redis);
  registerWatchPartySocket(io, watchPartyService, redis);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app: app as express.Application, io, httpServer };
};
