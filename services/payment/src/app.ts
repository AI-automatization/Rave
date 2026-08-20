import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { setupSentryErrorHandler } from '@shared/utils/sentry';
import { metricsMiddleware, registerMetricsEndpoint } from '@shared/utils/metrics';
import { requestId } from '@shared/middleware/requestId.middleware';
import { mongoSanitize } from '@shared/middleware/mongoSanitize.middleware';
import { timeout } from '@shared/middleware/timeout.middleware';
import { maintenanceGuard } from '@shared/middleware/maintenance.middleware';
import { apiLogger } from '@shared/middleware/apiLogger.middleware';
import { morganStream } from '@shared/utils/logger';
import { createPaymentRouter, WEBHOOK_ROUTE } from './routes/payment.routes';
import { config } from './config/index';

const WEBHOOK_FULL_PATH = `/api/v1/payment${WEBHOOK_ROUTE}`;

export const createApp = (): express.Application => {
  const app = express();

  // Railway reverse proxy
  app.set('trust proxy', 1);

  const allowedOrigins = config.corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);

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
  app.use(requestId);

  // The billing webhook needs the exact raw bytes to check its HMAC signature — every other
  // route gets the usual parsed JSON body. Branching here (instead of two separate app.use()
  // calls) avoids express.json() re-parsing on top of the raw buffer for the webhook path.
  app.use((req, res, next) => {
    if (req.path === WEBHOOK_FULL_PATH) {
      express.raw({ type: '*/*', limit: '1mb' })(req, res, next);
    } else {
      express.json({ limit: '10kb' })(req, res, next);
    }
  });

  app.use(mongoSanitize);
  app.use(metricsMiddleware());
  app.use(apiLogger('payment'));
  app.use(timeout());
  app.use(maintenanceGuard);

  app.get('/health', (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    res.status(mongoOk ? 200 : 503).json({
      status: mongoOk ? 'ok' : 'degraded',
      service: 'payment',
      checks: { mongo: mongoOk ? 'ok' : 'down' },
    });
  });

  app.use('/api/v1/payment', createPaymentRouter());

  app.use(notFoundHandler);

  registerMetricsEndpoint(app);
  setupSentryErrorHandler(app);
  app.use(errorHandler);

  return app;
};
