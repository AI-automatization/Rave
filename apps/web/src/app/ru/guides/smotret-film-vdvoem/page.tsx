import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideRoomMockup, GuideBenefits, GuideSteps, GuideFAQ, GuideCTA } from '@/components/common/GuideArticleUI';

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
      <main className="guide-page flex-1 bg-page text-white">
        {/* `page-hero` is the sitewide header treatment (breadcrumb pill,
            display H1, lead paragraph) — same class /faq, /guides and /team
            use. The two-column split with the mockup is the guide-specific part. */}
        <div className="page-hero shell relative pt-16 pb-8">
          <nav className="text-sm text-zinc-500">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/ru/guides/kino-s-drugom-onlayn" className="hover:text-white transition-colors">Смотреть кино вместе</Link>
            <span className="mx-2">/</span>
            <span>Фильм вдвоём</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1>Смотреть фильм вдвоём онлайн</h1>
              <p>
                Хотите посмотреть фильм вдвоём, но вы не рядом? Откройте веб-версию на двух устройствах: один ставит паузу — у второго тоже пауза. Как будто на одном диване.
              </p>
            </div>
            <GuideRoomMockup photo="theatre-couple" priority />
          </div>
        </div>

        <div className="article shell py-12">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Почему это удобно</h2>
            <GuideBenefits
              variant="bento"
              items={[
                { icon: 'users', title: 'Вместе на расстоянии', desc: 'Смотрите синхронно с любого устройства, где бы вы ни находились.' },
                { icon: 'chat', title: 'Чат во время просмотра', desc: 'Обсуждайте фильм в реальном времени, не выходя из плеера.' },
                { icon: 'link', title: 'Без регистрации гостю', desc: 'Второй участник заходит по ссылке — аккаунт не нужен.' },
                { icon: 'bolt', title: 'Просто и быстро', desc: 'Никаких сложных настроек — пара кликов и вы смотрите вместе.' },
              ]}
            />
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Как смотреть вдвоём — 3 шага</h2>
            <GuideSteps
              variant="timeline"
              steps={[
                { n: 1, icon: 'link', title: 'Добавьте фильм', desc: 'Вставьте ссылку YouTube, VK Видео, Rutube или прямую MP4-ссылку.' },
                { n: 2, icon: 'invite', title: 'Создайте комнату', desc: 'Отправьте ссылку-приглашение второму участнику.' },
                { n: 3, icon: 'play', title: 'Смотрите синхронно', desc: 'Просмотр идёт одновременно, а чат и эмодзи заменяют «сидеть рядом».' },
              ]}
            />
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Идеально для пары, друга или близкого</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Вдвоём смотреть проще всего — веб-версия WeWatch держит фильм синхронно в браузерах на iPhone и Android. Нативные приложения находятся в разработке.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Если к вечеру присоединятся ещё несколько человек, механика та же, меняется только формат — это разобрано в общем гайде: <Link href="/ru/guides/kino-s-drugom-onlayn" className="text-[#7B72F8] hover:underline">смотреть кино вместе с другом</Link>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Часто задаваемые вопросы</h2>
            <GuideFAQ items={FAQS.map(({ q, a }) => ({ q, a }))} />
          </section>

          <GuideCTA title="Посмотрите фильм вдвоём сегодня" subtitle="Основные функции совместного просмотра бесплатны">
            <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Открыть WeWatch</Link>
            <Link href="/ru/use-cases/dalnie-otnosheniya" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">На расстоянии →</Link>
          </GuideCTA>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/smotret-film-vdvoem" />
    </>
  );
}
