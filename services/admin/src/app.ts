import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import Redis from 'ioredis';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { requestId } from '@shared/middleware/requestId.middleware';
import { timeout } from '@shared/middleware/timeout.middleware';
import { morganStream } from '@shared/utils/logger';
import { apiLogger } from '@shared/middleware/apiLogger.middleware';
import { createAdminRouter } from './routes/admin.routes';
import { createOperatorRouter } from './routes/operator.routes';
import { createErrorsRouter } from './routes/errors.routes';
import { swaggerSpec } from './utils/swagger';
import { config } from './config/index';

export const createApp = (redis: Redis): express.Application => {
  const app = express();

  // Railway reverse proxy
  app.set('trust proxy', 1);

  app.use(helmet());
  // Admin service: restricted CORS — admin UI + mobile ingest
  app.use(cors({ origin: [config.adminUrl, '*'], credentials: true }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '512kb' }));
  app.use(requestId);
  app.use(apiLogger('admin'));
  app.use(timeout());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'admin', port: config.port });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/api/v1/admin', createAdminRouter(redis));
  app.use('/api/v1/operator', createOperatorRouter(redis));
  app.use('/api/v1/errors', createErrorsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
