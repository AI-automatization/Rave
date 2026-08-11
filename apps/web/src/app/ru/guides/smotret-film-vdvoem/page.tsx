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


/**
 * Rendered as the visible FAQ and published as FAQPage from this one array, so the
 * schema cannot drift from the page. Every figure here comes from
 * src/data/product-facts.ts (verified 2026-08-06) — room capacity, the 500 ms
 * correction threshold and the inactivity timeout are not rounded or reworded.
 */
const FAQS = [
  {
    q: 'Можно ли смотреть фильм только вдвоём или больше?',
    a: 'Комната рассчитана на 10 участников. Вдвоём — самый частый сценарий, но третьего и четвёртого можно позвать той же ссылкой-приглашением.',
  },
  {
    q: 'Нужен ли аккаунт второму участнику?',
    a: 'Нет. Аккаунт нужен тому, кто создаёт комнату. Второй заходит по ссылке-приглашению без регистрации.',
  },
  {
    q: 'У нас разная скорость интернета — фильм разъедется?',
    a: 'Нет. Расхождение больше 500 мс WeWatch исправляет автоматически, подтягивая всех к позиции ведущего.',
  },
  {
    q: 'Один смотрит с телефона, другой с ноутбука — так можно?',
    a: 'Да. Веб-версия работает в браузерах на iPhone, Android и компьютере, синхронизация между ними одинаковая. Нативные приложения находятся в разработке.',
  },
  {
    q: 'Какие ссылки на фильм подойдут?',
    a: 'YouTube, VK Видео, Rutube и прямые MP4-ссылки. Доступ к самому фильму определяется правилами выбранного источника.',
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

export default function FilmVdvoemPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
