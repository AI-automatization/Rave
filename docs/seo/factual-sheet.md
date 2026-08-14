---
title: WeWatch public factual sheet
status: verified-local-source
verified_at: 2026-08-06
owner: Product + SEO
---

# WeWatch public factual sheet

This sheet is the publication contract for website copy, JSON-LD, FAQ, `llms.txt`, PR and AI-answer content. A statement may be made publicly only when it has an evidence source below. Unknown production state must remain unknown; repository presence alone is not proof that a store listing, checkout or external integration is live.

## Approved product facts

| Fact | Approved public wording | Evidence / source of truth | Do not claim |
|---|---|---|---|
| Web availability | “The WeWatch web version is available at wewatch.uz.” | `apps/web/src/data/product-facts.ts` → `platforms.web.status=available` | That a native app is required |
| iOS | “The native iOS app is in development.” | `product-facts.ts` → `platforms.ios.status=planned`; no verified store URL | “Available on the App Store”, “download the iOS app” |
| Android | “The native Android app is in development.” | `product-facts.ts` → `platforms.android.status=planned`; no verified store URL | “Available on Google Play”, “download the Android app” |
| Core price | “Core watch-party features are free.” | `product-facts.ts` → `coreWatchPartyIsFree=true` | “Everything is completely free” |
| Pro listing | “A Pro plan is listed at 29,000 UZS/month.” | `product-facts.ts` → `pro.status=listed`, `monthlyPriceUzs=29000` | “Checkout is live” until production purchase is owner-verified |
| Supported sources | “YouTube, VK Video, Rutube and direct MP4 links are supported.” | `product-facts.ts` → `supportedSources` | “Any video site”, unsupported streaming brands |
| Room capacity | “Up to 10 participants per room.” | `shared/src/constants/index.ts` → `LIMITS.MAX_WATCH_PARTY_MEMBERS=10` | A larger capacity without a code/config change |
| Inactive room timeout | “A room closes after 10 minutes without activity.” | `shared/src/constants/index.ts` → `TIMING.ROOM_INACTIVE_MINUTES=10` | That every room persists indefinitely |
| Drift correction | “Playback drift beyond 500 ms is corrected automatically.” | `TIMING.SYNC_DRIFT_WINDOW_MS=500`; player heartbeat correction | “Latency below 500 ms”, “zero lag”, “always under 500 ms” |
| Scheduling | “Playback commands are scheduled on a shared future server timestamp.” | `watchParty.service.ts` → `scheduledAt = now + SYNC_DRIFT_WINDOW_MS`; shared `SyncState` | That commands execute instantly or without network effects |
| Clock offset | “Each client estimates its server clock offset NTP-style over WebSocket ping/echo.” | `shared/src/constants/socketEvents.ts`; `videoEvents.handler.ts` | Formal NTP protocol compliance |

## Synchronization statement for citations

WeWatch schedules play, pause and seek commands against a shared future server timestamp. Each client estimates its clock offset from the server through a WebSocket ping/echo exchange, and a periodic heartbeat corrects playback drift beyond 500 ms. The 500 ms value is a correction threshold, not a latency guarantee. Buffering, ads, device performance and source-site restrictions can still affect playback.

Public localized versions of this statement are rendered from one component on:

- `/ru/how-it-works#synchronization-facts`
- `/uz/how-it-works#synchronization-facts`
- `/en/how-it-works#synchronization-facts`

The same component also exposes the verified 10-participant limit and 10-minute inactivity timeout from `product-facts.ts`.

## Structured-data contract

All 18 guides and 6 use-case articles are registered in `apps/web/src/data/articles.ts` and rendered by `ArticleMetadata.tsx`.

- exactly one `Article` and one `BreadcrumbList` per editorial URL;
- `Article.headline` equals the visible H1;
- visible author is WeWatch and schema author is the WeWatch Organization;
- `datePublished` and `dateModified` are visible and originate from the registry;
- canonical URL, `mainEntityOfPage`, image and stable organization `@id` are generated centrally;
- FAQ and HowTo facts must also exist in raw visible HTML.

## Change-control rule

1. Change the underlying product/configuration first.
2. Update `apps/web/src/data/product-facts.ts` and this sheet in the same change.
3. Update localized UI/FAQ/`llms.txt` only from the approved value.
4. Run the SEO Playwright regression suite before deployment.
5. Record owner confirmation and production verification for external states such as store listings and checkout.

## Open verification items

- Production Pro checkout availability: unverified.
- App Store listing: unavailable/unverified; do not publish a store URL.
- Google Play listing: unavailable/unverified; do not publish a store URL.
- Search Console, Bing Webmaster Tools and IndexNow production state: handled in a later deployment/monitoring stage.
