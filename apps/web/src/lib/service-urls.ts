// Backend service URL resolver
// Railway uses internal DNS (e.g. auth.railway.internal),
// fallback to explicit env vars or localhost defaults.

function resolve(railwayEnv: string | undefined, fallbackEnv: string | undefined, defaultUrl: string): string {
  if (railwayEnv) return `https://${railwayEnv}`;
  return fallbackEnv ?? defaultUrl;
}

export const AUTH_SERVICE_URL = resolve(
  process.env.RAILWAY_SERVICE_AUTH_URL,
  process.env.AUTH_SERVICE_URL,
  'http://localhost:3001/api/v1/auth',
);

export const USER_SERVICE_URL = resolve(
  process.env.RAILWAY_SERVICE_USER_URL,
  process.env.USER_SERVICE_URL,
  'http://localhost:3002/api/v1',
);

export const CONTENT_SERVICE_URL = resolve(
  process.env.RAILWAY_SERVICE_CONTENT_URL,
  process.env.CONTENT_SERVICE_URL,
  'http://localhost:3003/api/v1',
);

export const WATCH_PARTY_SERVICE_URL = resolve(
  process.env.RAILWAY_SERVICE_WATCH_PARTY_URL,
  process.env.WATCH_PARTY_SERVICE_URL,
  'http://localhost:3004/api/v1',
);

export const NOTIFICATION_SERVICE_URL = resolve(
  process.env.RAILWAY_SERVICE_NOTIFICATION_URL,
  process.env.NOTIFICATION_SERVICE_URL,
  'http://localhost:3007/api/v1',
);

export const ADMIN_SERVICE_URL = resolve(
  process.env.RAILWAY_SERVICE_ADMIN_URL,
  process.env.ADMIN_SERVICE_URL,
  'http://localhost:3008/api/v1',
);

export const PAYMENT_SERVICE_URL = resolve(
  process.env.RAILWAY_SERVICE_PAYMENT_URL,
  process.env.PAYMENT_SERVICE_URL,
  'http://localhost:3009/api/v1',
);

/** Ensure URL ends with the given suffix */
export function ensureSuffix(url: string, suffix: string): string {
  return url.endsWith(suffix) ? url : `${url}${suffix}`;
}
