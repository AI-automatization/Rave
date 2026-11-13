// Pure parts of the bundled web app (local-web.ts). No Electron imports — unit-tested.
//
// Why the web app is bundled: the packaged app used to load https://app.wewatch.uz from the internet, so whatever the
// team deployed there (an older build without the desktop features, 2026-11-13) was what the Mac app showed. Now the
// app ships its own build of apps/app-web and runs it locally; only the backend (API + socket) is reached over the net.
//
// How the address stays https://app.wewatch.uz (and why not 127.0.0.1): the backend's CORS lists are exact origins
// (media/watch-party `allowedOrigins.includes(origin)`), the auth cookies are Secure and bound to that host, and invite
// links must keep pointing there. So Chromium is told that app.wewatch.uz resolves to a local TLS port
// (`--host-resolver-rules`), and that port serves a certificate generated on this Mac that only this app's default
// session trusts (setCertificateVerifyProc). Cookies, redirects and CORS then work exactly as on the real site — an
// intercepting protocol handler was measured first and rejected: it drops cookies both ways, cancels redirects and
// skips CORS checks for every https response, which would let any framed site read /api/auth/token.

export const WEB_HOST = 'app.wewatch.uz';

/** Public production backend (the same hosts the mobile app uses; checked 2026-11-13, all /health 200). */
const CORE = 'https://core-production-dbd0.up.railway.app';
const MEDIA = 'https://media-production-97dd.up.railway.app';

/**
 * Runtime environment of the bundled Next.js server (its BFF routes call these; lib/service-urls.ts in apps/app-web).
 * NEXT_PUBLIC_* values are not here: Next inlines them at build time (scripts/build-web.sh).
 */
export function webServerEnv(internalPort: number): Record<string, string> {
  return {
    NODE_ENV: 'production',
    HOSTNAME: '127.0.0.1',
    PORT: String(internalPort),
    NEXT_TELEMETRY_DISABLED: '1',
    AUTH_SERVICE_URL: `${CORE}/api/v1/auth`,
    USER_SERVICE_URL: `${CORE}/api/v1`,
    NOTIFICATION_SERVICE_URL: `${CORE}/api/v1`,
    PAYMENT_SERVICE_URL: `${CORE}/api/v1`,
    ADMIN_SERVICE_URL: `${CORE}/api/v1`,
    CONTENT_SERVICE_URL: `${MEDIA}/api/v1`,
    WATCH_PARTY_SERVICE_URL: `${MEDIA}/api/v1`,
  };
}

/** Chromium switch value: send WEB_HOST to the local TLS port. Ports outside 1..65535 are a programming error. */
export function resolverRule(port: number): string {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`bad port ${port}`);
  return `MAP ${WEB_HOST} 127.0.0.1:${port}`;
}

/**
 * Electron reports a certificate as `sha256/<base64 of the DER's SHA-256>`; node:crypto gives `AA:BB:…` hex.
 * True only for the exact certificate this app generated.
 */
export function isOurCertificate(electronFingerprint: string, nodeFingerprint256: string): boolean {
  const hex = nodeFingerprint256.replace(/:/g, '');
  if (!/^[0-9A-Fa-f]{64}$/.test(hex)) return false;
  return electronFingerprint === `sha256/${Buffer.from(hex, 'hex').toString('base64')}`;
}

/** Regenerate when the certificate is missing, unreadable, or expires within `marginDays`. */
export function certNeedsRenewal(validTo: string | null, now: Date, marginDays = 30): boolean {
  if (!validTo) return true;
  const end = Date.parse(validTo);
  if (Number.isNaN(end)) return true;
  return end - now.getTime() < marginDays * 86_400_000;
}
