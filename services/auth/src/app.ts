import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
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
import { createAuthRouter } from './routes/auth.routes';
import { swaggerSpec } from './utils/swagger';
import { config } from './config/index';

export const createApp = (redis: Redis): express.Application => {
  const app = express();

  // Railway / reverse proxy behind load balancer
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: [config.clientUrl, ...config.adminUrls],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Request logging
  app.use(morgan('combined', { stream: morganStream }));

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Request ID tracking
  app.use(requestId);
  app.use(mongoSanitize);
  app.use(metricsMiddleware());
  app.use(apiLogger('auth'));

  // Request timeout — 30 seconds
  app.use(timeout());
  app.use(maintenanceGuard);

  // Passport — Google OAuth (faqat clientId mavjud bo'lsa)
  if (config.google.clientId) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.google.clientId,
          clientSecret: config.google.clientSecret,
          callbackURL: config.google.callbackUrl,
        },
        (_accessToken, _refreshToken, profile, done) => {
          const email = profile.emails?.[0]?.value ?? '';
          const picture = profile.photos?.[0]?.value ?? '';
          done(null, {
            id: profile.id,
            email,
            displayName: profile.displayName,
            picture,
          });
        },
      ),
    );
  }
  app.use(passport.initialize());

  // Health check (#32)
  app.get('/health', async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    let redisOk = false;
    try { await redis.ping(); redisOk = true; } catch { redisOk = false; }
    const healthy = mongoOk && redisOk;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'auth',
      checks: { mongo: mongoOk ? 'ok' : 'down', redis: redisOk ? 'ok' : 'down' },
    });
  });

  // API Docs
  if (process.env.NODE_ENV !== 'production') { app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec)); }

  // Routes
  app.use('/api/v1/auth', createAuthRouter(redis));

  // 404
  app.use(notFoundHandler);

  // Sentry error capture (before custom error handler) — #24
  registerMetricsEndpoint(app);
  setupSentryErrorHandler(app);

  // Global error handler
  app.use(errorHandler);

  return app;
};
