import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay, FaYoutube } from 'react-icons/fa';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/en/guides/watch-youtube-together';

export const metadata: Metadata = {
  title: 'How to Watch YouTube Together With a Friend Online (Free)',
  description:
    'Step-by-step: watch YouTube together with friends in sync. Works across iPhone, Android and desktop browsers — free, no browser extension needed.',
  keywords: [
    'watch youtube together', 'watch youtube with friends online', 'youtube watch party',
    'watch youtube together online free', 'youtube sync watch', 'watch videos together',
    'youtube co-watching', 'watch youtube simultaneously',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'How to Watch YouTube Together With a Friend Online | WeWatch',
    description:
      'Watch YouTube in sync with friends — from a phone, from a computer, across platforms. No extensions, free.',
    url: `${APP_URL}${PATH}`,
    locale: 'en_US',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

// Facts (500 ms drift correction, 10 participants) come from
// shared/src/constants — they must match llms.txt and the app, not be invented.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to watch YouTube together with a friend online',
  description: 'Step-by-step instructions for starting a synchronized YouTube watch party with WeWatch.',
  inLanguage: 'en',
  totalTime: 'PT2M',
  tool: [{ '@type': 'HowToTool', name: 'WeWatch' }],
  url: `${APP_URL}${PATH}`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${APP_URL}${PATH}` },
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Open WeWatch',
      text: 'Open wewatch.uz in any browser, or install WeWatch from the App Store or Google Play.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Create an account',
      text: 'Sign up for a free account. Your friend does not need one to join by invite link.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Create a room',
      text: 'Press “Create room” and paste the YouTube link you want to watch.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Share the room link',
      text: 'Copy the room link and send it to your friend on WhatsApp, Telegram or any messenger.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Press play',
      text: 'Once your friend joins, press play. Playback stays in sync for everyone — pause and seek apply to the whole room.',
    },
  ],
};

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 shrink-0 rounded-lg bg-[#7B72F8]/15 text-[#7B72F8] font-semibold flex items-center justify-center text-sm">
        {n}
      </div>
      <div>
        <h3 className="text-white font-semibold mb-1.5">{title}</h3>
        <p className="text-zinc-400 text-sm leading-7">{text}</p>
      </div>
    </div>
  );
}

const FAQS = [
  {
    q: 'Do I need a browser extension?',
    a: 'No. WeWatch runs as a web app — just open wewatch.uz. There is nothing to install on desktop, and the mobile apps are optional.',
  },
  {
    q: 'Is watching YouTube together free?',
    a: 'Yes. The free tier has no time limit — create rooms and watch together for as long as you want. A Pro plan exists for extra features, but synced watching is not behind it.',
  },
  {
    q: 'Will my friend see YouTube ads?',
    a: 'Yes. Each participant streams YouTube through their own browser or app, ads included. WeWatch only synchronizes playback — the video itself is delivered by YouTube directly.',
  },
  {
    q: 'Does it work with YouTube Shorts and live streams?',
    a: 'Shorts are fully supported. Live streams sync too, though the stream delay itself can differ slightly between participants — that part is outside any watch-party app’s control.',
  },
  {
    q: 'How many people can watch together?',
    a: 'Up to 10 participants in one room. Rooms close automatically after 10 minutes with nobody active.',
  },
];

export default function WatchYouTubeTogetherEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-[#060608] text-zinc-300">
        <GuideHeader locale="en" />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
          <div className="mb-10">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
              <Link href="/en" className="hover:text-zinc-300 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/en/guides" className="hover:text-zinc-300 transition-colors">Guides</Link>
              <span>/</span>
              <span className="text-zinc-300">YouTube together</span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                <FaYoutube size={20} className="text-red-500" />
              </div>
              <span className="text-zinc-500 text-sm">Guide · 3 min read</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              How to watch YouTube together with a friend
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
              Free, without a browser extension, from any device — iPhone, Android or desktop.
              Synchronization is automatic.
            </p>
          </div>

          <div className="bg-[#111118] border border-[#7B72F8]/30 rounded-2xl px-6 py-5 mb-12">
            <p className="text-zinc-400 text-sm leading-6">
              <strong className="text-white">In short:</strong> WeWatch keeps a YouTube video in
              sync between everyone in a room. You pause — everyone pauses. You seek — everyone
              seeks. An iPhone, an Android phone and a desktop browser can share the same room at
              the same time.
            </p>
          </div>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-8">Step by step</h2>
            <div className="space-y-8">
              <Step
                n={1}
                title="Open WeWatch"
                text="On desktop or Android, open wewatch.uz in any browser. On iPhone you can also install the WeWatch app from the App Store. Signing up takes about 30 seconds."
              />
              <Step
                n={2}
                title="Create a room"
                text="Press “Create room”. Paste the YouTube link you want to watch (for example https://youtube.com/watch?v=…) and give the room a name if you like."
              />
              <Step
                n={3}
                title="Share the link with your friend"
                text="Copy your room link and send it over WhatsApp, Telegram or any messenger. Your friend just taps the link — no account needed to join by invite."
              />
              <Step
                n={4}
                title="Press play and watch together"
                text="Once everyone has joined, press play. The room host controls playback: their pause and seek apply to every participant at the same moment."
              />
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Works across different devices</h2>
            <p className="text-zinc-400 leading-7 mb-4">
              Cross-platform rooms are the point. You can share a room between:
            </p>
            <ul className="space-y-3 mb-6">
              {[
                'iPhone + desktop browser',
                'Android + iPhone',
                'Desktop + a phone on either platform',
                'Several computers in different countries',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-[#7B72F8] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-zinc-400 leading-7">
              Each client measures its clock offset against the server, and playback commands are
              scheduled at a shared future timestamp instead of running the moment they arrive —
              that is what absorbs the difference in network latency between participants. A
              periodic heartbeat compares every client against the room position and corrects any
              device that drifts more than 500 ms.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently asked questions</h2>
            <div className="space-y-6">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="border-b border-zinc-800/60 pb-6">
                  <h3 className="text-white font-semibold mb-2">{q}</h3>
                  <p className="text-zinc-400 text-sm leading-7">{a}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-br from-[#7B72F8]/10 to-[#7B72F8]/5 border border-[#7B72F8]/25 rounded-2xl px-8 py-8 text-center">
            <p className="text-zinc-400 text-sm mb-2">Ready to try it?</p>
            <p className="text-white font-bold text-2xl mb-4">Create a room in 30 seconds</p>
            <Link
              href="/en"
              className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6B62E8] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              <FaPlay size={12} />
              Start watching together
            </Link>
          </div>
        </main>

        <GuideFooter locale="en" currentPath={PATH} />
      </div>
    </>
  );
}
