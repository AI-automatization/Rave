import type { Application } from 'express';

// Lazy-load @sentry/node to avoid crash when its peer dep @opentelemetry/core
// is absent (services that don't install @elastic/elasticsearch don't get it).
type SentryModule = typeof import('@sentry/node');
let sentry: SentryModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sentry = require('@sentry/node') as SentryModule;
} catch { /* @opentelemetry peer deps not available — Sentry disabled */ }

export const initSentry = (serviceName: string): void => {
  if (!sentry || !process.env.SENTRY_DSN) return;
  sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'production',
    serverName: serviceName,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    integrations: [sentry.mongooseIntegration()],
  });
};

export const setupSentryErrorHandler = (app: Application): void => {
  if (!sentry || !process.env.SENTRY_DSN) return;
  sentry.setupExpressErrorHandler(app);
};

export const captureException = (err: unknown): void => {
  sentry?.captureException(err);
};
