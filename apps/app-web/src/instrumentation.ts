import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      environment: process.env.NODE_ENV,
    });
  }

  // NOT initializing Sentry for the 'edge' runtime here: doing so collided with Next.js's own
  // edge-runtime Node-API shim (both independently redefine the non-configurable
  // globalThis.__import_unsupported guard property in the same sandbox context), crash-looping
  // every request through middleware ("Cannot redefine property: __import_unsupported").
  // Confirmed via local standalone-build repro — the crash persisted even after moving init()
  // into this instrumentation.ts file, so it's not a config-file-convention issue. middleware.ts
  // is a small cookie-check redirect with low bug surface; losing edge error capture there is an
  // acceptable trade-off against every deploy crash-looping. Revisit if @sentry/nextjs ships a fix.
}

export const onRequestError = Sentry.captureRequestError;
