/**
 * The three measurement-plan events that belong to the marketing site
 * (docs/seo/measurement-plan.md §Event contract). `registration_start`,
 * `registration_complete` and `room_created` fire in apps/app-web and are not
 * defined here.
 *
 * Event names and parameter names are the contract — they are what the reports
 * are built on, so they are written out literally rather than composed, and the
 * types below stop a caller from inventing a fourth spelling of the same idea.
 *
 * No email addresses, names, room codes or free-form text is passed to any of
 * these functions; the contract forbids sending them to analytics.
 */

import { sendEvent } from './gtag';
import { pageContextFor } from './page-context';
import { classifyReferrer } from './referrer';

/** One landing view per browser tab session — see `trackOrganicLandingView`. */
const LANDING_VIEW_KEY = 'ww_landing_view_sent';

export type WaitlistResult = 'success' | 'error';

/**
 * Entry into the site, with the class of source that produced it.
 *
 * Fires once per tab session, on the page the visitor actually arrived at. Firing
 * on every page would turn a question about acquisition ("which cluster brings
 * people in") into a page-view count, which GA4 already reports and which the
 * measurement plan does not ask for.
 *
 * Same-site navigations are skipped: a hop from wewatch.uz to app.wewatch.uz is
 * one visit to one product, not a second acquisition.
 */
export function trackOrganicLandingView(pathname: string): void {
  if (typeof window === 'undefined') return;

  const referrerClass = classifyReferrer(document.referrer, window.location.hostname);
  if (referrerClass === 'internal') return;

  try {
    if (window.sessionStorage.getItem(LANDING_VIEW_KEY)) return;
    window.sessionStorage.setItem(LANDING_VIEW_KEY, '1');
  } catch {
    // Private mode or a storage-blocking extension: send the event rather than
    // lose it. A duplicate view is a smaller error than a missing one.
  }

  const context = pageContextFor(pathname);
  sendEvent('organic_landing_view', {
    locale: context.locale,
    page_type: context.page_type,
    content_slug: context.content_slug,
    referrer_class: referrerClass,
  });
}

/**
 * Click on a call to action that leaves the marketing site for the app.
 *
 * @param ctaId Stable id of the button, not its visible label — labels are
 *   translated three ways and would split one button into three rows.
 * @param destination Path on the app host (`/register`), without the origin.
 */
export function trackCtaClick(pathname: string, ctaId: string, destination: string): void {
  const context = pageContextFor(pathname);
  sendEvent('cta_click', {
    locale: context.locale,
    page_type: context.page_type,
    cta_id: ctaId,
    destination,
  });
}

/**
 * Waitlist or campaign form submission.
 *
 * `result` is the real outcome of the request. The previous implementation sent
 * its event after a `catch` that swallowed the failure, so a submission that
 * never reached the API was reported as a signup.
 */
export function trackWaitlistSubmit(
  pathname: string,
  contentSlug: string,
  result: WaitlistResult,
): void {
  const context = pageContextFor(pathname);
  sendEvent('waitlist_submit', {
    locale: context.locale,
    page_type: context.page_type,
    content_slug: contentSlug,
    result,
  });
}
