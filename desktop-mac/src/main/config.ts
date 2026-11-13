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
// It is a public hostname, not a secret. The core service (main: services/core, #268) serves auth under /api/v1/auth
// (dispatch.ts) with the same Google routes; the old auth proxy (auth-production-47a8) is being shut down — Javod
// #34953, 2026-11-12. Switch to api.wewatch.uz once its DNS points at core.
const DEFAULT_AUTH_URL = 'https://core-production-dbd0.up.railway.app/api/v1/auth';
export const AUTH_URL = (devEnv('WW_AUTH_URL') || DEFAULT_AUTH_URL).replace(/\/+$/, '');
// DNS-over-HTTPS (dns.ts). The env overrides exist so the smoke test can prove the DoH path is really used.
export const DOH_URL = devEnv('WW_DOH_URL') || 'https://cloudflare-dns.com/dns-query';
export const DOH_MODE: 'automatic' | 'secure' = devEnv('WW_DOH_MODE') === 'secure' ? 'secure' : 'automatic';

/**
 * Dev/test only: run without ever showing a window, a Dock icon or taking focus, so automated checks (smokes, agents)
 * never jump in front of what the user is doing. On for every smoke run (WW_SMOKE_OUT) and with WW_BACKGROUND=1.
 */
export const BACKGROUND = devEnv('WW_BACKGROUND') === '1' || devEnv('WW_SMOKE_OUT') !== '';

/** Dev/smoke only: do not open the system browser (the smoke test has no human to click Google). */
export const AUTH_NO_BROWSER = devEnv('WW_AUTH_NO_BROWSER') === '1';
export const AUTH_POLL_MS = Number(devEnv('WW_AUTH_POLL_MS')) || 2000;
