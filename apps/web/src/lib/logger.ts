// Web logger — development: console, production: Sentry
export const logger = {
  error: (message: string, data?: unknown): void => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[CineSync Error] ${message}`, data ?? '');
    }
    // TODO: Sentry.captureException(new Error(message), { extra: data })
  },
  warn: (message: string, data?: unknown): void => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[CineSync Warn] ${message}`, data ?? '');
    }
  },
  info: (message: string, data?: unknown): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CineSync Info] ${message}`, data ?? '');
    }
  },
};
