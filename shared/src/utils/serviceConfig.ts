import axios, { AxiosError } from 'axios';

export { axios, AxiosError };

export const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? '';

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
