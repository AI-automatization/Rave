import type { MetadataRoute } from 'next';
import { TEAM } from './ru/team/team-data';
import { GUIDES } from '@/data/guides';
import { hreflangFor } from '@/lib/i18n/routes';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

type Entry = {
  path: string;
  /** Real last-edit date of the page source, not build time — otherwise lastmod is noise. */
  lastModified: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
  /** Locale counterparts, taken from the page's own `alternates.languages`. */
  languages?: Record<string, string>;
};

/**
 * hreflang set for a guide, from the same helper the pages themselves use — so
 * the sitemap and each page's `alternates.languages` cannot disagree. Returns
 * undefined for a guide with no counterpart in another language.
 */
function guideLanguages(path: string) {
  const languages = hreflangFor(path, BASE);
  // A lone guide resolves to itself + x-default, which is noise in the sitemap.
  return Object.keys(languages).length > 2 ? languages : undefined;
}

/**
 * Marketing pages that exist at `/x`, `/uz/x` and `/en/x`. Listed once here and
 * expanded into three sitemap entries below, so adding a language version cannot
 * be half-done — the page, the hreflang and the sitemap all read the same list
 * (this one and TRANSLATED_ROUTES in lib/i18n/routes.ts).
 */
const LANDING_PAGES: readonly { path: string; priority: number }[] = [
  { path: '/ru/features', priority: 0.8 },
  { path: '/ru/pricing', priority: 0.7 },
  { path: '/ru/products', priority: 0.5 },
  { path: '/ru/company', priority: 0.5 },
  { path: '/ru/contact', priority: 0.4 },
  { path: '/ru/about', priority: 0.5 },
];

const LANDING_LASTMOD = '2026-07-28';

const ENTRIES: Entry[] = [
  // ── Главные страницы: по одной на язык, все с префиксом ─────────────────────
  // Голого `/` здесь нет намеренно: он 301 на /ru (next.config.mjs), а sitemap
  // должен содержать конечные URL, а не редиректы. hreflang берётся из того же
  // helper'а, что и на самих страницах, — расходиться они не могут.
  {
    path: '/ru',
    lastModified: LANDING_LASTMOD,
    changeFrequency: 'weekly',
    priority: 1.0,
    languages: hreflangFor('/', BASE),
  },
  {
    path: '/uz',
    lastModified: LANDING_LASTMOD,
    changeFrequency: 'weekly',
    priority: 0.9,
    languages: hreflangFor('/', BASE),
  },
  {
    path: '/en',
    lastModified: LANDING_LASTMOD,
    changeFrequency: 'weekly',
    priority: 0.7,
    languages: hreflangFor('/', BASE),
  },

  // ── Гайды (реестр: src/data/guides.ts — новый гайд добавляется только там) ──
  ...GUIDES.map((g) => ({
    path: g.path,
    lastModified: g.lastModified,
    changeFrequency: 'monthly' as const,
    priority: g.priority,
    ...(guideLanguages(g.path) ? { languages: guideLanguages(g.path)! } : {}),
  })),
  // The three English guides come from the registry above like every other guide.
  // Their old /guides/<english-slug> URLs 301 to /en/guides/* and are therefore
  // deliberately not listed — a sitemap must contain final URLs, not redirects.
  {
    path: '/ru/guides',
    lastModified: '2026-07-25',
    changeFrequency: 'weekly',
    priority: 0.8,
    languages: { ru: `${BASE}/ru/guides`, uz: `${BASE}/uz/guides`, en: `${BASE}/en/guides`, 'x-default': `${BASE}/ru/guides` },
  },
  {
    path: '/uz/guides',
    lastModified: '2026-07-25',
    changeFrequency: 'weekly',
    priority: 0.8,
    languages: { ru: `${BASE}/ru/guides`, uz: `${BASE}/uz/guides`, en: `${BASE}/en/guides`, 'x-default': `${BASE}/ru/guides` },
  },
  {
    path: '/en/guides',
    lastModified: '2026-07-25',
    changeFrequency: 'weekly',
    priority: 0.7,
    languages: { ru: `${BASE}/ru/guides`, uz: `${BASE}/uz/guides`, en: `${BASE}/en/guides`, 'x-default': `${BASE}/ru/guides` },
  },

  // ── Продукт / компания ─────────────────────────────────────────────────────
  // Каждая из этих страниц теперь существует на трёх языках под собственным URL
  // (T-S190). До этого /uz и /en версий не было вовсе: страница переводилась на
  // лету из клиентского стора на одном URL, поэтому узбекская и английская
  // версии были непошарибельны и невидимы для краулера.
  {
    path: '/ru/how-it-works',
    lastModified: '2026-07-25',
    changeFrequency: 'monthly',
    priority: 0.8,
    languages: hreflangFor('/ru/how-it-works', BASE),
  },
  ...LANDING_PAGES.flatMap(({ path, priority }) => [
    { path, lastModified: LANDING_LASTMOD, changeFrequency: 'monthly' as const, priority, languages: hreflangFor(path, BASE) },
    { path: `/uz${path}`, lastModified: LANDING_LASTMOD, changeFrequency: 'monthly' as const, priority: priority - 0.1, languages: hreflangFor(path, BASE) },
    { path: `/en${path}`, lastModified: LANDING_LASTMOD, changeFrequency: 'monthly' as const, priority: priority - 0.1, languages: hreflangFor(path, BASE) },
  ]),
  { path: '/ru/tezcode', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.6 },

  // ── Use-cases ──────────────────────────────────────────────────────────────
  // Узбекские и английские версии добавлены в T-S189; hreflang читается из
  // реестра USE_CASE_GROUPS, поэтому здесь достаточно перечислить пути.
  { path: '/ru/use-cases/dalnie-otnosheniya', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8, languages: hreflangFor('/ru/use-cases/dalnie-otnosheniya', BASE) },
  { path: '/ru/use-cases/svidanie-online', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8, languages: hreflangFor('/ru/use-cases/svidanie-online', BASE) },
  { path: '/uz/use-cases/masofadagi-juftlik', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.7, languages: hreflangFor('/uz/use-cases/masofadagi-juftlik', BASE) },
  { path: '/uz/use-cases/onlayn-uchrashuv', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.7, languages: hreflangFor('/uz/use-cases/onlayn-uchrashuv', BASE) },
  { path: '/en/use-cases/long-distance', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.7, languages: hreflangFor('/en/use-cases/long-distance', BASE) },
  { path: '/en/use-cases/online-date', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.7, languages: hreflangFor('/en/use-cases/online-date', BASE) },

  // ── Сервисные / правовые ───────────────────────────────────────────────────
  {
    path: '/ru/faq',
    lastModified: '2026-07-25',
    changeFrequency: 'monthly',
    priority: 0.6,
    languages: hreflangFor('/ru/faq', BASE),
  },
  {
    path: '/en/faq',
    lastModified: '2026-07-25',
    changeFrequency: 'monthly',
    priority: 0.5,
    languages: hreflangFor('/ru/faq', BASE),
  },
  {
    path: '/en/how-it-works',
    lastModified: '2026-07-25',
    changeFrequency: 'monthly',
    priority: 0.6,
    languages: hreflangFor('/ru/how-it-works', BASE),
  },
  // Узбекские версии — T-S189. До них узбекский футер и шапка гайдов вели на
  // русские /faq и /how-it-works.
  {
    path: '/uz/faq',
    lastModified: '2026-07-28',
    changeFrequency: 'monthly',
    priority: 0.5,
    languages: hreflangFor('/ru/faq', BASE),
  },
  {
    path: '/uz/how-it-works',
    lastModified: '2026-07-28',
    changeFrequency: 'monthly',
    priority: 0.6,
    languages: hreflangFor('/ru/how-it-works', BASE),
  },
  // /about — см. LANDING_PAGES выше (три языка одной записью).
  { path: '/privacy-policy', lastModified: '2026-07-07', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/delete-account', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/terms', lastModified: '2026-07-07', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/dmca', lastModified: '2026-07-07', changeFrequency: 'yearly', priority: 0.2 },

  // ── Команда ────────────────────────────────────────────────────────────────
  { path: '/ru/team', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.6 },
  ...TEAM.map((m) => ({
    path: `/ru/team/${m.slug}`,
    lastModified: '2026-07-03',
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ENTRIES.map(({ path, lastModified, changeFrequency, priority, languages }) => ({
    url: path === '/' ? BASE : `${BASE}${path}`,
    lastModified: new Date(lastModified),
    changeFrequency,
    priority,
    ...(languages ? { alternates: { languages } } : {}),
  }));
}

/** Absolute URLs of every indexable page — reused by the IndexNow submitter. */
export function sitemapUrls(): string[] {
  return sitemap().map((entry) => String(entry.url));
}
