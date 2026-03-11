// CineSync Mobile — Sentry crash reporting stub
// Production: @sentry/react-native o'rnatilgach shu faylni to'ldirish

export const crash = {
  captureException: (error: Error, context?: Record<string, unknown>): void => {
    if (__DEV__) {
      console.error('[crash]', error.message, context); // eslint-disable-line no-console
    }
    // Production: Sentry.captureException(error, { extra: context });
  },

  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info'): void => {
    if (__DEV__) {
      console.warn('[crash]', level, message); // eslint-disable-line no-console
    }
    // Production: Sentry.captureMessage(message, level);
  },

  setUser: (userId: string): void => {
    // Production: Sentry.setUser({ id: userId });
    if (__DEV__) {
      console.info('[crash] setUser', userId); // eslint-disable-line no-console
    }
  },

  clearUser: (): void => {
    // Production: Sentry.setUser(null);
  },
};
