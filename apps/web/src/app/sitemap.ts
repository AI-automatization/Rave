import type { MetadataRoute } from 'next';
import { TEAM } from './team/team-data';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export default function sitemap(): MetadataRoute.Sitemap {
  const teamPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/team`, lastModified: new Date('2026-07-02'), changeFrequency: 'monthly', priority: 0.6 },
    ...TEAM.map((m) => ({
      url: `${BASE}/team/${m.slug}`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
  return [
    ...teamPages,
    // ── Главная ────────────────────────────────────────────────────────────────
    {
      url: BASE,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },

    // ── Русские гайды (CНГ-приоритет) ────────────────────────────────────────
    {
      url: `${BASE}/guides/smotret-vmeste-onlayn`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/guides/smotret-youtube-vmeste`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/guides/smotret-anime-vmeste`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/guides/smotret-serial-vmeste`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/guides/kino-s-drugom-onlayn`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/watch-party-besplatno`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // ── Узбекские гайды (/uz/) ────────────────────────────────────────────────
    {
      url: `${BASE}/uz/guides/birgalikda-tomosha-qilish`,
      lastModified: new Date('2026-06-16'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/uz/guides/youtube-birgalikda`,
      lastModified: new Date('2026-06-16'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/uz/guides/anime-birgalikda`,
      lastModified: new Date('2026-06-16'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/uz/guides/serial-birgalikda`,
      lastModified: new Date('2026-06-16'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // ── Сервисные страницы ────────────────────────────────────────────────────
    {
      url: `${BASE}/faq`,
      lastModified: new Date('2026-06-15'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/about`,
      lastModified: new Date('2026-06-11'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE}/privacy-policy`,
      lastModified: new Date('2026-06-11'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE}/delete-account`,
      lastModified: new Date('2026-06-12'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date('2026-06-11'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE}/dmca`,
      lastModified: new Date('2026-06-11'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },

    // ── Маркетинговые страницы ────────────────────────────────────────────────
    {
      url: `${BASE}/features`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/how-it-works`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/pricing`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // ── Компания ──────────────────────────────────────────────────────────────
    {
      url: `${BASE}/tezcode`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // ── Use-cases ─────────────────────────────────────────────────────────────
    {
      url: `${BASE}/use-cases/dalnie-otnosheniya`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/use-cases/svidanie-online`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // ── Новые гайды (платформы + сценарии) ────────────────────────────────────
    {
      url: `${BASE}/guides/smotret-film-vdvoem`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/guides/smotret-serialy-vmeste-besplatno`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/guides/smotret-vk-video-vmeste`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/smotret-rutube-vmeste`,
      lastModified: new Date('2026-07-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // English-slug guides excluded (noindex set, canonical → Russian equivalents)
  ];
}
