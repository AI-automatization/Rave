import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';
import { SynchronizationFacts } from '@/components/common/SynchronizationFacts';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/en/how-it-works';

export const metadata: Metadata = {
  title: 'How WeWatch Works — Watch Videos Together in 4 Steps',
  description:
    'How to watch videos together with friends using the WeWatch web version: open a video, create a room and share the link. Native iOS and Android apps are in development.',
  keywords: [
    'how does watch party work', 'how to watch videos together', 'how to create a watch room',
    'watch movies with friends online how', 'wewatch how to use', 'synced watching explained',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'How WeWatch Works',
    description: 'Watching together in 4 steps — synchronized across every device.',
    url: `${APP_URL}${PATH}`,
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const steps = [
  {
    n: 1,
    title: 'Get WeWatch',
    desc: 'Open wewatch.uz in any browser. Native iOS and Android apps are in development.',
  },
  {
    n: 2,
    title: 'Open any video',
    desc: 'Paste a YouTube, VK Video, Rutube or direct MP4 link in the web version.',
  },
  {
    n: 3,
    title: 'Create a room',
    desc: 'Press “Create room” and WeWatch gives you an invite link. Send it to your friends in any messenger.',
  },
  {
    n: 4,
    title: 'Watch in sync',
    desc: 'Your friend taps the link and playback synchronizes. Pause, seek and playback speed apply to everyone at once.',
  },
];

// 500 ms is the drift-correction threshold from shared/src/constants — the real
// number, not a marketing one.
const howToLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to watch videos together with WeWatch',
  description: 'Step-by-step instructions for watching videos online together with friends.',
  inLanguage: 'en',
  totalTime: 'PT1M',
  url: `${APP_URL}${PATH}`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${APP_URL}${PATH}` },
  step: steps.map((s) => ({ '@type': 'HowToStep', position: s.n, name: s.title, text: s.desc })),
};

const FAQS = [
  { q: 'Is it free?', a: 'Core watch-party features are free. A separate Pro plan is listed for additional features.' },
  { q: 'Does a guest need an account?', a: 'The person creating the room signs up; guests join through the invite link without an account.' },
  { q: 'What does it run on?', a: 'The web version currently works in browsers on phones and computers. Native iOS and Android apps are in development.' },
  { q: 'Which sites are supported?', a: 'YouTube, VK Video, Rutube, direct .mp4 links, and others through the built-in mobile browser.' },
];

export default function EnHowItWorksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <GuideHeader locale="en" />
      <main className="min-h-screen bg-[#060608] text-white">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-zinc-800/50">
          <div aria-hidden className="pointer-events-none absolute -top-40 right-0 h-80 w-[36rem] rounded-full bg-[#7B72F8]/20 blur-[120px]" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-14">
            <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 mb-6">
              <Link href="/en" className="hover:text-white transition-colors">WeWatch</Link>
              <span className="mx-2">/</span>
              <span>How it works</span>
            </nav>
            <span className="inline-flex items-center rounded-full border border-[#7B72F8]/30 bg-[#7B72F8]/10 px-3 py-1 text-xs font-semibold text-[#9B92FF] mb-5">
              4 steps · under a minute
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight tracking-tight">How WeWatch works</h1>
            <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
              Watching videos with friends, in four steps. One person pauses — everyone pauses.
              The web version works in browsers on iPhone, Android and desktop; native mobile apps are in development.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <section className="mb-14">
            <ol className="relative space-y-4 before:absolute before:left-5 before:top-6 before:bottom-6 before:w-px before:bg-gradient-to-b before:from-[#7B72F8]/50 before:to-transparent">
              {steps.map(({ n, title, desc }) => (
                <li key={n} data-howto-step className="relative flex gap-5 rounded-2xl border border-zinc-800/60 bg-[#0E0E14] p-5 hover:border-[#7B72F8]/40 transition-colors">
                  <span className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-[#7B72F8] flex items-center justify-center text-base font-bold shadow-lg shadow-[#7B72F8]/30">{n}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
                    <p className="text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <SynchronizationFacts locale="en" />

          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5">Common questions</h2>
            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group border border-zinc-800/60 bg-[#0E0E14] rounded-xl px-5 py-4 open:border-[#7B72F8]/40 transition-colors">
                  <summary className="flex items-center justify-between gap-4 text-white font-medium cursor-pointer list-none select-none">
                    {q}
                    <span className="shrink-0 text-zinc-500 group-open:rotate-45 group-open:text-[#7B72F8] transition-transform text-lg leading-none">+</span>
                  </summary>
                  <p className="text-zinc-400 text-sm mt-3 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
            <p className="text-zinc-500 text-sm mt-5">
              More answers in the{' '}
              <Link href="/en/faq" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
                full FAQ
              </Link>
              .
            </p>
          </section>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#141225] to-[#0E0E14] border border-[#7B72F8]/30 rounded-3xl p-8 text-center">
            <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[90px]" />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-3">Ready to try it?</h2>
              <p className="text-zinc-400 mb-6">Create your first room in under a minute</p>
              <a href={appUrl('/register')} className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#7B72F8]/25">
                Start free
              </a>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="en" />
    </>
  );
}
