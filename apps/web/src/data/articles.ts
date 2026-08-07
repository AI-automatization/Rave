import { GUIDES, type GuideLocale } from './guides';

export type ArticleRecord = {
  path: string;
  headline: string;
  locale: GuideLocale;
  section: 'guides' | 'use-cases';
  datePublished: string;
  dateModified: string;
};

const USE_CASES: ArticleRecord[] = [
  {
    path: '/ru/use-cases/dalnie-otnosheniya',
    headline: 'Смотреть фильмы вместе, когда вы далеко',
    locale: 'ru',
    section: 'use-cases',
    datePublished: '2026-07-02',
    dateModified: '2026-07-02',
  },
  {
    path: '/ru/use-cases/svidanie-online',
    headline: 'Свидание онлайн: киновечер вдвоём',
    locale: 'ru',
    section: 'use-cases',
    datePublished: '2026-07-02',
    dateModified: '2026-07-02',
  },
  {
    path: '/uz/use-cases/masofadagi-juftlik',
    headline: "Uzoqda bo'lsangiz ham kinoni birga ko'ringiz",
    locale: 'uz',
    section: 'use-cases',
    datePublished: '2026-07-28',
    dateModified: '2026-07-28',
  },
  {
    path: '/uz/use-cases/onlayn-uchrashuv',
    headline: 'Onlayn uchrashuv: ikki kishilik kino kechasi',
    locale: 'uz',
    section: 'use-cases',
    datePublished: '2026-07-28',
    dateModified: '2026-07-28',
  },
  {
    path: '/en/use-cases/long-distance',
    headline: 'Watch a film together when you are far apart',
    locale: 'en',
    section: 'use-cases',
    datePublished: '2026-07-28',
    dateModified: '2026-07-28',
  },
  {
    path: '/en/use-cases/online-date',
    headline: 'Online date: a movie night for two',
    locale: 'en',
    section: 'use-cases',
    datePublished: '2026-07-28',
    dateModified: '2026-07-28',
  },
];

export const ARTICLES: ArticleRecord[] = [
  ...GUIDES.map((guide) => ({
    path: guide.path,
    headline: guide.headline,
    locale: guide.locale,
    section: 'guides' as const,
    datePublished: guide.datePublished,
    dateModified: guide.lastModified,
  })),
  ...USE_CASES,
];

export function articleFor(path: string): ArticleRecord | undefined {
  return ARTICLES.find((article) => article.path === path);
}
