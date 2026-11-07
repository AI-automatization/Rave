import { app } from 'electron';

// WW_* variables are for development only. The installed (packaged) app always opens production:
// a WW_APP_URL left in the user's environment once sent the Windows build to localhost:3000.
export const devEnv = (name: string): string => (app.isPackaged ? '' : process.env[name] ?? '');

export const APP_URL = devEnv('WW_APP_URL') || 'https://app.wewatch.uz';
export const APP_ORIGIN = new URL(APP_URL).origin;
/** Hosts the main window may show without leaving for the system browser. */
export const IN_APP_HOSTS: ReadonlySet<string> = new Set([new URL(APP_URL).hostname, 'wewatch.uz', 'www.wewatch.uz']);
export const PROTOCOL = 'wewatch';

// Auth service base for the Google sign-in poll flow (POST /google/init, GET /google/mobile, GET /google/poll).
// The web app keeps this server-side only (AUTH_SERVICE_URL), so the desktop app needs its own copy.
// It is a public hostname, not a secret. TODO: switch to api.wewatch.uz once it resolves (unreachable 2026-11-07);
// the old domains are kept alive by the core merge (#268), so this one keeps working meanwhile.
const DEFAULT_AUTH_URL = 'https://auth-production-47a8.up.railway.app/api/v1/auth';
export const AUTH_URL = (devEnv('WW_AUTH_URL') || DEFAULT_AUTH_URL).replace(/\/+$/, '');
/** Dev/smoke only: do not open the system browser (the smoke test has no human to click Google). */
export const AUTH_NO_BROWSER = devEnv('WW_AUTH_NO_BROWSER') === '1';
export const AUTH_POLL_MS = Number(devEnv('WW_AUTH_POLL_MS')) || 2000;
