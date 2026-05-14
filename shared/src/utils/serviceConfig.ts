import axios, { AxiosError } from 'axios';

export { axios, AxiosError };

const _secret = process.env.INTERNAL_SECRET ?? '';
if (_secret.length < 32) {
  const msg = `[SECURITY] INTERNAL_SECRET must be >= 32 chars (got ${_secret.length}). Set a strong secret in environment variables.`;
  if (process.env.NODE_ENV === 'production') throw new Error(msg);
  else if (process.env.NODE_ENV !== 'test') console.error(msg);
}
export const INTERNAL_SECRET = _secret;

export const internalHeaders = {
  'Content-Type': 'application/json',
  'X-Internal-Secret': INTERNAL_SECRET,
};

export const userServiceUrl =
  process.env.USER_SERVICE_URL ??
  (process.env.RAILWAY_SERVICE_USER_URL
    ? `https://${process.env.RAILWAY_SERVICE_USER_URL}`
    : 'http://localhost:3002');

export const notificationServiceUrl =
  process.env.NOTIFICATION_SERVICE_URL ??
  (process.env.RAILWAY_SERVICE_NOTIFICATION_URL
    ? `https://${process.env.RAILWAY_SERVICE_NOTIFICATION_URL}`
    : 'http://localhost:3007');

export const contentServiceUrl =
  process.env.CONTENT_SERVICE_URL ?? 'http://localhost:3003';

export const watchPartyServiceUrl =
  process.env.WATCH_PARTY_SERVICE_URL ?? 'http://localhost:3004';

export const battleServiceUrl =
  process.env.BATTLE_SERVICE_URL ?? 'http://localhost:3005';

export const authServiceUrl =
  process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';

export const adminServiceUrl =
  process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3008';
