/**
 * Turns a pathname into the page dimensions every measurement-plan event carries:
 * `locale`, `page_type`, `content_slug` and `source_cluster`
 * (docs/seo/measurement-plan.md §Event contract).
 *
 * Derived from the URL and nothing else, on purpose — the same rule the locale
 * routing follows (src/lib/i18n/config.ts): two visitors opening one link must be
 * counted as the same page, whatever their history or device says.
 *
 * `source_cluster` is keyed on the guide's own slug rather than on a path prefix,
 * because guide slugs are translated, not prefixed: /ru/guides/smotret-youtube-vmeste
 * and /uz/guides/youtube-birgalikda are one topic under two names. Grouping by
 * prefix would report them as two clusters and make the RU/UZ comparison
 * meaningless. CLUSTER_BY_SLUG is verified against the guide registry by
 * scripts/check-analytics-clusters.mjs, so adding a guide without a cluster fails
 * loudly instead of silently landing in `other`.
 */

// Relative, not the `@/` alias the app uses elsewhere: apps/web/tests run under the
// Playwright runner, which resolves neither tsconfig paths nor the Next bundler's
// aliases, and these helpers are asserted directly from seo-geo-aeo.spec.ts.
import { localeFromPath, stripLocale, DEFAULT_LOCALE, type Locale } from '../i18n/config';

export type PageType =
  | 'home'
  | 'guides_hub'
  | 'guide'
  | 'use_case'
  | 'faq'
  | 'how_it_works'
  | 'features'
  | 'pricing'
  | 'products'
  | 'company'
  | 'contact'
  | 'about'
  | 'team'
  | 'tezcode'
  | 'legal'
  | 'other';

export type PageContext = {
  locale: Locale;
  page_type: PageType;
  content_slug: string;
  source_cluster: string;
};

/** Last URL segment of every guide, mapped to the topic it competes for. */
const CLUSTER_BY_SLUG: Record<string, string> = {
  // Watch-together, no specific platform or content type.
  'smotret-vmeste-onlayn': 'watch_together',
  'birgalikda-tomosha-qilish': 'watch_together',
  'watch-party-besplatno': 'watch_together',
  'what-is-watch-party': 'watch_together',
  // YouTube — the cluster carrying the most RU impressions in the 2026-08-10 baseline.
  'smotret-youtube-vmeste': 'youtube',
  'youtube-birgalikda': 'youtube',
  'watch-youtube-together': 'youtube',
  // Films.
  'kino-s-drugom-onlayn': 'movie',
  'smotret-film-vdvoem': 'movie',
  'kino-birgalikda': 'movie',
  'kino-ikkovlashib': 'movie',
  'watch-movies-with-friends': 'movie',
  // Series.
  'smotret-serial-vmeste': 'series',
  'smotret-serialy-vmeste-besplatno': 'series',
  'serial-birgalikda': 'series',
  // Anime.
  'smotret-anime-vmeste': 'anime',
  'anime-birgalikda': 'anime',
  // Platform-specific.
  'smotret-vk-video-vmeste': 'vk',
  'smotret-rutube-vmeste': 'rutube',
  // Use cases.
  'dalnie-otnosheniya': 'long_distance',
  'masofadagi-juftlik': 'long_distance',
  'long-distance': 'long_distance',
  'svidanie-online': 'online_date',
  'onlayn-uchrashuv': 'online_date',
  'online-date': 'online_date',
};

const STATIC_PAGE_TYPES: Record<string, PageType> = {
  '/': 'home',
  '/guides': 'guides_hub',
  '/faq': 'faq',
  '/how-it-works': 'how_it_works',
  '/features': 'features',
  '/pricing': 'pricing',
  '/products': 'products',
  '/company': 'company',
  '/contact': 'contact',
  '/about': 'about',
  '/tezcode': 'tezcode',
  '/terms': 'legal',
  '/privacy-policy': 'legal',
  '/dmca': 'legal',
  '/delete-account': 'legal',
};

function normalize(pathname: string): string {
  const path = pathname.split('?')[0].split('#')[0];
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

function pageTypeFor(barePath: string): PageType {
  const known = STATIC_PAGE_TYPES[barePath];
  if (known) return known;

  if (barePath.startsWith('/guides/')) return 'guide';
  if (barePath.startsWith('/use-cases/')) return 'use_case';
  if (barePath === '/team' || barePath.startsWith('/team/')) return 'team';

  return 'other';
}

/**
 * Stable identifier of the content on the page. Guides, use cases and team pages
 * are identified by their own slug; everything else by its locale-free path, so
 * one page is one value in the report regardless of the language it was read in.
 */
function contentSlugFor(barePath: string, pageType: PageType): string {
  if (barePath === '/') return 'home';
  if (pageType === 'guide' || pageType === 'use_case' || pageType === 'team') {
    const last = barePath.split('/').filter(Boolean).pop();
    if (last) return last;
  }
  return barePath.replace(/^\//, '');
}

/** Topic bucket a visit is attributed to. Non-content pages are their own cluster. */
function sourceClusterFor(contentSlug: string, pageType: PageType): string {
  const cluster = CLUSTER_BY_SLUG[contentSlug];
  if (cluster) return cluster;
  if (pageType === 'home') return 'home';
  if (pageType === 'guide' || pageType === 'use_case') return 'other';
  return pageType;
}

export function pageContextFor(pathname: string): PageContext {
  const path = normalize(pathname);
  const bare = stripLocale(path);
  const pageType = pageTypeFor(bare);
  const contentSlug = contentSlugFor(bare, pageType);

  return {
    locale: localeFromPath(path) ?? DEFAULT_LOCALE,
    page_type: pageType,
    content_slug: contentSlug,
    source_cluster: sourceClusterFor(contentSlug, pageType),
  };
}

/** Exported for the registry check in scripts/check-analytics-clusters.mjs. */
export const CLUSTERED_SLUGS = Object.keys(CLUSTER_BY_SLUG);
