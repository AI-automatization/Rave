import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { setupSentryErrorHandler } from '@shared/utils/sentry';
import { requestId } from '@shared/middleware/requestId.middleware';
import { timeout } from '@shared/middleware/timeout.middleware';
import { morganStream } from '@shared/utils/logger';
import { apiLogger } from '@shared/middleware/apiLogger.middleware';
import { createAdminRouter } from './routes/admin.routes';
import { createOperatorRouter } from './routes/operator.routes';
import { createErrorsRouter } from './routes/errors.routes';
import { createSupportRouter } from './routes/support.routes';
import { createModerationRouter } from './routes/moderation.routes';
import { swaggerSpec } from './utils/swagger';
import { config } from './config/index';

export const createApp = (redis: Redis): express.Application => {
  const app = express();

  // Railway reverse proxy
  app.set('trust proxy', 1);

  app.use(helmet());
  // Admin UI routes: restricted CORS. /internal routes rely on verifyToken or requireInternalSecret — no wildcard needed.
  app.use(cors({ origin: [config.adminUrl], credentials: true }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '512kb' }));
  app.use(requestId);
  app.use(apiLogger('admin'));
  app.use(timeout());

  app.get('/health', async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    let redisOk = false;
    try { await redis.ping(); redisOk = true; } catch { redisOk = false; }
    const healthy = mongoOk && redisOk;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'admin',
      checks: { mongo: mongoOk ? 'ok' : 'down', redis: redisOk ? 'ok' : 'down' },
    });
  });

  if (process.env.NODE_ENV !== 'production') { app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec)); }

  app.use('/api/v1/admin', createAdminRouter(redis));
  app.use('/api/v1/operator', createOperatorRouter(redis));
  app.use('/api/v1/errors', createErrorsRouter());
  app.use('/api/v1', createSupportRouter());
  app.use('/api/v1', createModerationRouter());

  app.use(notFoundHandler);

  // Sentry error capture (#24)
  setupSentryErrorHandler(app);
  app.use(errorHandler);

  return app;
};
