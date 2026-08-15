import type { Metadata } from 'next';
import Link from 'next/link';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/en/faq';

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description:
    'Answers about WeWatch: how to watch YouTube together, which platforms are supported, whether it is free, and how synchronization actually works.',
  keywords: [
    'wewatch faq', 'watch party questions', 'how to watch youtube together',
    'how does watch party work', 'watch videos together free', 'synced video watching',
    'watch party app free',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'FAQ — Frequently Asked Questions | WeWatch',
    description: 'Everything about WeWatch: web synchronization, the free tier, and iOS/Android apps currently in development.',
    url: `${APP_URL}${PATH}`,
  }),
  robots: { index: true, follow: true },
};

// Facts (10 participants, 500 ms drift, 10 min idle) come from
// shared/src/constants — the Russian FAQ quotes the same numbers.
const faqs = [
  {
    q: 'How do I watch YouTube together with a friend online?',
    a: 'Open wewatch.uz in a browser. Press “Create room”, paste a YouTube link and share the room link with your friend. Native iOS and Android apps are in development.',
  },
  {
    q: 'What is a watch party?',
    a: 'A watch party is synchronized co-watching over the internet. Several people watch the same video in real time, as if they were sitting together. WeWatch keeps playback aligned: play, pause and seek happen simultaneously for everyone in the room.',
  },
  {
    q: 'Which video services does WeWatch support?',
    a: 'WeWatch supports YouTube, VK Video, Rutube and direct .mp4 links in the web version.',
  },
  {
    q: 'Is WeWatch free?',
    a: 'Core watch-party features are free, with no time limit. A Pro plan is planned for additional features, but it is not purchasable yet and its price has not been announced.',
  },
  {
    q: 'Does WeWatch work on Android?',
    a: 'The native iOS and Android apps are in active development. The web version at wewatch.uz is available now and works in browsers on phones and computers.',
  },
  {
    q: 'Can one person watch from a phone and another from a computer?',
    a: 'Yes. Participants can open the web version in browsers on iPhone, Android and desktop and join the same synchronized room. Native apps are in development.',
  },
  {
    q: 'How does the video synchronization work?',
    a: 'Each client measures its clock offset against the server NTP-style, through a ping/echo exchange over a WebSocket. Playback commands are not executed on arrival — they are scheduled at a shared future timestamp, which absorbs the difference in network latency between participants. A periodic heartbeat compares each client against the room position and corrects any drift beyond 500 ms automatically.',
  },
  {
    q: 'Do I need an account to watch?',
    a: 'Creating a room and controlling playback requires a free account. If someone sends you a room link, you can join as a guest and watch without signing up.',
  },
  {
    q: 'How many people can be in one room?',
    a: 'Up to 10 participants in a single room. A room closes automatically after 10 minutes of inactivity.',
  },
  {
    q: 'Do we need a browser extension?',
    a: 'No. WeWatch currently runs as a web app, so participants can join through a browser link. Native iOS and Android apps are in development.',
  },
  {
    q: 'Can we watch together from different countries?',
    a: 'Yes. Distance does not affect synchronization, because playback is scheduled against a shared server clock rather than relayed between participants. People on different continents stay aligned.',
  },
  {
    q: 'Can we chat while watching?',
    a: 'Yes. Every room has live text chat and emoji reactions running alongside the video, so you can react without leaving the room or opening a second app.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${APP_URL}${PATH}#faq`,
  inLanguage: 'en',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function EnFaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex-1 bg-page text-zinc-300">
        {/* Hero with a soft brand-purple glow behind the heading */}
        <div className="relative overflow-hidden border-b border-zinc-800/50">
          <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[120px]" />
          <div className="page-hero relative max-w-4xl mx-auto px-6 pt-16 pb-14">
            <nav aria-label="Breadcrumb" className="text-zinc-600 text-xs mb-6">
              <Link href="/en" className="hover:text-zinc-400 transition-colors">WeWatch</Link>
              <span className="mx-2">/</span>
              <span className="text-zinc-500">FAQ</span>
            </nav>
            <p className="text-[#9B92FF] text-xs font-semibold uppercase tracking-[0.2em] mb-3">Help center</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Frequently asked questions</h1>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
              Everything worth knowing about WeWatch — synchronization, supported platforms,
              pricing and the technical details.
            </p>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-6 py-14">
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <details key={i} className="group bg-[#0E0E14] border border-zinc-800/60 rounded-2xl overflow-hidden transition-colors hover:border-zinc-700/70 open:border-[#7B72F8]/40 open:bg-[#111118]">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none">
                  <h2 className="text-white font-semibold text-base leading-snug group-hover:text-white">{q}</h2>
                  <span className="shrink-0 w-7 h-7 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-open:bg-[#7B72F8] group-open:text-white group-open:rotate-45 transition-all duration-200 text-lg leading-none">+</span>
                </summary>
                <div className="px-6 pb-6 pt-0">
                  <p className="text-zinc-400 leading-7 text-sm border-t border-zinc-800/50 pt-4">{a}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-14 relative overflow-hidden bg-gradient-to-br from-[#141225] to-[#0E0E14] border border-[#7B72F8]/30 rounded-3xl px-8 py-10 text-center">
            <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[90px]" />
            <div className="relative">
              <p className="text-zinc-400 mb-1.5">Didn’t find your answer?</p>
              <p className="text-white font-semibold text-xl mb-5">Write to us directly</p>
              <a
                href="mailto:support@wewatch.uz"
                className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6B62E8] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#7B72F8]/25"
              >
                support@wewatch.uz
              </a>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800/40">
            <p className="text-zinc-600 text-sm mb-4">Useful guides:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/en/guides/watch-youtube-together" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                How to watch YouTube together →
              </Link>
              <Link href="/en/guides/what-is-watch-party" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                What is a watch party →
              </Link>
              <Link href="/en/guides/watch-movies-with-friends" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Watch movies with friends →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
