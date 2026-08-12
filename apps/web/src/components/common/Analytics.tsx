'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { APP_ORIGIN } from '@/lib/app-url';
import { trackCtaClick, trackOrganicLandingView } from '@/lib/analytics/events';

/**
 * Mounts the marketing site's measurement-plan instrumentation.
 *
 * CTA clicks are caught by one delegated listener instead of an `onClick` on each
 * button. There are 18 links to the app across 15 files and most of them live in
 * server components (`app/ru/how-it-works/page.tsx`, the guide pages, …); adding a
 * handler to each would turn those pages into client components and ship their
 * markup as JavaScript. The Lighthouse budget gate enforces TBT <= 1500 ms against
 * a page that has measured 2809 ms, so that trade is not available. Delegation also
 * covers CTAs added later without anyone remembering to instrument them.
 *
 * Only left-clicks are counted. Middle-click and ctrl-click open a background tab
 * and are rare enough on a CTA that catching them is not worth a second listener.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    trackOrganicLandingView(pathname);
    // Acquisition is a property of the visit, not of the page: re-running this on
    // every client-side navigation is exactly what the session guard inside
    // trackOrganicLandingView exists to prevent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      // Only links that leave for the app are calls to action; internal
      // navigation between marketing pages is not.
      if (!anchor.href.startsWith(APP_ORIGIN)) return;

      // gtag.js's cross-domain linker decorates matching anchors' href with its own
      // `?_gl=...` tracking param asynchronously after mount — by the time a real
      // click fires, `anchor.href` can already carry it. destination is meant to be
      // the app-side route, not a snapshot of whatever the linker glued on, so query
      // string and hash are stripped before recording it.
      const destination = anchor.href.slice(APP_ORIGIN.length).split(/[?#]/)[0] || '/';
      const ctaId = anchor.dataset.cta ?? `${areaOf(anchor)}:${destination}`;

      trackCtaClick(pathname, ctaId, destination);
    };

    document.addEventListener('click', onClick, { passive: true });
    return () => document.removeEventListener('click', onClick);
  }, [pathname]);

  return null;
}

/**
 * Where on the page the CTA sits. Enough to tell the header button apart from the
 * one in the body without labelling all 18 links by hand; a link that needs a
 * sharper id can carry `data-cta`.
 */
function areaOf(anchor: HTMLAnchorElement): string {
  if (anchor.closest('nav')) return 'nav';
  if (anchor.closest('footer')) return 'footer';
  return 'body';
}
