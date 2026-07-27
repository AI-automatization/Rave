/**
 * The marketing site (wewatch.uz) and the app (app.wewatch.uz) are two separate deployments.
 * next.config.mjs 308-redirects /login, /register … to the app host, so a plain `<Link href="/login">`
 * still lands the user in the right place — but only after next/link has prefetched the route as if
 * it were local: that RSC request follows the redirect cross-origin, gets blocked by CORS, and logs
 * "No 'Access-Control-Allow-Origin' header" on every marketing page, plus a wasted round-trip on
 * every hover and a client-router fallback on click.
 *
 * Links to app routes therefore use the absolute URL through `appUrl()` on a plain <a>, which the
 * router leaves alone. Same env var next.config.mjs reads for its redirect targets, so both agree.
 */
export const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'https://app.wewatch.uz';

export const appUrl = (path: string): string => `${APP_ORIGIN}${path}`;
