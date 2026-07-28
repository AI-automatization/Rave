import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/en/use-cases/online-date';

export const metadata: Metadata = {
  title: 'Online Date: A Movie Night for Two — WeWatch',
  description:
    'Not sure what to do on an online date? Put one film on for the two of you. WeWatch keeps playback in sync, and chat and emoji stand in for sitting side by side.',
  keywords: [
    'online date ideas', 'virtual date night', 'movie night for two online',
    'what to do on an online date', 'watch a movie together on a date',
    'virtual movie date', 'romantic night online',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Online Date: A Movie Night for Two',
    description: 'WeWatch keeps playback in sync — chat and emoji give it the feel of a real date.',
    url: `${APP_URL}${PATH}`,
    locale: 'en_US',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Online date: a movie night for two',
  description: 'How to set up a romantic online date by watching a film together in WeWatch.',
  author: { '@type': 'Organization', name: 'WeWatch', url: APP_URL },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: APP_URL },
  datePublished: '2026-07-28',
  inLanguage: 'en',
  mainEntityOfPage: `${APP_URL}${PATH}`,
};

const IDEAS = [
  { t: 'Romantic comedy', d: 'The first-date classic — an easy film and reactions in the chat.' },
  { t: 'A series, episode by episode', d: 'Start a series together and watch one episode every evening.' },
  { t: 'Horror', d: 'Getting scared together is a shortcut to closeness. A pause at the scary part stops it for both of you.' },
  { t: 'Nostalgia', d: 'Put on a film from your childhood and swap memories in the chat.' },
];

export default function OnlineDatePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="en" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 mb-8">
            <Link href="/en" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Online date</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Online date: a movie night for two
          </h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Not sure what to do on an online date? Put one film on for the two of you. WeWatch keeps
            playback in sync, and the chat and emoji stand in for sitting side by side — it feels like
            a real date rather than a call.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Ideas for a movie date online</h2>
            <ul className="space-y-4">
              {IDEAS.map(({ t, d }) => (
                <li key={t} className="border border-zinc-800 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-1">{t}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{d}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Setting it up in a minute</h2>
            <p className="text-zinc-400 leading-relaxed">
              Install WeWatch, open the film in the app&apos;s browser, create a room and send the link.
              Your partner taps it — and you are watching in sync. Works between iPhone, Android and a
              desktop computer.
            </p>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Set up your date today</h2>
            <p className="text-zinc-400 mb-6">WeWatch is free — start in under a minute</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={appUrl('/register')} className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                Start free
              </a>
              <Link href="/en/use-cases/long-distance" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">
                Long distance →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="en" />
    </>
  );
}
