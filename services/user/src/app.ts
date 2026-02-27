import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import Redis from 'ioredis';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { morganStream } from '@shared/utils/logger';
import { createUserRouter } from './routes/user.routes';
import { createAchievementRouter } from './routes/achievement.routes';
import { swaggerSpec } from './utils/swagger';
import { config } from './config/index';

export const createApp = (redis: Redis): express.Application => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: '*', credentials: true }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static uploads (avatar images)
  app.use('/uploads', express.static(path.resolve(config.uploadPath)));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'user', port: config.port });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/api/v1/users', createUserRouter(redis));
  app.use('/api/v1/achievements', createAchievementRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
