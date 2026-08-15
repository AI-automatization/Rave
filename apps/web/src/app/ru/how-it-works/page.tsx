import type { Metadata } from 'next';
import Link from 'next/link';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { SynchronizationFacts } from '@/components/common/SynchronizationFacts';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: 'Как работает WeWatch — совместный просмотр видео за 4 шага',
  description:
    'Как смотреть видео вместе с друзьями через веб-версию WeWatch: открыть видео, создать комнату и поделиться ссылкой. Приложения iOS и Android в разработке.',
  keywords: [
    'как работает watch party', 'как смотреть видео вместе', 'как создать комнату для просмотра',
    'как смотреть фильм с друзьями онлайн', 'watch party как пользоваться', 'wewatch инструкция',
  ],
  // Reciprocal hreflang — /en/how-it-works points here and must be pointed back at.
  alternates: {
    canonical: `${APP_URL}/ru/how-it-works`,
    languages: hreflangFor('/ru/how-it-works', APP_URL),
  },
  openGraph: {
    title: 'Как работает WeWatch',
    description: 'Совместный просмотр за 4 шага — синхронизация между всеми устройствами.',
    url: 'https://wewatch.uz/ru/how-it-works',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const steps = [
  { n: 1, title: 'Откройте WeWatch', desc: 'Откройте wewatch.uz в браузере. Приложения для iOS и Android находятся в разработке.' },
  { n: 2, title: 'Добавьте видео', desc: 'Вставьте ссылку YouTube, VK Видео, Rutube или прямую MP4-ссылку.' },
  { n: 3, title: 'Создайте комнату', desc: 'Нажмите «Создать комнату» — WeWatch выдаст ссылку-приглашение. Отправьте её друзьям в любом мессенджере.' },
  { n: 4, title: 'Смотрите синхронно', desc: 'Друг переходит по ссылке — и просмотр синхронизируется. Пауза, перемотка, скорость — всё применяется для всех сразу.' },
];

const howToLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Как смотреть видео вместе через WeWatch',
  description: 'Пошаговая инструкция по совместному онлайн-просмотру видео с друзьями.',
  totalTime: 'PT1M',
  step: steps.map((s) => ({ '@type': 'HowToStep', position: s.n, name: s.title, text: s.desc })),
};

export default function HowItWorksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <main className="flex-1 bg-page text-white">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-zinc-800/50">
          <div aria-hidden className="pointer-events-none absolute -top-40 right-0 h-80 w-[36rem] rounded-full bg-[#7B72F8]/20 blur-[120px]" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-14">
            <nav className="text-sm text-zinc-500 mb-6">
              <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
              <span className="mx-2">/</span>
              <span>Как это работает</span>
            </nav>
            <span className="inline-flex items-center rounded-full border border-[#7B72F8]/30 bg-[#7B72F8]/10 px-3 py-1 text-xs font-semibold text-[#9B92FF] mb-5">
              4 шага · меньше минуты
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight tracking-tight">Как работает WeWatch</h1>
            <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
              Совместный просмотр видео с друзьями — за 4 шага. Веб-версия работает в браузерах на телефонах и компьютерах; приложения iOS и Android разрабатываются.
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

          <SynchronizationFacts locale="ru" />

          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5">Частые вопросы</h2>
            <div className="space-y-3">
              {[
                { q: 'Это бесплатно?', a: 'Основные функции совместного просмотра бесплатны. Дополнительные функции перечислены в отдельном Pro-плане.' },
                { q: 'Нужно ли гостю регистрироваться?', a: 'Создатель комнаты регистрируется, гость входит по ссылке-приглашению.' },
                { q: 'На чём работает?', a: 'Сейчас доступна веб-версия для браузеров на телефонах и компьютерах. Приложения iOS и Android находятся в разработке.' },
                { q: 'Какие источники поддерживаются?', a: 'YouTube, VK Видео, Rutube и прямые .mp4 ссылки.' },
              ].map(({ q, a }) => (
                <details key={q} className="group border border-zinc-800/60 bg-[#0E0E14] rounded-xl px-5 py-4 open:border-[#7B72F8]/40 transition-colors">
                  <summary className="flex items-center justify-between gap-4 text-white font-medium cursor-pointer list-none select-none">
                    {q}
                    <span className="shrink-0 text-zinc-500 group-open:rotate-45 group-open:text-[#7B72F8] transition-transform text-lg leading-none">+</span>
                  </summary>
                  <p className="text-zinc-400 text-sm mt-3 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#141225] to-[#0E0E14] border border-[#7B72F8]/30 rounded-3xl p-8 text-center">
            <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[90px]" />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-3">Готовы попробовать?</h2>
              <p className="text-zinc-400 mb-6">Откройте WeWatch в браузере и создайте первую комнату</p>
              <a href={appUrl('/register')} className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#7B72F8]/25">
                Начать бесплатно
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
