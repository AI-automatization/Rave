import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  // No manual "| WeWatch" — the root layout's title template appends it.
  title: 'Сериальный клуб онлайн бесплатно — смотреть сериалы группой',
  description:
    'Как организовать бесплатный сериальный клуб онлайн для нескольких друзей: общая комната, синхронный эпизод и чат.',
  keywords: [
    'смотреть сериалы вместе онлайн бесплатно', 'сериальный клуб онлайн',
    'сериалы с друзьями бесплатно', 'групповой просмотр сериалов',
  ],
  alternates: {
    canonical: 'https://wewatch.uz/ru/guides/smotret-serialy-vmeste-besplatno',
  },
  openGraph: {
    title: 'Сериальный клуб онлайн бесплатно | WeWatch',
    description: 'Групповой синхронный просмотр сериалов с друзьями и обсуждением в чате.',
    url: 'https://wewatch.uz/ru/guides/smotret-serialy-vmeste-besplatno',
    type: 'article',
  },
  robots: { index: true, follow: true },
};


/**
 * Rendered as the visible FAQ and published as FAQPage from this one array, so the
 * schema cannot drift from the page. Figures come from src/data/product-facts.ts
 * (verified 2026-08-06): 10 participants per room, rooms close after 10 minutes
 * of inactivity, drift above 500 ms is corrected automatically.
 */
const FAQS = [
  {
    q: 'Сколько человек можно позвать в сериальный клуб?',
    a: 'До 10 участников в одной комнате — одной ссылки-приглашения хватает на всех.',
  },
  {
    q: 'Что будет, если кто-то подключится позже остальных?',
    a: 'Опоздавший подхватывает серию с той позиции, на которой идёт просмотр у ведущего, — отматывать вручную не нужно.',
  },
  {
    q: 'Комната закроется, пока мы делаем перерыв между сериями?',
    a: 'Комната закрывается автоматически после 10 минут без активности. Для перерыва подольше проще создать новую и отправить свежую ссылку.',
  },
  {
    q: 'Всем участникам клуба нужен аккаунт?',
    a: 'Нет. Аккаунт нужен только тому, кто создаёт комнату и управляет воспроизведением, остальные заходят по ссылке.',
  },
  {
    q: 'Сколько это стоит?',
    a: 'Основные функции совместного просмотра бесплатны. Тариф Pro находится в подготовке, купить его пока нельзя.',
  },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'ru',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function SerialyVmestePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="ru" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Сериалы вместе</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Сериальный клуб онлайн бесплатно</h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Соберите несколько друзей в сериальный клуб и смотрите выбранный эпизод синхронно. WeWatch держит одну позицию у всех — никто не убегает вперёд и не спойлерит.
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

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Часто задаваемые вопросы</h2>
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
            <h2 className="text-2xl font-bold mb-3">Начните сериал вместе</h2>
            <p className="text-zinc-400 mb-6">Основные функции совместного просмотра WeWatch бесплатны</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Открыть WeWatch</Link>
              <Link href="/ru/guides/smotret-serial-vmeste" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">Сериал вдвоём →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" currentPath="/ru/guides/smotret-serialy-vmeste-besplatno" />
    </>
  );
}
