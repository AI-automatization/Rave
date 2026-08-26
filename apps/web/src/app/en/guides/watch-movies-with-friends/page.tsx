import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay, FaFilm } from 'react-icons/fa';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideRoomMockup } from '@/components/common/GuideArticleUI';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';
import { VisibleFaqs } from '@/components/common/VisibleFaqs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/en/guides/watch-movies-with-friends';

export const metadata: Metadata = {
  title: 'Watch Movies With Friends Online Free — Long Distance Guide',
  description:
    'How to watch films and series with friends through the free WeWatch web version. Native iOS and Android apps are in development.',
  keywords: [
    'watch movies with friends online', 'watch movies together online free',
    'watch films with friends long distance', 'watch series together online',
    'movie night online with friends', 'watch anime together', 'long distance movie date',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'Watch Movies With Friends Online Free | WeWatch',
    description: 'Watch films and series together over the internet — in sync, with chat, from any device.',
    url: `${APP_URL}${PATH}`,
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const FAQS = [
  { q: 'Can I watch movies with friends in a different country?', a: 'Yes. Distance does not affect synchronization — playback is scheduled against a shared server clock, so participants on different continents stay aligned.' },
  { q: 'Does my friend need to install anything?', a: 'No. Joining through the room link works in any browser, and no account is required to join by invite.' },
  { q: 'Can we chat while watching?', a: 'Yes. Every room has live text chat and emoji reactions running alongside the video.' },
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

export default function WatchMoviesWithFriendsEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex-1 bg-page text-zinc-300">

        <main className="shell py-14">
          <div className="mb-10">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
              <Link href="/en" className="hover:text-zinc-300 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/en/guides" className="hover:text-zinc-300 transition-colors">Guides</Link>
              <span>/</span>
              <span className="text-zinc-300">Movies with friends</span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7B72F8]/20 flex items-center justify-center">
                <FaFilm size={18} className="text-[#7B72F8]" />
              </div>
              <span className="text-zinc-500 text-sm">Guide · 4 min read</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Watch movies with friends online
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
              Free, in sync, from any device — and it does not matter whether your friend is in the
              next street or on another continent.
            </p>
              </div>
              <GuideRoomMockup locale="en" photo="friends-home" priority />
            </div>
          </div>

          <div className="bg-[#111118] border border-[#7B72F8]/30 rounded-2xl px-6 py-5 mb-12">
            <p className="text-zinc-400 text-sm leading-6">
              <strong className="text-white">In short:</strong> create a room, paste the video link,
              send the room link to your friends. Everyone watches the same frame at the same
              moment, with chat on the side. Up to 10 people per room.
            </p>
          </div>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-8">How to start</h2>
            <div className="space-y-8">
              <Step
                n={1}
                title="Open WeWatch"
                text="Open wewatch.uz in a browser on any device. Native iOS and Android apps are in development."
              />
              <Step
                n={2}
                title="Pick what to watch"
                text="Paste a YouTube, VK Video, Rutube or direct MP4 link in the web version."
              />
              <Step
                n={3}
                title="Invite your friends"
                text="Share the room link. Anyone who taps it joins immediately — no account needed to join by invite, no browser extension on either side."
              />
              <Step
                n={4}
                title="Watch and talk"
                text="Press play. Pause, rewind and fast-forward apply to everyone at once. Live chat and emoji reactions sit next to the video, so you can react without leaving the room."
              />
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Long distance is not a problem</h2>
            <p className="text-zinc-400 leading-7 mb-4">
              Physical distance does not degrade synchronization. Each participant’s device measures
              its clock offset against the server, and playback commands carry a shared future
              timestamp rather than executing on arrival — so a slower connection shifts when the
              command arrives, not when the video starts.
            </p>
            <p className="text-zinc-400 leading-7">
              If someone does fall behind — buffering, a slow phone — a periodic check pulls them
              back whenever they drift more than 500 ms from the room position. In practice you stop
              noticing that it is happening.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Good for</h2>
            <ul className="space-y-3">
              {[
                'Long-distance relationships — a film night without being in the same city',
                'Friends in different time zones catching up on a series',
                'Watching anime episode by episode with the same group',
                'A small group reacting to a match, a premiere or a trailer together',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-zinc-400 leading-7">
                  <span className="w-2 h-2 mt-3 rounded-full bg-[#7B72F8] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <VisibleFaqs title="Frequently asked questions" items={FAQS} />

          <div className="bg-gradient-to-br from-[#7B72F8]/10 to-[#7B72F8]/5 border border-[#7B72F8]/25 rounded-2xl px-8 py-8 text-center">
            <p className="text-zinc-400 text-sm mb-2">Ready when you are</p>
            <p className="text-white font-bold text-2xl mb-4">Start a movie night in 30 seconds</p>
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
