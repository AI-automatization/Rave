import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { morganStream } from '@shared/utils/logger';
import { createContentRouter } from './routes/content.routes';
import { swaggerSpec } from './utils/swagger';
import { config } from './config/index';

export const createApp = (redis: Redis, elastic: ElasticsearchClient): express.Application => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: '*', credentials: true }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'content', port: config.port });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/api/v1/content', createContentRouter(redis, elastic));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
