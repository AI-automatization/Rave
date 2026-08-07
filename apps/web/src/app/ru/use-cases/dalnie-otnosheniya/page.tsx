import type { Metadata } from 'next';
import Link from 'next/link';
import { hreflangFor } from '@/lib/i18n/routes';
import { ArticleMetadata } from '@/components/common/ArticleMetadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/ru/use-cases/dalnie-otnosheniya';

export const metadata: Metadata = {
  title: 'Смотреть фильмы вместе на расстоянии — для пар в разлуке',
  description:
    'Партнёр далеко? Смотрите фильмы и сериалы вместе онлайн, синхронно, как будто рядом. WeWatch — свидание на расстоянии для пар в разных городах и странах.',
  keywords: [
    'смотреть фильмы вместе на расстоянии', 'смотреть кино с парнем на расстоянии',
    'смотреть с девушкой на расстоянии', 'дальние отношения смотреть вместе',
    'свидание онлайн на расстоянии', 'что делать в отношениях на расстоянии',
    'смотреть фильм вместе с любимым онлайн', 'watch party для пар',
  ],
  // Узбекская и английская версии этой страницы появились позже — hreflang
  // берётся из реестра USE_CASE_GROUPS, чтобы три языка ссылались друг на друга.
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Смотреть вместе на расстоянии — WeWatch',
    description: 'Свидание онлайн для пар в разлуке: фильмы и сериалы синхронно, как будто рядом.',
    url: 'https://wewatch.uz/ru/use-cases/dalnie-otnosheniya',
    type: 'article',
  },
  robots: { index: true, follow: true },
};


export default function DalnieOtnosheniyaPage() {
  return (
    <>
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Отношения на расстоянии</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Смотреть фильмы вместе, когда вы далеко
          </h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Разные города или страны — не помеха для вечера вдвоём. WeWatch синхронизирует фильм на ваших телефонах: вы ставите паузу — у партнёра тоже пауза. Как будто сидите на одном диване.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Свидание онлайн, а не переписка</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Отношения на расстоянии держатся на совместных моментах. Вместо «что смотришь?» в переписке — включите один фильм на двоих. WeWatch держит кадр синхронно, а встроенный чат и эмодзи дают реагировать вживую.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Как устроить киновечер на расстоянии</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Выберите фильм заранее', desc: 'Договоритесь о фильме или сериале — на YouTube, VK Видео или Rutube.' },
                { n: 2, title: 'Создайте комнату', desc: 'Один из вас создаёт комнату в WeWatch и отправляет ссылку второму.' },
                { n: 3, title: 'Смотрите синхронно', desc: 'Просмотр идёт одновременно. Пауза «на поговорить» — у обоих. Реакции — в чате.' },
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
            <h2 className="text-2xl font-bold mb-4">Почему WeWatch, а не «включим на счёт три»</h2>
            <p className="text-zinc-400 leading-relaxed">
              Ручная синхронизация «три-два-один» рассыпается на первой же паузе. Веб-версия WeWatch работает в браузерах на iPhone и Android; нативные приложения находятся в разработке.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Вопросы</h2>
            <div className="space-y-4">
              {[
                { q: 'Работает между разными странами?', a: 'Да. Синхронизация не зависит от расстояния — важно только интернет-соединение.' },
                { q: 'Нужен ли одинаковый телефон?', a: 'Нет. Откройте веб-версию в браузерах на iPhone или Android. Нативные приложения находятся в разработке.' },
                { q: 'Это бесплатно?', a: 'Основные функции совместного просмотра WeWatch бесплатны.' },
              ].map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Устройте вечер вдвоём сегодня</h2>
            <p className="text-zinc-400 mb-6">Расстояние не важно — основные функции просмотра бесплатны</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Открыть WeWatch</Link>
              <Link href="/ru/use-cases/svidanie-online" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">Свидание онлайн →</Link>
            </div>
          </div>
        </div>
      </main>
      <ArticleMetadata currentPath={PATH} />
    </>
  );
}
