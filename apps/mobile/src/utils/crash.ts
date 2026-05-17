import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const initCrashReporting = (): void => {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 0 : 0.1,
    debug: false,
  });
};

export const crash = {
  captureException: (error: Error, context?: Record<string, unknown>): void => {
    if (__DEV__) console.error('[crash]', error.message, context); // eslint-disable-line no-console
    if (DSN) Sentry.captureException(error, { extra: context });
  },

  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info'): void => {
    if (__DEV__) console.warn('[crash]', level, message); // eslint-disable-line no-console
    if (DSN) Sentry.captureMessage(message, level);
  },

  setUser: (userId: string): void => {
    if (__DEV__) console.info('[crash] setUser', userId); // eslint-disable-line no-console
    if (DSN) Sentry.setUser({ id: userId });
  },

  clearUser: (): void => {
    if (DSN) Sentry.setUser(null);
  },
};
