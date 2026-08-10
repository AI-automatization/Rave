import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  // No manual "| WeWatch" — the root layout's title template appends it.
  title: 'Смотреть фильм вдвоём онлайн — синхронно на расстоянии',
  description:
    'Как смотреть фильм вдвоём онлайн в браузерах на двух устройствах: общая позиция, синхронная пауза и приглашение по ссылке.',
  keywords: [
    'смотреть фильм вдвоём', 'смотреть фильм вдвоём онлайн', 'смотреть кино вдвоём',
    'смотреть фильм вдвоём на расстоянии', 'фильм на двоих онлайн', 'смотреть вдвоём синхронно',
  ],
  alternates: { canonical: 'https://wewatch.uz/ru/guides/smotret-film-vdvoem' },
  openGraph: {
    title: 'Смотреть фильм вдвоём онлайн | WeWatch',
    description: 'Синхронный просмотр фильма на двоих — на любом расстоянии.',
    url: 'https://wewatch.uz/ru/guides/smotret-film-vdvoem',
    type: 'article',
  },
  robots: { index: true, follow: true },
};


export default function FilmVdvoemPage() {
  return (
    <>
      <GuideHeader locale="ru" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Фильм вдвоём</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Смотреть фильм вдвоём онлайн</h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Хотите посмотреть фильм вдвоём, но вы не рядом? Откройте веб-версию на двух устройствах: один ставит паузу — у второго тоже пауза. Как будто на одном диване.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Как смотреть вдвоём — 3 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Добавьте фильм', desc: 'Вставьте ссылку YouTube, VK Видео, Rutube или прямую MP4-ссылку.' },
                { n: 2, title: 'Создайте комнату', desc: 'Отправьте ссылку-приглашение второму участнику.' },
                { n: 3, title: 'Смотрите синхронно', desc: 'Просмотр идёт одновременно, а чат и эмодзи заменяют «сидеть рядом».' },
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
            <h2 className="text-2xl font-bold mb-4">Идеально для пары, друга или близкого</h2>
            <p className="text-zinc-400 leading-relaxed">
              Вдвоём смотреть проще всего — веб-версия WeWatch держит фильм синхронно в браузерах на iPhone и Android. Нативные приложения находятся в разработке.
            </p>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Посмотрите фильм вдвоём сегодня</h2>
            <p className="text-zinc-400 mb-6">Основные функции совместного просмотра бесплатны</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Открыть WeWatch</Link>
              <Link href="/ru/use-cases/dalnie-otnosheniya" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">На расстоянии →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" currentPath="/ru/guides/smotret-film-vdvoem" />
    </>
  );
}
