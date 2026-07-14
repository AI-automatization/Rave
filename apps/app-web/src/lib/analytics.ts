// WeWatch Web — click-event tracking via the GA4 tag already loaded in layout.tsx (gtag.js).
// id should be a stable, human-readable label (e.g. 'home:create_room'), not derived from
// dynamic content — mirrors the mobile app's analyticsService.click() convention.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackClick(id: string, meta?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'click', { click_id: id, ...meta });
}
