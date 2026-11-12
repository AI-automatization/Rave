/**
 * The marketing site and the application are one deployment on one host (wewatch.uz): the
 * landing lives under /uz /ru /en, the app under /home, /room, /login … The app routes sit in a
 * different root layout, so a link from a marketing page to them must be a full document
 * navigation — a plain `<a>` with a relative URL, not next/link (whose client-side transition
 * cannot cross root layouts). `appUrl()` returns that relative URL.
 *
 * NEXT_PUBLIC_APP_DOMAIN stays as an optional override (e.g. a staging host); empty means same origin.
 */
export const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';

export const appUrl = (path: string): string => `${APP_ORIGIN}${path}`;
