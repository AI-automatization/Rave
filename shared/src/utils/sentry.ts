import * as Sentry from '@sentry/node';
import type { Application } from 'express';

export const initSentry = (serviceName: string): void => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'production',
    serverName: serviceName,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    integrations: [
      Sentry.mongooseIntegration(),
    ],
  });
};

export const setupSentryErrorHandler = (app: Application): void => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.setupExpressErrorHandler(app);
};

export const captureException = (err: unknown): void => {
  Sentry.captureException(err);
};
