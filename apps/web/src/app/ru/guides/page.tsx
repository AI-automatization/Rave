import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { guidesFor } from '@/data/guides';

const URL = 'https://wewatch.uz/ru/guides';

export const metadata: Metadata = {
  title: 'Гайды WeWatch — как смотреть видео вместе с друзьями',
  description:
    'Все гайды WeWatch: как смотреть YouTube, VK Видео, Rutube, фильмы, сериалы и аниме вместе с друзьями онлайн — синхронно и бесплатно, на iPhone, Android и в браузере.',
  alternates: {
    canonical: URL,
    languages: {
      ru: URL,
      uz: 'https://wewatch.uz/uz/guides',
      'x-default': URL,
    },
  },
  openGraph: {
    title: 'Гайды WeWatch — совместный просмотр видео',
    description: 'Пошаговые гайды по синхронному просмотру видео с друзьями.',
    url: URL,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const guides = guidesFor('ru');

// Both the visible list and the schema are built from the same array, so the
// structured data never claims something the page does not show.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${URL}#page`,
      url: URL,
      name: 'Гайды WeWatch',
      description: 'Гайды по совместному синхронному просмотру видео с друзьями.',
      inLanguage: 'ru',
      isPartOf: { '@id': 'https://wewatch.uz/#website' },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: guides.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.title,
          url: `https://wewatch.uz${g.path}`,
        })),
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'WeWatch', item: 'https://wewatch.uz' },
        { '@type': 'ListItem', position: 2, name: 'Гайды', item: URL },
      ],
    },
  ],
};

export default function GuidesHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="ru" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="relative overflow-hidden border-b border-zinc-800/50">
          <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[120px]" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-14">
            <nav aria-label="Хлебные крошки" className="text-zinc-600 text-xs mb-6">
              <Link href="/ru" className="hover:text-zinc-400 transition-colors">WeWatch</Link>
              <span className="mx-2">/</span>
              <span className="text-zinc-500">Гайды</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Гайды WeWatch</h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
              Как смотреть YouTube, VK Видео, Rutube, фильмы, сериалы и аниме вместе с друзьями —
              синхронно, бесплатно и без расширений для браузера. Один участник ставит паузу — видео
              останавливается у всех в комнате.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
          <ul className="grid gap-4 sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.path}>
                <Link
                  href={g.path}
                  className="group flex h-full flex-col rounded-2xl border border-zinc-800/60 bg-[#0E0E14] px-6 py-5 hover:border-[#7B72F8]/40 hover:bg-[#111118] transition-colors"
                >
                  <span className="block text-white font-semibold mb-1.5 group-hover:text-[#9B92FF] transition-colors">{g.title}</span>
                  <span className="block text-zinc-500 text-sm leading-relaxed">{g.summary}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-4 text-sm">
            <Link href="/ru/how-it-works" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
              Как работает WeWatch →
            </Link>
            <Link href="/ru/faq" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
              Частые вопросы →
            </Link>
            <Link href="/uz/guides" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
              O&apos;zbekcha gaydlar →
            </Link>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" />
    </>
  );
}
