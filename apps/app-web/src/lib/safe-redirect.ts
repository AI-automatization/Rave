/**
 * `?redirect=` comes from the URL, so anyone can put anything there. Only same-site paths pass:
 * `//evil.com` and `/\evil.com` are both read by browsers as another host.
 */
export function safeRedirect(raw: string | null | undefined, fallback = '/home'): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) return raw;
  return fallback;
}

/** `path` with the redirect carried along, so login ↔ register ↔ verify keep the room link. */
export function withRedirect(path: string, raw: string | null | undefined): string {
  const redirect = safeRedirect(raw, '');
  return redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;
}
