// Single registry of the indexable SEO guides.
//
// Internal links — not the sitemap — are what tells Google a page is worth
// crawling: a page reachable only from sitemap.xml tends to sit in "Discovered,
// currently not indexed" forever. Every guide is therefore listed here once and
// surfaced from the /guides hub, the footer and the related-guides block at the
// bottom of each guide.
//
// Three pages used to sit under /guides with English slugs but Russian text —
// duplicates of the Russian guides, kept noindex for that reason. They have been
// rewritten as real English guides under /en/guides and are listed here like any
// other; the old /guides/<english-slug> URLs 301 to them (next.config.mjs).

export type GuideLocale = 'ru' | 'uz' | 'en';

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
    path: '/ru/guides/smotret-vmeste-onlayn',
    title: 'Смотреть вместе онлайн',
    summary: 'Как начать синхронный просмотр с друзьями — базовый гайд.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-youtube-vmeste',
    title: 'Смотреть YouTube вместе',
    summary: 'Совместный просмотр YouTube: один ставит паузу — пауза у всех.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-anime-vmeste',
    title: 'Смотреть аниме вместе',
    summary: 'Синхронный просмотр аниме с другом на любом сайте.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-serial-vmeste',
    title: 'Смотреть сериал вместе',
    summary: 'Как смотреть сериалы с друзьями по эпизоду, синхронно.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-serialy-vmeste-besplatno',
    title: 'Сериалы вместе бесплатно',
    summary: 'Бесплатный совместный просмотр сериалов на всех платформах.',
    locale: 'ru',
    lastModified: '2026-07-03',
    priority: 0.9,
  },
  {
    path: '/ru/guides/kino-s-drugom-onlayn',
    title: 'Кино с другом онлайн',
    summary: 'Смотреть фильм с другом онлайн бесплатно — расстояние не важно.',
    locale: 'ru',
    lastModified: '2026-07-07',
    priority: 0.8,
  },
  {
    path: '/ru/guides/smotret-film-vdvoem',
    title: 'Смотреть фильм вдвоём',
    summary: 'Фильм на двоих: синхронно на двух устройствах, на расстоянии.',
    locale: 'ru',
    lastModified: '2026-07-03',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-vk-video-vmeste',
    title: 'Смотреть VK Видео вместе',
    summary: 'VK Видео синхронно между iPhone, Android и вебом.',
    locale: 'ru',
    lastModified: '2026-07-03',
    priority: 0.8,
  },
  {
    path: '/ru/guides/smotret-rutube-vmeste',
    title: 'Смотреть Rutube вместе',
    summary: 'Rutube с друзьями — синхронный просмотр без расширений.',
    locale: 'ru',
    lastModified: '2026-07-03',
    priority: 0.8,
  },
  {
    path: '/ru/guides/watch-party-besplatno',
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

  // ── English guides ─────────────────────────────────────────────────────────
  // These replace the three English-slug pages that used to live under /guides
  // with Russian text inside them — duplicates that had to be noindex'd. The
  // old URLs now 301 here (next.config.mjs).
  {
    path: '/en/guides/watch-youtube-together',
    title: 'Watch YouTube together',
    summary: 'Watch YouTube in sync with a friend — one pauses, everyone pauses.',
    locale: 'en',
    lastModified: '2026-07-25',
    priority: 0.9,
  },
  {
    path: '/en/guides/what-is-watch-party',
    title: 'What is a watch party',
    summary: 'What a watch party is, how synced playback works and how to start one.',
    locale: 'en',
    lastModified: '2026-07-25',
    priority: 0.8,
  },
  {
    path: '/en/guides/watch-movies-with-friends',
    title: 'Watch movies with friends',
    summary: 'Watch films and series together online, free, from any device.',
    locale: 'en',
    lastModified: '2026-07-25',
    priority: 0.9,
  },
];

/**
 * Guides that are the same article in different languages. Slugs are translated
 * per locale (SEO: the URL is shown in search results and its matching part is
 * bolded), so counterparts cannot be derived by swapping a prefix.
 */
export const GUIDE_GROUPS: { ru: string; uz?: string; en?: string }[] = [
  { ru: '/ru/guides/smotret-vmeste-onlayn', uz: '/uz/guides/birgalikda-tomosha-qilish' },
  { ru: '/ru/guides/smotret-youtube-vmeste', uz: '/uz/guides/youtube-birgalikda', en: '/en/guides/watch-youtube-together' },
  { ru: '/ru/guides/smotret-anime-vmeste', uz: '/uz/guides/anime-birgalikda' },
  { ru: '/ru/guides/smotret-serial-vmeste', uz: '/uz/guides/serial-birgalikda' },
  { ru: '/ru/guides/kino-s-drugom-onlayn', uz: '/uz/guides/kino-birgalikda', en: '/en/guides/watch-movies-with-friends' },
  { ru: '/ru/guides/watch-party-besplatno', en: '/en/guides/what-is-watch-party' },
];

/** ru↔uz counterparts. Derived from GUIDE_GROUPS — kept for existing callers. */
export const GUIDE_PAIRS: Record<string, string> = Object.fromEntries(
  GUIDE_GROUPS.filter((g) => g.uz).map((g) => [g.ru, g.uz!])
);

/** Every locale variant of the guide `path` belongs to, keyed by locale. */
export function guideGroupFor(path: string): { ru: string; uz?: string; en?: string } | undefined {
  return GUIDE_GROUPS.find((g) => g.ru === path || g.uz === path || g.en === path);
}

export const guidesFor = (locale: GuideLocale): Guide[] =>
  GUIDES.filter((g) => g.locale === locale);

/** Guides to link from the bottom of `currentPath`, same language, excluding itself. */
export const relatedGuides = (currentPath: string, locale: GuideLocale, limit = 4): Guide[] =>
  guidesFor(locale)
    .filter((g) => g.path !== currentPath)
    .slice(0, limit);
