import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  // No manual "| WeWatch" — the root layout's title template appends it.
  title: 'Смотреть сериалы вместе онлайн бесплатно — синхронно',
  description:
    'Как смотреть сериалы вместе с друзьями онлайн бесплатно. WeWatch синхронизирует серии между всеми участниками — смотрите по эпизоду вместе на iPhone, Android и вебе.',
  keywords: [
    'смотреть сериалы вместе', 'смотреть сериалы вместе онлайн бесплатно', 'смотреть сериал вместе',
    'сериал с друзьями онлайн', 'смотреть сериалы синхронно', 'watch party сериалы',
  ],
  alternates: {
    canonical: 'https://wewatch.uz/guides/smotret-serialy-vmeste-besplatno',
    languages: {
      'ru': 'https://wewatch.uz/guides/smotret-serialy-vmeste-besplatno',
      'uz': 'https://wewatch.uz/uz/guides/serial-birgalikda',
    },
  },
  openGraph: {
    title: 'Смотреть сериалы вместе онлайн бесплатно | WeWatch',
    description: 'Синхронный просмотр сериалов с друзьями — по эпизоду вместе.',
    url: 'https://wewatch.uz/guides/smotret-serialy-vmeste-besplatno',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Как смотреть сериалы вместе онлайн бесплатно',
  description: 'Гайд по совместному синхронному просмотру сериалов через WeWatch.',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-07-02',
  inLanguage: 'ru',
  mainEntityOfPage: 'https://wewatch.uz/guides/smotret-serialy-vmeste-besplatno',
};

export default function SerialyVmestePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="ru" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Сериалы вместе</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Смотреть сериалы вместе онлайн бесплатно</h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Начните сериал с друзьями и смотрите по эпизоду синхронно. WeWatch держит серию в одном времени у всех — никто не убегает вперёд и не спойлерит.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Свой сериальный клуб</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Договоритесь смотреть по серии в определённый вечер. Создаёте комнату, кидаете ссылку — и обсуждаете каждый эпизод в чате прямо во время просмотра. Никаких «ой, а я уже посмотрел без тебя».
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Как смотреть сериал вместе — 3 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Найдите серию', desc: 'Откройте эпизод на YouTube, VK Видео или Rutube в браузере WeWatch.' },
                { n: 2, title: 'Создайте комнату', desc: 'Отправьте ссылку-приглашение всем участникам клуба.' },
                { n: 3, title: 'Смотрите и обсуждайте', desc: 'Серия синхронна у всех, реакции и обсуждение — в чате.' },
              ].map(({ n, title, desc }) => (
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

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Начните сериал вместе</h2>
            <p className="text-zinc-400 mb-6">WeWatch бесплатен — без ограничений</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Скачать WeWatch</Link>
              <Link href="/guides/smotret-anime-vmeste" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">Аниме вместе →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" currentPath="/guides/smotret-serialy-vmeste-besplatno" />
    </>
  );
}
