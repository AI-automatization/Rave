import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { guidesFor } from '@/data/guides';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/en/guides';
const URL = `${APP_URL}${PATH}`;

export const metadata: Metadata = {
  title: 'WeWatch Guides — Watching Videos Together With Friends',
  description:
    'Guides on watching YouTube, films and series together with friends in sync. Works free on iPhone, Android and in the browser.',
  alternates: {
    canonical: URL,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'WeWatch Guides — Watching Together',
    description: 'Step-by-step guides to synchronized co-watching with friends.',
    url: URL,
  }),
  robots: { index: true, follow: true },
};

const guides = guidesFor('en');

// The visible list and the schema are built from one array, so they cannot drift.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${URL}#page`,
      url: URL,
      name: 'WeWatch Guides',
      description: 'Guides on synchronized co-watching with friends.',
      inLanguage: 'en',
      isPartOf: { '@id': `${APP_URL}/#website` },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: guides.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.title,
          url: `${APP_URL}${g.path}`,
        })),
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'WeWatch', item: `${APP_URL}/en` },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: URL },
      ],
    },
  ],
};

export default function EnGuidesHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="en" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
          <nav aria-label="Breadcrumb" className="text-zinc-600 text-xs mb-6">
            <Link href="/en" className="hover:text-zinc-400 transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-500">Guides</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">WeWatch guides</h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mb-10">
            How to watch YouTube, films and series together with your friends in sync — free, with
            no browser extension. One person hits pause and the video stops for everyone in the room.
          </p>

          <ul className="grid gap-4 sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.path}>
                <Link
                  href={g.path}
                  className="block h-full rounded-2xl border border-zinc-800/60 bg-[#0E0E14] px-6 py-5 hover:border-[#7B72F8]/40 transition-colors"
                >
                  <span className="block text-white font-semibold mb-1.5">{g.title}</span>
                  <span className="block text-zinc-500 text-sm leading-relaxed">{g.summary}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-4 text-sm">
            <Link href="/en/faq" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
              Frequently asked questions →
            </Link>
            <Link href="/guides" hrefLang="ru" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
              Russian guides →
            </Link>
            <Link href="/uz/guides" hrefLang="uz" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
              Uzbek guides →
            </Link>
          </div>
        </div>
      </main>
      <GuideFooter locale="en" />
    </>
  );
}
