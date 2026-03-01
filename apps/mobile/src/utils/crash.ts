/**
 * Crash reporting wrapper.
 * Production: @sentry/react-native o'rnatilganda SentryImpl ga almashtiriladi.
 * Hozircha: __DEV__ da console.warn, production da silent (Sentry stub).
 *
 * O'rnatish:
 *   npm install @sentry/react-native
 *   npx @sentry/wizard@latest -i reactNative
 * Keyin shu faylda SentryImpl ni uncomment qiling.
 */

// ─── Sentry stub (native module o'rnatilgunga qadar) ─────────────────────────

// import * as Sentry from '@sentry/react-native';
// export function initCrashReporting() {
//   Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.2 });
// }

export function initCrashReporting(): void {
  if (__DEV__) console.log('[crash] Crash reporting initialized (stub)');
}

export function reportError(error: Error, context?: Record<string, string>): void {
  if (__DEV__) {
    console.warn('[crash] Error reported:', error.message, context);
    return;
  }
  // Production: Sentry.captureException(error, { extra: context });
}

export function reportMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (__DEV__) {
    console.warn(`[crash] Message (${level}):`, message);
    return;
  }
  // Production: Sentry.captureMessage(message, level);
}

export function setUserContext(userId: string, username: string): void {
  if (__DEV__) return;
  // Production: Sentry.setUser({ id: userId, username });
}

export function clearUserContext(): void {
  if (__DEV__) return;
  // Production: Sentry.setUser(null);
}
