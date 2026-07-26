import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import Redis from 'ioredis';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { setupSentryErrorHandler } from '@shared/utils/sentry';
import { metricsMiddleware, registerMetricsEndpoint } from '@shared/utils/metrics';
import { requestId } from '@shared/middleware/requestId.middleware';
import { mongoSanitize } from '@shared/middleware/mongoSanitize.middleware';
import { timeout } from '@shared/middleware/timeout.middleware';
import { maintenanceGuard } from '@shared/middleware/maintenance.middleware';
import { apiLogger } from '@shared/middleware/apiLogger.middleware';
import { morganStream } from '@shared/utils/logger';
import { createUserRouter } from './routes/user.routes';
import { swaggerSpec } from './utils/swagger';
import { config } from './config/index';

export const createApp = (redis: Redis): express.Application => {
  const app = express();

  // Railway reverse proxy
  app.set('trust proxy', 1);

  const allowedOrigins = config.corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestId);
  app.use(mongoSanitize);
  app.use(metricsMiddleware());
  app.use(apiLogger('user'));
  app.use(timeout());
  app.use(maintenanceGuard);

  // Static uploads (avatar images)
  app.use('/uploads', express.static(path.resolve(config.uploadPath)));

  app.get('/health', async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    let redisOk = false;
    try { await redis.ping(); redisOk = true; } catch { redisOk = false; }
    const healthy = mongoOk && redisOk;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'user',
      checks: { mongo: mongoOk ? 'ok' : 'down', redis: redisOk ? 'ok' : 'down' },
    });
  });

  if (process.env.NODE_ENV !== 'production') { app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec)); }

  app.use('/api/v1/users', createUserRouter(redis));

  app.use(notFoundHandler);

  // Sentry error capture (#24)
  registerMetricsEndpoint(app);
  setupSentryErrorHandler(app);
  app.use(errorHandler);

  return app;
};
