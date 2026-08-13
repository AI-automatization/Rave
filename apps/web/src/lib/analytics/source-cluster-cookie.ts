/**
 * `ww_src_cluster` — the first-touch SEO cluster a visitor arrived through, carried
 * on `.wewatch.uz` so apps/app-web (a different subdomain) can read it and attach
 * `source_cluster` to `registration_start`/`registration_complete`/`room_created`
 * (docs/seo/measurement-plan.md §Event contract).
 *
 * First-touch, not last-touch, by design (Yakubov, 2026-08-13): if someone reads a
 * film guide, then later leaves from a YouTube guide, the film guide earned the
 * registration, not whichever page they happened to click the CTA from. So this
 * only ever sets the cookie once — an existing value is never overwritten — and it
 * is set on every landing view (not just the CTA click) so the value is already in
 * place regardless of which page the visitor eventually leaves from.
 *
 * Reuses `pageContextFor`'s `source_cluster` rather than recomputing it — the two
 * must never drift, or the cookie and the GA4 event for the same visit would
 * disagree about which cluster gets the credit.
 */

const COOKIE_NAME = 'ww_src_cluster';
const COOKIE_TTL_DAYS = 30;

export function ensureSourceClusterCookie(sourceCluster: string): void {
  if (typeof document === 'undefined') return;
  if (readSourceClusterCookie() !== null) return;

  const maxAge = COOKIE_TTL_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(sourceCluster)}; Domain=.wewatch.uz; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
}

/** Exported for apps/app-web to read the same cookie client-side, and for tests. */
export function readSourceClusterCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )ww_src_cluster=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
