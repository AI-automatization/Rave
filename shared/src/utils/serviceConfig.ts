import axios, { AxiosError } from 'axios';
import { getRequestId } from './requestContext';

// Propagate X-Request-ID to all inter-service calls
axios.interceptors.request.use((config) => {
  const rid = getRequestId();
  if (rid) config.headers['x-request-id'] = rid;
  return config;
});

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
  process.env.CONTENT_SERVICE_URL ??
  (process.env.RAILWAY_SERVICE_CONTENT_URL
    ? `https://${process.env.RAILWAY_SERVICE_CONTENT_URL}`
    : 'http://localhost:3003');

export const watchPartyServiceUrl =
  process.env.WATCH_PARTY_SERVICE_URL ??
  (process.env.RAILWAY_SERVICE_WATCH_PART_URL
    ? `https://${process.env.RAILWAY_SERVICE_WATCH_PART_URL}`
    : 'http://localhost:3004');

// Public-facing VB video URLs ONLY (vbSession.helper.ts's vb-capture/vb-media-proxy links handed
// to browser clients) — deliberately separate from watchPartyServiceUrl above, which is used far
// more broadly (socket connections, internal service-to-service calls) and must keep pointing at
// Railway's own domain regardless of this. Falls back to watchPartyServiceUrl itself (today's
// actual behavior — no CDN in front of video) when unset, so forgetting to configure this in an
// environment is a no-op, not a broken deploy. Cloudflare-proxied CNAME set up 2026-08-06
// (stream.wewatch.uz) specifically to let Cloudflare cache repeat range requests within a room —
// see vbCapture.controller.ts / vbMediaProxy.controller.ts Cache-Control headers from the same
// change. Deliberately NOT applied to wewatch.uz/app.wewatch.uz themselves — those are DNS-only
// (same-day fix for MARS_IT/Uzbekistan ISPs null-routing Cloudflare's 188.114.96.0/97.0 anycast
// pair) — routing video through a DIFFERENT Cloudflare-proxied hostname re-exposes that same
// blocked IP range for exactly this traffic, a deliberate, accepted tradeoff (bandwidth cost vs.
// video access for those specific ISPs), not an oversight.
export const vbStreamPublicUrl = process.env.VB_STREAM_PUBLIC_URL ?? watchPartyServiceUrl;

export const authServiceUrl =
  process.env.AUTH_SERVICE_URL ??
  (process.env.RAILWAY_SERVICE_AUTH_URL
    ? `https://${process.env.RAILWAY_SERVICE_AUTH_URL}`
    : 'http://localhost:3001');

export const adminServiceUrl =
  process.env.ADMIN_SERVICE_URL ??
  (process.env.RAILWAY_SERVICE_ADMIN_URL
    ? `https://${process.env.RAILWAY_SERVICE_ADMIN_URL}`
    : 'http://localhost:3008');
