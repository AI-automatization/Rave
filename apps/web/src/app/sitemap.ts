import type { MetadataRoute } from 'next';
import { TEAM } from './team/team-data';
import { GUIDES, GUIDE_PAIRS } from '@/data/guides';

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

/** Builds the hreflang set for a ru/uz guide pair (x-default points at the Russian page). */
const pair = (ru: string, uz: string) => ({
  ru: `${BASE}${ru}`,
  uz: `${BASE}${uz}`,
  'x-default': `${BASE}${ru}`,
});

/** Looks a guide up in GUIDE_PAIRS from either side; undefined when it has no counterpart. */
function guideLanguages(path: string) {
  const uz = GUIDE_PAIRS[path];
  if (uz) return pair(path, uz);
  const ru = Object.keys(GUIDE_PAIRS).find((k) => GUIDE_PAIRS[k] === path);
  return ru ? pair(ru, path) : undefined;
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
  // English-slug guides (/guides/what-is-watch-party, /watch-movies-with-friends,
  // /watch-youtube-together) are absent from the registry on purpose: they carry
  // robots.index=false and canonical → their Russian equivalents.
  { path: '/guides', lastModified: '2026-07-23', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/uz/guides', lastModified: '2026-07-23', changeFrequency: 'weekly', priority: 0.8 },

  // ── Продукт / компания ─────────────────────────────────────────────────────
  { path: '/features', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/how-it-works', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/pricing', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/products', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/company', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/tezcode', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.6 },

  // ── Use-cases ──────────────────────────────────────────────────────────────
  { path: '/use-cases/dalnie-otnosheniya', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/use-cases/svidanie-online', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.8 },

  // ── Сервисные / правовые ───────────────────────────────────────────────────
  { path: '/faq', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.6 },
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
