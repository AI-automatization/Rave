# WeWatch SEO/GEO/AEO measurement plan

Date: 2026-08-07  
Owner: Growth + Engineering  
Review cadence: weekly operations, 30/60/90-day outcome reviews

## Purpose

This plan separates deploy validation, search visibility, page experience and business outcomes. A code change is not called successful until the production URL is crawlable and the relevant search or conversion metric is observed.

## Measurement layers

| Layer | Source | Metrics | Cadence | Decision owner |
|---|---|---|---|---|
| Release integrity | CI + production crawler | build, SEO tests, crawler visibility, Lighthouse budget | every PR/deploy | Engineering |
| Indexing | Google Search Console, Bing Webmaster Tools, Yandex Webmaster | discovered/indexed URLs, exclusions, sitemap errors, enhancements | weekly | SEO owner |
| Search demand | Search Console/Webmaster exports | impressions, clicks, CTR, average position | weekly and 30/60/90 | SEO owner |
| Page experience | CrUX/Search Console CWV and analytics RUM | p75 LCP, INP, CLS by locale/template | weekly after data exists | Engineering |
| Outcomes | Analytics/backend | organic registration, waitlist conversion, assisted conversion | weekly/monthly | Growth |
| GEO discovery | Analytics referral + manual cited-answer sample | assistant referrals, cited/uncited factual answers | monthly | SEO owner |

## Required dimensions

Every export or dashboard should retain:

- locale: RU, UZ, EN;
- page type: home, guide, use case, product/company;
- query class: branded vs non-branded;
- device and country;
- landing page/content cluster;
- conversion type.

## Core targets

The CI thresholds are regression guards. Production success uses field data:

| Metric | Target |
|---|---:|
| p75 LCP | <= 2.5 s |
| p75 INP | <= 200 ms |
| p75 CLS | <= 0.1 |
| Sitemap errors | 0 |
| Broken canonical/hreflang/schema gates | 0 |
| Raw HTML crawler failures | 0 |

No synthetic INP value is reported. CrUX/RUM needs enough real-user samples; until then the status is `insufficient field data`, not zero.

## Event contract

The analytics implementation should preserve these events and parameters:

| Event | Required parameters |
|---|---|
| `organic_landing_view` | `locale`, `page_type`, `content_slug`, `referrer_class` |
| `cta_click` | `locale`, `page_type`, `cta_id`, `destination` |
| `waitlist_submit` | `locale`, `page_type`, `content_slug`, `result` |
| `registration_start` | `locale`, `page_type`, `source_cluster` |
| `registration_complete` | `locale`, `source_cluster` |
| `room_created` | `locale`, `source_cluster` |

Do not send email addresses, names, room codes or free-form chat content to analytics.

## Baseline procedure

1. Record deploy commit SHA and UTC timestamp.
2. Run production crawler and verify sitemap/robots/canonical/hreflang.
3. Export indexed pages and search performance for the previous 28 days.
4. Save RU/UZ/EN landing-page and query exports separately.
5. Record CrUX CWV if available; otherwise mark insufficient data.
6. Save organic registrations and waitlist conversions for the same window.
7. Repeat at 30, 60 and 90 days without changing metric definitions.

## Alert rules

- Immediate: production crawler, sitemap, canonical, noindex or structured-data regression.
- Within one business day: indexed-page loss above 10% for a locale directory.
- Weekly review: CWV p75 outside target, non-brand impressions declining two consecutive weeks, or conversion tracking gaps.
- Investigation only, not automatic rollback: normal rank/traffic volatility without a technical regression.
