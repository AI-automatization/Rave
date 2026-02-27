import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import Redis from 'ioredis';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { morganStream } from '@shared/utils/logger';
import { createAdminRouter } from './routes/admin.routes';
import { createOperatorRouter } from './routes/operator.routes';
import { config } from './config/index';

export const createApp = (redis: Redis): express.Application => {
  const app = express();

  app.use(helmet());
  // Admin service: restricted CORS — admin UI only
  app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'admin', port: config.port });
  });

  app.use('/', createAdminRouter(redis));
  app.use('/operator', createOperatorRouter(redis));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
