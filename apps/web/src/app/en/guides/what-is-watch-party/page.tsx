import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay, FaUsers } from 'react-icons/fa';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideRoomMockup } from '@/components/common/GuideArticleUI';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';
import { VisibleFaqs } from '@/components/common/VisibleFaqs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/en/guides/what-is-watch-party';

export const metadata: Metadata = {
  title: 'What Is a Watch Party? Synced Video Watching Explained',
  description:
    'A watch party is synchronized co-watching over the internet. How it works, how it differs from a video call, and how to start one for free.',
  keywords: [
    'what is a watch party', 'watch party meaning', 'watch party explained',
    'synchronized video watching', 'co-watching online', 'watch party app',
    'watch movies together online', 'virtual watch party',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'What Is a Watch Party? | WeWatch',
    description: 'A full explanation of watch parties: how synced playback works, which platforms are supported, and how to start.',
    url: `${APP_URL}${PATH}`,
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const FAQS = [
  { q: 'What does watch party mean?', a: 'A watch party is a group of people watching the same video at the same moment over the internet, with playback kept in sync automatically. When one person pauses, it pauses for everyone.' },
  { q: 'How is a watch party different from screen sharing?', a: 'Screen sharing re-encodes and streams one person’s screen, which costs bandwidth and loses quality. A watch party sends only small timing commands — everyone streams the video at full quality from the original source.' },
  { q: 'Do I need an account to join a watch party?', a: 'Joining through an invite link works without an account. Creating a room and controlling playback requires a free account.' },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      '@id': `${APP_URL}${PATH}#faq`,
      inLanguage: 'en',
      mainEntity: FAQS.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
};

const COMPARISON = [
  {
    title: 'Watch party',
    body: 'Everyone streams the video from its original source at full quality. Only timing commands travel between participants, so bandwidth cost is negligible.',
    good: true,
  },
  {
    title: 'Screen sharing',
    body: 'One person’s screen is re-encoded and streamed to everyone. Quality drops, the sharer’s upload becomes the bottleneck, and audio often desyncs.',
    good: false,
  },
  {
    title: '“3, 2, 1, press play”',
    body: 'Manual countdown over a call. Works for about a minute, then a buffer or an ad pushes someone out of sync and you start over.',
    good: false,
  },
];

export default function WhatIsWatchPartyEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex-1 bg-page text-zinc-300">

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div className="mb-10">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
              <Link href="/en" className="hover:text-zinc-300 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/en/guides" className="hover:text-zinc-300 transition-colors">Guides</Link>
              <span>/</span>
              <span className="text-zinc-300">What is a watch party</span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7B72F8]/20 flex items-center justify-center">
                <FaUsers size={18} className="text-[#7B72F8]" />
              </div>
              <span className="text-zinc-500 text-sm">Guide · 4 min read</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              What is a watch party?
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
              Synchronized co-watching over the internet — several people watching the same video
              at the same moment, as if they were sitting on the same sofa.
            </p>
              </div>
              <GuideRoomMockup locale="en" photo="cinema" priority />
            </div>
          </div>

          <div className="bg-[#111118] border border-[#7B72F8]/30 rounded-2xl px-6 py-5 mb-12">
            <p className="text-zinc-400 text-sm leading-6">
              <strong className="text-white">In short:</strong> a watch party keeps one shared
              playback position for a group. Anyone can press play, pause or seek, and it applies to
              everyone at the same instant. No countdown, no screen sharing, no quality loss.
            </p>
          </div>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">How it actually works</h2>
            <p className="text-zinc-400 leading-7 mb-4">
              The naive approach — send “play now” to everyone — fails, because that message reaches
              a participant on fast Wi-Fi before one on mobile data. The gap is small but it
              compounds, and within a few minutes people are seconds apart.
            </p>
            <p className="text-zinc-400 leading-7 mb-4">
              WeWatch avoids this in two steps. First, every client measures its own clock offset
              against the server, the same way NTP does, so all participants can translate a server
              timestamp into their local clock. Second, playback commands are not executed on
              arrival — they are scheduled for a shared future timestamp. Everyone therefore starts
              at the same real-world instant, regardless of who received the message first.
            </p>
            <p className="text-zinc-400 leading-7">
              Drift still happens: buffering, a slow device, an ad. A periodic heartbeat compares
              each client’s position against the room’s authoritative position, and anything beyond
              500 ms is corrected automatically.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Watch party vs. the alternatives</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {COMPARISON.map(({ title, body, good }) => (
                <div
                  key={title}
                  className={`rounded-xl border px-5 py-5 ${
                    good ? 'border-[#7B72F8]/40 bg-[#7B72F8]/5' : 'border-zinc-800/60 bg-[#0E0E14]'
                  }`}
                >
                  <h3 className={`font-semibold mb-2 ${good ? 'text-[#7B72F8]' : 'text-white'}`}>
                    {title}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-6">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">What you can watch</h2>
            <p className="text-zinc-400 leading-7 mb-4">
              WeWatch supports YouTube, VK Video, Rutube and direct MP4 links in the web version.
            </p>
            <p className="text-zinc-400 leading-7">
              A room holds up to 10 participants and closes automatically after 10 minutes with
              nobody active. Live chat and emoji reactions run alongside the video.
            </p>
          </section>

          <VisibleFaqs title="Frequently asked questions" items={FAQS} />

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-4">Common scenarios</h2>
            <p className="text-zinc-400 leading-7">
              Two write-ups cover the most common reasons people start a watch party:{' '}
              <Link href="/en/use-cases/long-distance" className="text-[#7B72F8] hover:underline">watching together long distance</Link>{' '}
              and{' '}
              <Link href="/en/use-cases/online-date" className="text-[#7B72F8] hover:underline">an online date over a movie</Link>.
            </p>
          </section>

          <div className="bg-gradient-to-br from-[#7B72F8]/10 to-[#7B72F8]/5 border border-[#7B72F8]/25 rounded-2xl px-8 py-8 text-center">
            <p className="text-zinc-400 text-sm mb-2">Try it yourself</p>
            <p className="text-white font-bold text-2xl mb-4">Start a watch party for free</p>
            <Link
              href="/en"
              className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6B62E8] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              <FaPlay size={12} />
              Create a room
            </Link>
          </div>
        </main>

        <GuideArticleEnd locale="en" currentPath={PATH} />
      </div>
    </>
  );
}
