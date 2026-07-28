import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/en/use-cases/long-distance';

export const metadata: Metadata = {
  title: 'Watch Movies Together Long Distance — WeWatch for Couples Apart',
  description:
    'Partner far away? Watch films and series together online, in sync, as if you were in the same room. WeWatch is a long-distance date night for couples in different cities and countries.',
  keywords: [
    'watch movies together long distance', 'long distance relationship movie night',
    'watch a movie with boyfriend long distance', 'watch with girlfriend long distance',
    'long distance date ideas', 'watch party for couples',
    'watch netflix together long distance', 'sync movie with partner',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'Watch Together Long Distance — WeWatch',
    description: 'A date night for couples apart: films and series in sync, as if you were side by side.',
    url: `${APP_URL}${PATH}`,
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Watch movies together long distance',
  description: 'How couples apart watch films and series together online through WeWatch.',
  author: { '@type': 'Organization', name: 'WeWatch', url: APP_URL },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: APP_URL },
  datePublished: '2026-07-28',
  inLanguage: 'en',
  mainEntityOfPage: `${APP_URL}${PATH}`,
};

const STEPS = [
  { n: 1, title: 'Agree on the film first', desc: 'Pick a film or a series together — on YouTube, VK Video or Rutube.' },
  { n: 2, title: 'Create a room', desc: 'One of you creates a room in WeWatch and sends the link to the other.' },
  { n: 3, title: 'Watch in sync', desc: 'Playback runs simultaneously. A pause to talk stops it for both of you. Reactions go in the chat.' },
];

const FAQS = [
  { q: 'Does it work between different countries?', a: 'Yes. Synchronization does not depend on distance — only on having an internet connection.' },
  { q: 'Do we need the same phone?', a: 'No. One of you can be on iPhone, the other on Android or in a browser.' },
  { q: 'Is it free?', a: 'Yes, WeWatch is free.' },
];

export default function LongDistancePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="en" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 mb-8">
            <Link href="/en" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Long distance</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Watch a film together when you are far apart
          </h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Different cities or different countries — neither has to end your evenings together.
            WeWatch keeps the film in sync on both your phones: you press pause, and it pauses for
            your partner too. As if you were on the same sofa.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">A date, not a text thread</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Long-distance relationships live on shared moments. Instead of “what are you watching?”
              in a chat window — put one film on for the two of you. WeWatch holds the frame in sync,
              and the built-in chat and emoji let you react as it happens.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">How to set up a long-distance movie night</h2>
            <ol className="space-y-5">
              {STEPS.map(({ n, title, desc }) => (
                <li key={n} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#7B72F8] flex items-center justify-center text-sm font-bold">{n}</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Why WeWatch and not “press play on three”</h2>
            <p className="text-zinc-400 leading-relaxed">
              Counting down “three, two, one” falls apart at the first pause. WeWatch holds the
              timeline automatically: seeking, buffering, different connection speeds — all of it gets
              evened out. Works between iPhone and Android at the same time.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Questions</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Set up your evening together today</h2>
            <p className="text-zinc-400 mb-6">Distance does not matter — WeWatch is free</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={appUrl('/register')} className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                Start free
              </a>
              <Link href="/en/use-cases/online-date" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">
                Online date →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="en" />
    </>
  );
}
