import type { MetadataRoute } from 'next';
import { TEAM } from './team/team-data';

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

  // ── Русские гайды ──────────────────────────────────────────────────────────
  {
    path: '/guides/smotret-vmeste-onlayn',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.9,
    languages: pair('/guides/smotret-vmeste-onlayn', '/uz/guides/birgalikda-tomosha-qilish'),
  },
  {
    path: '/guides/smotret-youtube-vmeste',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.9,
    languages: pair('/guides/smotret-youtube-vmeste', '/uz/guides/youtube-birgalikda'),
  },
  {
    path: '/guides/smotret-anime-vmeste',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.9,
    languages: pair('/guides/smotret-anime-vmeste', '/uz/guides/anime-birgalikda'),
  },
  {
    path: '/guides/smotret-serial-vmeste',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.9,
    languages: pair('/guides/smotret-serial-vmeste', '/uz/guides/serial-birgalikda'),
  },
  {
    path: '/guides/kino-s-drugom-onlayn',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.8,
    languages: pair('/guides/kino-s-drugom-onlayn', '/uz/guides/kino-birgalikda'),
  },
  { path: '/guides/watch-party-besplatno', lastModified: '2026-07-07', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/guides/smotret-film-vdvoem', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/guides/smotret-serialy-vmeste-besplatno', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/guides/smotret-vk-video-vmeste', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/guides/smotret-rutube-vmeste', lastModified: '2026-07-03', changeFrequency: 'monthly', priority: 0.8 },
  // English-slug guides (/guides/what-is-watch-party, /watch-movies-with-friends,
  // /watch-youtube-together) are intentionally excluded: they carry robots.index=false
  // and canonical → their Russian equivalents.

  // ── Узбекские гайды ────────────────────────────────────────────────────────
  {
    path: '/uz/guides/birgalikda-tomosha-qilish',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.9,
    languages: pair('/guides/smotret-vmeste-onlayn', '/uz/guides/birgalikda-tomosha-qilish'),
  },
  {
    path: '/uz/guides/youtube-birgalikda',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.9,
    languages: pair('/guides/smotret-youtube-vmeste', '/uz/guides/youtube-birgalikda'),
  },
  {
    path: '/uz/guides/anime-birgalikda',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.9,
    languages: pair('/guides/smotret-anime-vmeste', '/uz/guides/anime-birgalikda'),
  },
  {
    path: '/uz/guides/serial-birgalikda',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.9,
    languages: pair('/guides/smotret-serial-vmeste', '/uz/guides/serial-birgalikda'),
  },
  {
    path: '/uz/guides/kino-birgalikda',
    lastModified: '2026-07-07',
    changeFrequency: 'monthly',
    priority: 0.9,
    languages: pair('/guides/kino-s-drugom-onlayn', '/uz/guides/kino-birgalikda'),
  },

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
