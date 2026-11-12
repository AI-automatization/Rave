// Client instrumentation runs on EVERY page of the merged host. Sentry (+ Replay) is ~170 KiB gzip;
// shipped on the landing it broke the Lighthouse budget (LCP, first-party script, total transfer).
// So marketing pages (/, /uz, /ru, /en …) load no Sentry at all, and app pages load it as a separate
// chunk. Landing → app is a full document navigation (different root layouts, see lib/app-url.ts),
// so this file runs again on the app page and Sentry starts there.
type SentryModule = typeof import('@sentry/nextjs');

const MARKETING_PATH = /^\/(?:$|(?:uz|ru|en)(?:\/|$))/;

let sentry: SentryModule | null = null;

if (typeof window !== 'undefined' && !MARKETING_PATH.test(window.location.pathname)) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      environment: process.env.NODE_ENV,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    sentry = Sentry;
  });
}

export function onRouterTransitionStart(href: string, navigationType: string): void {
  sentry?.captureRouterTransitionStart(href, navigationType);
}
