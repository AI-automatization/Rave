// Single registry of the indexable SEO guides.
//
// Internal links — not the sitemap — are what tells Google a page is worth
// crawling: a page reachable only from sitemap.xml tends to sit in "Discovered,
// currently not indexed" forever. Every guide is therefore listed here once and
// surfaced from the /guides hub, the footer and the related-guides block at the
// bottom of each guide.
//
// The three English-slug guides (/guides/what-is-watch-party,
// /watch-movies-with-friends, /watch-youtube-together) are deliberately absent:
// they carry robots.index=false and canonical → their Russian equivalents, so
// linking to them would leak crawl budget onto non-indexable URLs.

export type GuideLocale = 'ru' | 'uz';

export type Guide = {
  path: string;
  /** Short link label — the anchor text crawlers read. */
  title: string;
  /** One line describing what the guide answers. */
  summary: string;
  locale: GuideLocale;
  /** Real last-edit date of the page source (YYYY-MM-DD), used for sitemap lastmod. */
  lastModified: string;
  priority: number;
};

export const GUIDES: Guide[] = [
  // ── Русские гайды ──────────────────────────────────────────────────────────
  {
    path: '/guides/smotret-vmeste-onlayn',
    title: 'Смотреть вместе онлайн',
    summary: 'Как начать синхронный просмотр с друзьями — базовый гайд.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/guides/smotret-youtube-vmeste',
    title: 'Смотреть YouTube вместе',
    summary: 'Совместный просмотр YouTube: один ставит паузу — пауза у всех.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/guides/smotret-anime-vmeste',
    title: 'Смотреть аниме вместе',
    summary: 'Синхронный просмотр аниме с другом на любом сайте.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/guides/smotret-serial-vmeste',
    title: 'Смотреть сериал вместе',
    summary: 'Как смотреть сериалы с друзьями по эпизоду, синхронно.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/guides/smotret-serialy-vmeste-besplatno',
    title: 'Сериалы вместе бесплатно',
    summary: 'Бесплатный совместный просмотр сериалов на всех платформах.',
    locale: 'ru',
    lastModified: '2026-07-03',
    priority: 0.9,
  },
  {
    path: '/guides/kino-s-drugom-onlayn',
    title: 'Кино с другом онлайн',
    summary: 'Смотреть фильм с другом онлайн бесплатно — расстояние не важно.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.8,
  },
  {
    path: '/guides/smotret-film-vdvoem',
    title: 'Смотреть фильм вдвоём',
    summary: 'Фильм на двоих: синхронно на двух устройствах, на расстоянии.',
    locale: 'ru',
    lastModified: '2026-07-03',
    priority: 0.9,
  },
  {
    path: '/guides/smotret-vk-video-vmeste',
    title: 'Смотреть VK Видео вместе',
    summary: 'VK Видео синхронно между iPhone, Android и вебом.',
    locale: 'ru',
    lastModified: '2026-07-03',
    priority: 0.8,
  },
  {
    path: '/guides/smotret-rutube-vmeste',
    title: 'Смотреть Rutube вместе',
    summary: 'Rutube с друзьями — синхронный просмотр без расширений.',
    locale: 'ru',
    lastModified: '2026-07-03',
    priority: 0.8,
  },
  {
    path: '/guides/watch-party-besplatno',
    title: 'Watch Party бесплатно',
    summary: 'Что такое watch party и как запустить его бесплатно.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.8,
  },

  // ── O'zbekcha gaydlar ──────────────────────────────────────────────────────
  {
    path: '/uz/guides/birgalikda-tomosha-qilish',
    title: 'Birgalikda tomosha qilish',
    summary: "Do'stlar bilan onlayn sinxron tomosha qilishni boshlash.",
    locale: 'uz',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/uz/guides/youtube-birgalikda',
    title: 'YouTube birgalikda',
    summary: "YouTube videolarini do'st bilan sinxron ko'rish.",
    locale: 'uz',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/uz/guides/anime-birgalikda',
    title: 'Anime birgalikda',
    summary: "Anime-ni do'stlar bilan bir vaqtda tomosha qilish.",
    locale: 'uz',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/uz/guides/serial-birgalikda',
    title: 'Serial birgalikda',
    summary: "Seriallarni do'stlar bilan qism-qism sinxron ko'rish.",
    locale: 'uz',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/uz/guides/kino-birgalikda',
    title: 'Kino birgalikda',
    summary: "Do'st bilan onlayn kino ko'rish — biri telefonda, biri kompyuterda.",
    locale: 'uz',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
];

/** ru↔uz counterparts, mirroring each page's own `alternates.languages`. */
export const GUIDE_PAIRS: Record<string, string> = {
  '/guides/smotret-vmeste-onlayn': '/uz/guides/birgalikda-tomosha-qilish',
  '/guides/smotret-youtube-vmeste': '/uz/guides/youtube-birgalikda',
  '/guides/smotret-anime-vmeste': '/uz/guides/anime-birgalikda',
  '/guides/smotret-serial-vmeste': '/uz/guides/serial-birgalikda',
  '/guides/kino-s-drugom-onlayn': '/uz/guides/kino-birgalikda',
};

export const guidesFor = (locale: GuideLocale): Guide[] =>
  GUIDES.filter((g) => g.locale === locale);

/** Guides to link from the bottom of `currentPath`, same language, excluding itself. */
export const relatedGuides = (currentPath: string, locale: GuideLocale, limit = 4): Guide[] =>
  guidesFor(locale)
    .filter((g) => g.path !== currentPath)
    .slice(0, limit);
