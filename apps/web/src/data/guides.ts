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
  /** Visible H1 and Article.headline; kept here so schema cannot drift from the page. */
  headline: string;
  /** Short link label — the anchor text crawlers read. */
  title: string;
  /** One line describing what the guide answers. */
  summary: string;
  /** One search intent this canonical URL owns; unique within its locale. */
  primaryIntent: string;
  /**
   * Further intents this URL owns on top of primaryIntent — declared so that
   * "one page owns one query" is enforced rather than remembered. Without this,
   * nothing stops a later guide from targeting a phrase an existing page was
   * extended for, which splits the weight instead of adding a position.
   * seo-geo-aeo.spec.ts asserts each phrase is unique inside its locale and
   * actually present in the page copy — a claim here with no matching text on
   * the page is a broken claim, not a plan.
   */
  secondaryIntents?: string[];
  locale: GuideLocale;
  /** Real last-edit date of the page source (YYYY-MM-DD), used for sitemap lastmod. */
  lastModified: string;
  /** First publication date (YYYY-MM-DD), used by the visible byline and Article schema. */
  datePublished: string;
  priority: number;
};

export const GUIDES: Guide[] = [
  // ── Русские гайды ──────────────────────────────────────────────────────────
  {
    path: '/ru/guides/smotret-vmeste-onlayn',
    headline: 'Смотреть вместе онлайн бесплатно',
    title: 'Смотреть вместе онлайн',
    summary: 'Как начать синхронный просмотр с друзьями — базовый гайд.',
    primaryIntent: 'смотреть вместе онлайн',
    secondaryIntents: ['смотреть видео вместе'],
    locale: 'ru',
    lastModified: '2026-08-13',
    datePublished: '2026-06-15',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-youtube-vmeste',
    headline: 'Смотреть YouTube вместе с другом онлайн',
    title: 'Смотреть YouTube вместе',
    summary: 'Совместный просмотр YouTube: один ставит паузу — пауза у всех.',
    primaryIntent: 'смотреть youtube вместе',
    locale: 'ru',
    lastModified: '2026-07-07',
    datePublished: '2026-06-15',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-anime-vmeste',
    headline: 'Смотреть аниме вместе с другом онлайн',
    title: 'Смотреть аниме вместе',
    summary: 'Синхронный просмотр аниме с другом через поддерживаемые источники.',
    primaryIntent: 'смотреть аниме вместе',
    locale: 'ru',
    lastModified: '2026-07-07',
    datePublished: '2026-06-15',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-serial-vmeste',
    headline: 'Смотреть сериал вместе с другом онлайн',
    title: 'Смотреть сериал вместе',
    summary: 'Как смотреть один сериал с другом по эпизодам и устраивать марафон.',
    primaryIntent: 'смотреть сериал с другом',
    locale: 'ru',
    lastModified: '2026-08-06',
    datePublished: '2026-06-15',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-serialy-vmeste-besplatno',
    headline: 'Сериальный клуб онлайн бесплатно',
    title: 'Сериалы вместе бесплатно',
    summary: 'Как бесплатно организовать групповой сериальный клуб онлайн.',
    primaryIntent: 'смотреть сериалы вместе бесплатно',
    locale: 'ru',
    lastModified: '2026-08-06',
    datePublished: '2026-07-02',
    priority: 0.9,
  },
  {
    path: '/ru/guides/kino-s-drugom-onlayn',
    headline: 'Смотреть кино с другом онлайн бесплатно',
    title: 'Кино с другом онлайн',
    summary: 'Смотреть фильм с другом онлайн бесплатно — расстояние не важно.',
    primaryIntent: 'смотреть кино с другом онлайн',
    secondaryIntents: ['смотреть кино вместе'],
    locale: 'ru',
    lastModified: '2026-08-13',
    datePublished: '2026-06-15',
    priority: 0.8,
  },
  {
    path: '/ru/guides/smotret-film-vdvoem',
    headline: 'Смотреть фильм вдвоём онлайн',
    title: 'Смотреть фильм вдвоём',
    summary: 'Фильм на двоих: синхронно на двух устройствах, на расстоянии.',
    primaryIntent: 'смотреть фильм вдвоём',
    locale: 'ru',
    lastModified: '2026-08-13',
    datePublished: '2026-07-02',
    priority: 0.9,
  },
  {
    path: '/ru/guides/smotret-vk-video-vmeste',
    headline: 'Смотреть VK Видео вместе с друзьями',
    title: 'Смотреть VK Видео вместе',
    summary: 'VK Видео синхронно в веб-браузерах; приложения iOS и Android разрабатываются.',
    primaryIntent: 'смотреть vk видео вместе',
    locale: 'ru',
    lastModified: '2026-07-03',
    datePublished: '2026-07-02',
    priority: 0.8,
  },
  {
    path: '/ru/guides/smotret-rutube-vmeste',
    headline: 'Смотреть Rutube вместе с друзьями',
    title: 'Смотреть Rutube вместе',
    summary: 'Rutube с друзьями — синхронный просмотр без расширений.',
    primaryIntent: 'смотреть rutube вместе',
    locale: 'ru',
    lastModified: '2026-07-03',
    datePublished: '2026-07-02',
    priority: 0.8,
  },
  {
    path: '/ru/guides/watch-party-besplatno',
    headline: 'Бесплатный Watch Party онлайн в 2026',
    title: 'Watch Party бесплатно',
    summary: 'Что такое watch party и как запустить его бесплатно.',
    primaryIntent: 'бесплатный watch party',
    locale: 'ru',
    lastModified: '2026-08-06',
    datePublished: '2026-06-15',
    priority: 0.8,
  },

  // ── O'zbekcha gaydlar ──────────────────────────────────────────────────────
  {
    path: '/uz/guides/birgalikda-tomosha-qilish',
    headline: 'Onlayn birgalikda tomosha qilish — bepul',
    title: 'Birgalikda tomosha qilish',
    summary: "Do'stlar bilan onlayn sinxron tomosha qilishni boshlash.",
    primaryIntent: 'birgalikda onlayn tomosha qilish',
    locale: 'uz',
    lastModified: '2026-07-07',
    datePublished: '2026-06-16',
    priority: 0.9,
  },
  {
    path: '/uz/guides/youtube-birgalikda',
    headline: "YouTube-ni do'st bilan onlayn birgalikda ko'rish",
    title: 'YouTube birgalikda',
    summary: "YouTube videolarini do'st bilan sinxron ko'rish.",
    primaryIntent: "youtube birgalikda ko'rish",
    locale: 'uz',
    lastModified: '2026-07-07',
    datePublished: '2026-06-16',
    priority: 0.9,
  },
  {
    path: '/uz/guides/anime-birgalikda',
    headline: "Anime do'stlar bilan birgalikda ko'rish",
    title: 'Anime birgalikda',
    summary: "Anime-ni do'stlar bilan bir vaqtda tomosha qilish.",
    primaryIntent: "anime birgalikda ko'rish",
    locale: 'uz',
    lastModified: '2026-07-07',
    datePublished: '2026-06-16',
    priority: 0.9,
  },
  {
    path: '/uz/guides/serial-birgalikda',
    headline: "Serial do'stlar bilan birgalikda ko'rish",
    title: 'Serial birgalikda',
    summary: "Seriallarni do'stlar bilan qism-qism sinxron ko'rish.",
    primaryIntent: "serial birgalikda ko'rish",
    locale: 'uz',
    lastModified: '2026-07-07',
    datePublished: '2026-06-16',
    priority: 0.9,
  },
  {
    path: '/uz/guides/kino-birgalikda',
    headline: "Do'stlar bilan onlayn kino ko'rish — bepul",
    title: 'Kino birgalikda',
    summary: "Do'st bilan onlayn kino ko'rish — biri telefonda, biri kompyuterda.",
    primaryIntent: "do'stlar bilan onlayn kino ko'rish",
    locale: 'uz',
    lastModified: '2026-07-07',
    datePublished: '2026-07-07',
    priority: 0.9,
  },

  // ── English guides ─────────────────────────────────────────────────────────
  // These replace the three English-slug pages that used to live under /guides
  // with Russian text inside them — duplicates that had to be noindex'd. The
  // old URLs now 301 here (next.config.mjs).
  {
    path: '/en/guides/watch-youtube-together',
    headline: 'How to watch YouTube together with a friend',
    title: 'Watch YouTube together',
    summary: 'Watch YouTube in sync with a friend — one pauses, everyone pauses.',
    primaryIntent: 'watch youtube together',
    locale: 'en',
    lastModified: '2026-07-25',
    datePublished: '2026-07-25',
    priority: 0.9,
  },
  {
    path: '/en/guides/what-is-watch-party',
    headline: 'What is a watch party?',
    title: 'What is a watch party',
    summary: 'What a watch party is, how synced playback works and how to start one.',
    primaryIntent: 'what is a watch party',
    locale: 'en',
    lastModified: '2026-07-25',
    datePublished: '2026-06-01',
    priority: 0.8,
  },
  {
    path: '/en/guides/watch-movies-with-friends',
    headline: 'Watch movies with friends online',
    title: 'Watch movies with friends',
    summary: 'Watch films and series together online in browsers on phones and desktops.',
    primaryIntent: 'watch movies with friends online',
    locale: 'en',
    lastModified: '2026-07-25',
    datePublished: '2026-06-01',
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
