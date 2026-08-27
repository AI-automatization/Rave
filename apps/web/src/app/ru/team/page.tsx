import type { Metadata } from 'next';
import Link from 'next/link';
import { TeamAvatar } from '@/components/common/TeamAvatar';
import { TEAM, TEZCODE_TEAM_URL } from './team-data';

export const metadata: Metadata = {
  title: 'Команда WeWatch — разработчики и основатели | tezcode',
  description:
    'Команда, создавшая WeWatch: инженеры и основатели tezcode — Bekzod Mirzaliyev, Ertan Emirhan, Saidazim Buriboyev, Abdulaziz Yormatov.',
  keywords: [
    'команда wewatch', 'разработчики wewatch', 'команда tezcode', 'основатели tezcode',
    'Bekzod Mirzaliyev', 'Ertan Emirhan', 'Saidazim Buriboyev', 'Abdulaziz Yormatov',
  ],
  alternates: { canonical: 'https://wewatch.uz/ru/team' },
  openGraph: {
    title: 'Команда WeWatch — tezcode',
    description: 'Инженеры и основатели, создавшие WeWatch.',
    url: 'https://wewatch.uz/ru/team',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WeWatch',
  url: 'https://wewatch.uz',
  parentOrganization: { '@type': 'Organization', name: 'tezcode', url: 'https://tezcode.dev' },
  member: TEAM.map((m) => ({
    '@type': 'Person',
    name: m.name,
    jobTitle: m.role,
    image: `https://wewatch.uz${m.photo}`,
    url: `https://wewatch.uz/ru/team/${m.slug}`,
    ...(m.sameAs.length ? { sameAs: m.sameAs } : {}),
  })),
};

export default function TeamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-page text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(123,114,248,0.15),transparent)]" />

        <div className="page-hero relative max-w-5xl mx-auto px-4 py-12 md:py-16">
          <nav className="text-sm text-zinc-500 mb-10">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-300">Команда</span>
          </nav>

          <span className="inline-block text-xs font-semibold tracking-widest text-[#7B72F8] uppercase mb-4 border border-[#7B72F8]/30 rounded-full px-3 py-1">
            tezcode · Ташкент
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">Команда WeWatch</h1>
          <p className="text-xl text-zinc-400 mb-14 leading-relaxed max-w-2xl">
            WeWatch создаёт <Link href="/ru/tezcode" className="text-[#7B72F8] hover:underline">tezcode</Link> — AI-first студия разработки из Ташкента. Инженеры и основатели продукта:
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {TEAM.map((m, i) => (
              <Link
                key={m.slug}
                href={`/ru/team/${m.slug}`}
                className="group block rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-[#7B72F8]/50 transition-colors"
              >
                <TeamAvatar name={m.name} photo={m.photo} index={i} />
                <div className="p-4">
                  <h2 className="font-semibold text-white group-hover:text-[#7B72F8] transition-colors leading-tight">{m.name}</h2>
                  <p className="text-sm text-[#7B72F8]/90 mt-0.5">{m.role}</p>
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{m.tagline}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="border border-white/10 rounded-3xl p-8 text-center bg-gradient-to-br from-white/[0.03] to-transparent">
            <h2 className="text-2xl font-bold mb-2">Это часть команды</h2>
            <p className="text-zinc-400 mb-6 max-w-xl mx-auto">Вся команда tezcode — со всеми направлениями и проектами студии — на сайте tezcode.</p>
            <a
              href={TEZCODE_TEAM_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Вся команда на tezcode.dev →
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
