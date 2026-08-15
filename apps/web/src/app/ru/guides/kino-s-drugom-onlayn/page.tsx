import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/ru/guides/kino-s-drugom-onlayn';

export const metadata: Metadata = {
  title: 'Смотреть кино с другом онлайн бесплатно',
  description: 'Смотреть кино вместе с другом онлайн — синхронно, в браузере, бесплатно. Вдвоём или компанией до 10 человек. Приложения iOS и Android в разработке.',
  keywords: ['кино с другом онлайн', 'смотреть кино с другом', 'смотреть кино вместе', 'смотреть фильм с другом онлайн бесплатно', 'кино с другом бесплатно', 'смотреть кино вместе онлайн', 'фильм с другом онлайн'],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Кино с другом онлайн бесплатно | WeWatch',
    description: 'Синхронный просмотр фильмов с другом через бесплатную веб-версию. Приложения iOS и Android разрабатываются.',
    url: 'https://wewatch.uz/ru/guides/kino-s-drugom-onlayn',
    type: 'article',
  },
  robots: { index: true, follow: true },
};


const RELATED = [
  { href: '/ru/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/ru/guides/smotret-film-vdvoem', label: 'Смотреть фильм вдвоём' },
  { href: '/en/guides/watch-movies-with-friends', label: 'English' },
  { href: '/ru/guides/smotret-serial-vmeste', label: 'Смотреть сериал вместе' },
  { href: '/uz/guides/kino-birgalikda', label: "O'zbekcha" },
];


/**
 * Rendered as the visible FAQ and published as FAQPage from this one array — the
 * same rule the guide registry follows, so the schema cannot drift from the page.
 * seo-geo-aeo.spec.ts asserts every question and answer appears in the visible
 * HTML, which is what makes that guarantee testable rather than a convention.
 */
const FAQS = [
  { q: 'Можно смотреть кино если мы в разных странах?', a: 'Да. WeWatch работает через интернет, расстояние не имеет значения. Узбекистан, Россия, Европа — синхронизация одинаковая.' },
  { q: 'Нужна ли подписка на источник видео?', a: 'WeWatch принимает поддерживаемую ссылку, но доступ к самому видео определяется правилами выбранного источника.' },
  { q: 'Можно ли смотреть с нескольких друзей одновременно?', a: 'Да — создайте одну комнату и поделитесь ссылкой с несколькими людьми. Все смотрят синхронно.' },
  { q: 'Это действительно бесплатно?', a: 'Основные функции веб-версии бесплатны. Приложения для iOS и Android находятся в разработке.' },
  { q: 'Сколько человек может смотреть кино вместе?', a: 'До 10 участников в одной комнате. Регистрация нужна только тому, кто создаёт комнату, — остальные заходят по ссылке-приглашению.' },
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

export default function KinoSDrugoOnlaynPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-page text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/ru/guides/smotret-vmeste-onlayn" className="hover:text-white transition-colors">Смотреть вместе</Link>
            <span className="mx-2">/</span>
            <span>Кино с другом онлайн</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Смотреть кино с другом онлайн бесплатно
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Хочешь провести вечер с другом за фильмом, но вы в разных городах? WeWatch решает это — синхронный просмотр кино в браузерах на телефонах и компьютерах. Как будто сидите рядом.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Что делает WeWatch особенным</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Многие сервисы watch party привязаны к одной платформе. WeWatch поддерживает <strong className="text-white">YouTube, VK Видео, Rutube и прямые MP4-ссылки</strong> в веб-версии.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Веб-версия работает в браузерах на iPhone, Android и ноутбуке. Нативные приложения для iOS и Android находятся в разработке.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Смотреть кино вместе: вдвоём или компанией</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Смотреть кино вместе можно и на двоих, и небольшой компанией — в одной комнате помещается до 10 участников, и все видят один и тот же кадр. Ссылка-приглашение одна на всех, а регистрация нужна только тому, кто создаёт комнату.
            </p>
            <p className="text-zinc-400 leading-relaxed mb-4">
              От числа зрителей зависит формат вечера, а не настройки: пауза, перемотка и чат работают одинаково и вдвоём, и вшестером. Если кто-то отстал больше чем на полсекунды, WeWatch подтягивает его к позиции ведущего сам.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Смотрите именно вдвоём — есть отдельный разбор: <Link href="/ru/guides/smotret-film-vdvoem" className="text-[#7B72F8] hover:underline">смотреть фильм вдвоём</Link>. Хочется марафон по эпизодам — <Link href="/ru/guides/smotret-serial-vmeste" className="text-[#7B72F8] hover:underline">смотреть сериал вместе</Link>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Как смотреть кино с другом — 4 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Откройте WeWatch', desc: 'Откройте веб-версию на iPhone, Android или компьютере; мобильные приложения разрабатываются.' },
                { n: 2, title: 'Добавьте фильм', desc: 'Вставьте ссылку YouTube, VK Видео, Rutube или прямую MP4-ссылку.' },
                { n: 3, title: 'Создайте комнату', desc: 'Нажмите "Создать комнату" и отправьте другу ссылку-приглашение.' },
                { n: 4, title: 'Смотрите вместе', desc: 'Друг переходит по ссылке — просмотр синхронизируется. Пишите в чат, ставьте эмодзи, обсуждайте каждую сцену.' },
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
            <h2 className="text-2xl font-bold text-white mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Читайте также</h2>
            <div className="flex flex-col gap-2">
              {RELATED.map(({ href, label }) => (
                <Link key={href} href={href} className="text-[#7B72F8] hover:underline text-sm">→ {label}</Link>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Кино с другом — прямо сейчас</h2>
            <p className="text-zinc-400 mb-6">Откройте WeWatch в браузере и начните совместный просмотр</p>
            <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Открыть веб-версию
            </Link>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/kino-s-drugom-onlayn" />
    </>
  );
}
