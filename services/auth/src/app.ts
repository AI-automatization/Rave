import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Redis from 'ioredis';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { morganStream } from '@shared/utils/logger';
import { createAuthRouter } from './routes/auth.routes';
import { config } from './config/index';

export const createApp = (redis: Redis): express.Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: [config.clientUrl, config.adminUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Request logging
  app.use(morgan('combined', { stream: morganStream }));

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Passport — Google OAuth
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
  app.use(passport.initialize());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth', port: config.port });
  });

  // Routes
  app.use('/', createAuthRouter(redis));

  // 404
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};
