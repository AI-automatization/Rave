import type { MetadataRoute } from 'next';
import { TEAM } from './team/team-data';
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

const ENTRIES: Entry[] = [
  // ── Главные страницы (ru default, /uz, /en) ─────────────────────────────────
  {
    path: '/',
    lastModified: '2026-07-07',
    changeFrequency: 'weekly',
    priority: 1.0,
    languages: { ru: BASE, uz: `${BASE}/uz`, en: `${BASE}/en`, 'x-default': BASE },
  },
  {
    path: '/uz',
    lastModified: '2026-07-07',
    changeFrequency: 'weekly',
    priority: 0.9,
    languages: { ru: BASE, uz: `${BASE}/uz`, en: `${BASE}/en`, 'x-default': BASE },
  },
  {
    path: '/en',
    lastModified: '2026-07-07',
    changeFrequency: 'weekly',
    priority: 0.7,
    languages: { ru: BASE, uz: `${BASE}/uz`, en: `${BASE}/en`, 'x-default': BASE },
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
    path: '/guides',
    lastModified: '2026-07-25',
    changeFrequency: 'weekly',
    priority: 0.8,
    languages: { ru: `${BASE}/guides`, uz: `${BASE}/uz/guides`, en: `${BASE}/en/guides`, 'x-default': `${BASE}/guides` },
  },
  {
    path: '/uz/guides',
    lastModified: '2026-07-25',
    changeFrequency: 'weekly',
    priority: 0.8,
    languages: { ru: `${BASE}/guides`, uz: `${BASE}/uz/guides`, en: `${BASE}/en/guides`, 'x-default': `${BASE}/guides` },
  },
  {
    path: '/en/guides',
    lastModified: '2026-07-25',
    changeFrequency: 'weekly',
    priority: 0.7,
    languages: { ru: `${BASE}/guides`, uz: `${BASE}/uz/guides`, en: `${BASE}/en/guides`, 'x-default': `${BASE}/guides` },
  },

  // ── Продукт / компания ─────────────────────────────────────────────────────
  { path: '/features', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.8 },
  {
    path: '/how-it-works',
    lastModified: '2026-07-25',
    changeFrequency: 'monthly',
    priority: 0.8,
    languages: hreflangFor('/how-it-works', BASE),
  },
  { path: '/pricing', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/products', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/company', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/tezcode', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.6 },

  // ── Use-cases ──────────────────────────────────────────────────────────────
  // Узбекские и английские версии добавлены в T-S189; hreflang читается из
  // реестра USE_CASE_GROUPS, поэтому здесь достаточно перечислить пути.
  { path: '/use-cases/dalnie-otnosheniya', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8, languages: hreflangFor('/use-cases/dalnie-otnosheniya', BASE) },
  { path: '/use-cases/svidanie-online', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8, languages: hreflangFor('/use-cases/svidanie-online', BASE) },
  { path: '/uz/use-cases/masofadagi-juftlik', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.7, languages: hreflangFor('/uz/use-cases/masofadagi-juftlik', BASE) },
  { path: '/uz/use-cases/onlayn-uchrashuv', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.7, languages: hreflangFor('/uz/use-cases/onlayn-uchrashuv', BASE) },
  { path: '/en/use-cases/long-distance', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.7, languages: hreflangFor('/en/use-cases/long-distance', BASE) },
  { path: '/en/use-cases/online-date', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.7, languages: hreflangFor('/en/use-cases/online-date', BASE) },

  // ── Сервисные / правовые ───────────────────────────────────────────────────
  {
    path: '/faq',
    lastModified: '2026-07-25',
    changeFrequency: 'monthly',
    priority: 0.6,
    languages: hreflangFor('/faq', BASE),
  },
  {
    path: '/en/faq',
    lastModified: '2026-07-25',
    changeFrequency: 'monthly',
    priority: 0.5,
    languages: hreflangFor('/faq', BASE),
  },
  {
    path: '/en/how-it-works',
    lastModified: '2026-07-25',
    changeFrequency: 'monthly',
    priority: 0.6,
    languages: hreflangFor('/how-it-works', BASE),
  },
  // Узбекские версии — T-S189. До них узбекский футер и шапка гайдов вели на
  // русские /faq и /how-it-works.
  {
    path: '/uz/faq',
    lastModified: '2026-07-28',
    changeFrequency: 'monthly',
    priority: 0.5,
    languages: hreflangFor('/faq', BASE),
  },
  {
    path: '/uz/how-it-works',
    lastModified: '2026-07-28',
    changeFrequency: 'monthly',
    priority: 0.6,
    languages: hreflangFor('/how-it-works', BASE),
  },
  { path: '/about', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy-policy', lastModified: '2026-07-07', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/delete-account', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/terms', lastModified: '2026-07-07', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/dmca', lastModified: '2026-07-07', changeFrequency: 'yearly', priority: 0.2 },

  // ── Команда ────────────────────────────────────────────────────────────────
  { path: '/team', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.6 },
  ...TEAM.map((m) => ({
    path: `/team/${m.slug}`,
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
