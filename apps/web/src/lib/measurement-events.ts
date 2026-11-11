// WeWatch App-Web — the 3 measurement-plan events that belong here, not to apps/web
// (docs/seo/measurement-plan.md §Event contract): registration_start,
// registration_complete, room_created. apps/web's equivalent lives in
// apps/web/src/lib/analytics/events.ts — the two apps are separate deployables with
// no shared package between them, so the pattern is mirrored rather than imported.
//
// No email addresses, names, room codes or free-form text is passed to any of these —
// same contract-wide rule apps/web's version documents.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Reads the `ww_src_cluster` cookie apps/web sets on `.wewatch.uz` on first landing
 * (see apps/web/src/lib/analytics/source-cluster-cookie.ts — same name, same domain,
 * intentionally not re-derived here: this side only ever reads, apps/web is the only
 * writer, so there's one source of truth for "what attracted this visitor" per visit).
 * A visitor who opened app.wewatch.uz directly (no wewatch.uz landing first) has no
 * cookie — 'direct' keeps that a valid, distinct value rather than a missing field.
 */
function sourceCluster(): string {
  if (typeof document === 'undefined') return 'direct';
  const match = document.cookie.match(/(?:^|; )ww_src_cluster=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : 'direct';
}

function send(event: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event, params);
}

export function trackRegistrationStart(locale: string): void {
  send('registration_start', { locale, page_type: 'register', source_cluster: sourceCluster() });
}

export function trackRegistrationComplete(locale: string): void {
  send('registration_complete', { locale, source_cluster: sourceCluster() });
}

export function trackRoomCreated(locale: string): void {
  send('room_created', { locale, source_cluster: sourceCluster() });
}
