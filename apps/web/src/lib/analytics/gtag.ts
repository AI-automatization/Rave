/**
 * Transport for the measurement-plan events (docs/seo/measurement-plan.md §Event contract).
 *
 * The one thing this file exists for: gtag.js is loaded with `strategy="lazyOnload"`
 * (RootDocument.tsx), so `window.gtag` does not exist until after the window `load`
 * event — well after React has mounted and fired the first landing view. A direct
 * `window.gtag?.(...)` therefore drops exactly the events that matter most: the ones
 * describing how the visitor arrived. That is not a hypothetical — `trackClick` in
 * apps/app-web returns early on a missing `window.gtag` and loses the same class of
 * event silently.
 *
 * Pushing straight to `window.dataLayer` does not fix it either: gtag.js replays the
 * queue in order, and anything sitting before the `gtag('config', …)` call has no
 * destination to be attributed to.
 *
 * So events are buffered here and flushed once gtag.js is genuinely up. The loader
 * strategy stays `lazyOnload`: the Lighthouse budget gate (apps/web/scripts/check-
 * lighthouse-budget.mjs) enforces TBT <= 1500 ms and production has measured 2809 ms —
 * moving analytics earlier in the boot is not affordable.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Bounded so a blocked gtag.js (ad blockers are common in RU, our largest
 * impression market) leaks a fixed amount of memory instead of a growing one.
 */
const MAX_QUEUED = 50;
const POLL_MS = 300;
const MAX_POLLS = 40; // ~12s after load; past that gtag.js is blocked, not slow.

const queue: Array<{ name: string; params: EventParams }> = [];
let polling = false;
let polls = 0;

function gtagReady(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/** Drops `undefined` values so GA4 does not record empty custom dimensions. */
function clean(params: EventParams): EventParams {
  const out: EventParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function flush(): void {
  if (!gtagReady()) return;
  while (queue.length > 0) {
    const event = queue.shift();
    if (event) window.gtag?.('event', event.name, event.params);
  }
}

function startPolling(): void {
  if (polling || typeof window === 'undefined') return;
  polling = true;

  const tick = () => {
    polls += 1;
    if (gtagReady()) {
      flush();
      polling = false;
      return;
    }
    if (polls >= MAX_POLLS) {
      polling = false;
      queue.length = 0;
      return;
    }
    window.setTimeout(tick, POLL_MS);
  };

  // gtag.js only starts downloading at `load`, so there is nothing to wait for
  // before it — polling earlier would just burn ticks against the TBT budget.
  if (document.readyState === 'complete') {
    window.setTimeout(tick, POLL_MS);
  } else {
    window.addEventListener('load', () => window.setTimeout(tick, POLL_MS), { once: true });
  }
}

/**
 * Sends a GA4 event, buffering it until gtag.js is ready.
 *
 * Never throws and never blocks: analytics failing must not take a page down with it.
 */
export function sendEvent(name: string, params: EventParams): void {
  if (typeof window === 'undefined') return;

  const event = { name, params: clean(params) };

  if (gtagReady()) {
    window.gtag?.('event', event.name, event.params);
    return;
  }

  if (queue.length < MAX_QUEUED) queue.push(event);
  startPolling();
}
