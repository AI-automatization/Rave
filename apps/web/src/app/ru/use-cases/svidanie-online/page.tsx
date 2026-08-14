import type { Metadata } from 'next';
import Link from 'next/link';
import { hreflangFor } from '@/lib/i18n/routes';
import { ArticleMetadata } from '@/components/common/ArticleMetadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/ru/use-cases/svidanie-online';

export const metadata: Metadata = {
  title: 'Свидание онлайн — киновечер вдвоём через интернет',
  description:
    'Идея для свидания онлайн: смотрите фильм вместе через WeWatch — синхронно, с чатом и реакциями. Романтический вечер вдвоём, даже если вы в разных местах.',
  keywords: [
    'свидание онлайн', 'идеи для свидания онлайн', 'киновечер вдвоём', 'онлайн свидание фильм',
    'что делать на свидании онлайн', 'романтический вечер онлайн', 'смотреть фильм на свидании',
    'виртуальное свидание', 'watch party свидание',
  ],
  // См. соседнюю страницу: hreflang из реестра USE_CASE_GROUPS.
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Свидание онлайн — киновечер вдвоём | WeWatch',
    description: 'Смотрите фильм вместе синхронно — идея для романтического онлайн-свидания.',
    url: 'https://wewatch.uz/ru/use-cases/svidanie-online',
    type: 'article',
  },
  robots: { index: true, follow: true },
};


export default function SvidanieOnlinePage() {
  return (
    <>
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Свидание онлайн</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Свидание онлайн: киновечер вдвоём
          </h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Не знаете, чем заняться на свидании онлайн? Включите один фильм на двоих. WeWatch синхронизирует просмотр, а чат и эмодзи заменяют «сидеть рядом» — атмосфера настоящего свидания.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Идеи для онлайн-свидания с фильмом</h2>
            <ul className="space-y-4">
              {[
                { t: 'Романтическая комедия', d: 'Классика первого свидания — лёгкий фильм и реакции в чате.' },
                { t: 'Сериал по эпизоду', d: 'Начните сериал вместе и смотрите по серии каждый вечер.' },
                { t: 'Ужастик', d: 'Пугаться вместе — быстрый способ сблизиться. Пауза на «страшном» — у обоих.' },
                { t: 'Ностальгия', d: 'Включите фильм из детства и делитесь воспоминаниями в чате.' },
              ].map(({ t, d }) => (
                <li key={t} className="border border-zinc-800 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-1">{t}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{d}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Как настроить за минуту</h2>
            <p className="text-zinc-400 leading-relaxed">
              Откройте WeWatch в браузере, выберите видео, создайте комнату и отправьте ссылку. Партнёр переходит — и вы смотрите синхронно. Приложения для iOS и Android находятся в разработке.
            </p>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Устройте свидание сегодня</h2>
            <p className="text-zinc-400 mb-6">Основные функции совместного просмотра бесплатны</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Открыть WeWatch</Link>
              <Link href="/ru/use-cases/dalnie-otnosheniya" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">Отношения на расстоянии →</Link>
            </div>
          </div>
        </div>
      </main>
      <ArticleMetadata currentPath={PATH} />
    </>
  );
}
