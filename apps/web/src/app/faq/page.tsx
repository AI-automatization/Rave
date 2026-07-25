import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: 'FAQ — Часто задаваемые вопросы',
  description: 'Ответы на частые вопросы о WeWatch: как смотреть YouTube вместе, какие платформы поддерживаются, бесплатно ли приложение, как работает синхронизация.',
  keywords: [
    'wewatch faq', 'wewatch вопросы', 'как смотреть youtube вместе', 'watch party как работает',
    'смотреть вместе онлайн бесплатно', 'синхронный просмотр видео', 'watch party приложение бесплатно',
  ],
  // hreflang must be reciprocal — /en/faq points here, so this must point back,
  // otherwise Search Console reports "no return tag" and ignores the pairing.
  alternates: {
    canonical: `${APP_URL}/faq`,
    languages: hreflangFor('/faq', APP_URL),
  },
  openGraph: {
    title: 'FAQ — Часто задаваемые вопросы | WeWatch',
    description: 'Всё о WeWatch: синхронизация, поддерживаемые платформы, бесплатный тариф, iOS и Android.',
    url: 'https://wewatch.uz/faq',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    q: 'Как смотреть YouTube вместе с другом онлайн?',
    a: 'Скачайте WeWatch на iOS или откройте wewatch.uz в браузере. Нажмите «Создать комнату», вставьте ссылку на YouTube-видео и поделитесь ссылкой на комнату с другом. Как только друг заходит — начинается синхронный просмотр. Вы нажмёте паузу — видео встанет у всех одновременно.',
  },
  {
    q: 'Что такое watch party?',
    a: 'Watch party — это синхронный совместный просмотр видео через интернет. Несколько человек смотрят одно и то же видео в реальном времени, как будто сидят рядом. WeWatch синхронизирует воспроизведение: пауза, перемотка и старт происходят одновременно у всех участников комнаты.',
  },
  {
    q: 'Какие видеосервисы поддерживает WeWatch?',
    a: 'WeWatch поддерживает YouTube, VK Видео, Rutube, а также прямые .mp4 ссылки. В мобильном приложении доступен встроенный браузер для просмотра любого сайта с видео, включая Uzmove, Cinerama и другие.',
  },
  {
    q: 'WeWatch бесплатный?',
    a: 'Да, базовый план WeWatch полностью бесплатен. Вы можете создавать комнаты, приглашать друзей и смотреть видео вместе без ограничений по времени. Доступна Pro-подписка с расширенными функциями.',
  },
  {
    q: 'Работает ли WeWatch на Android?',
    a: 'iOS-версия доступна в App Store прямо сейчас. Android-версия находится в активной разработке и выйдет в ближайшее время. Веб-версия (wewatch.uz) работает в браузере на любом устройстве, включая Android.',
  },
  {
    q: 'Можно ли смотреть вместе с телефона и компьютера одновременно?',
    a: 'Да — это одна из ключевых фич WeWatch. Один человек может быть в комнате с iPhone, другой — с Android, третий — открыть wewatch.uz в браузере на компьютере. Синхронизация работает между всеми платформами в режиме реального времени.',
  },
  {
    q: 'Как работает синхронизация видео?',
    a: 'WeWatch измеряет смещение часов каждого участника относительно сервера по принципу NTP — через ping/echo по WebSocket. Команды воспроизведения не выполняются сразу при получении, а планируются на общую будущую метку времени, что компенсирует разницу в задержке сети. Периодический heartbeat сверяет позицию каждого клиента с позицией комнаты: расхождение свыше 500 мс исправляется автоматически.',
  },
  {
    q: 'Нужна ли регистрация для просмотра?',
    a: 'Для создания комнаты и управления воспроизведением нужна бесплатная регистрация. Если у вас есть ссылка на комнату — можно зайти как гость и смотреть без аккаунта.',
  },
  {
    q: 'Сколько человек может быть в одной комнате?',
    // Real limit: LIMITS.MAX_WATCH_PARTY_MEMBERS = 10 (shared/src/constants/index.ts)
    a: 'До 10 участников в одной комнате одновременно. Комната закрывается автоматически после 10 минут неактивности.',
  },
  {
    q: "Можно ли смотреть YouTube вместе с друзьями?",
    a: "Да, через приложение WeWatch или сайт wewatch.uz вы можете смотреть YouTube, VK Video и Rutube одновременно с друзьями. Создайте комнату, отправьте ссылку — синхронизация работает автоматически.",
  },
  {
    q: "Приложение для совместного просмотра бесплатно?",
    a: "Да, основной режим WeWatch полностью бесплатен. Создание комнат, приглашение друзей и совместный просмотр видео доступны без ограничений по времени.",
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="ru" />
      <div className="min-h-screen bg-[#060608] text-zinc-300">
        {/* Hero with a soft brand-purple glow behind the heading */}
        <div className="relative overflow-hidden border-b border-zinc-800/50">
          <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[120px]" />
          <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-14">
            <nav aria-label="Хлебные крошки" className="text-zinc-600 text-xs mb-6">
              <Link href="/" className="hover:text-zinc-400 transition-colors">WeWatch</Link>
              <span className="mx-2">/</span>
              <span className="text-zinc-500">FAQ</span>
            </nav>
            <p className="text-[#9B92FF] text-xs font-semibold uppercase tracking-[0.2em] mb-3">Справочный центр</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Часто задаваемые вопросы</h1>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
              Всё что нужно знать о WeWatch — синхронизация, поддерживаемые платформы, тарифы и технические детали.
            </p>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-6 py-14">
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <details key={i} className="group bg-[#0E0E14] border border-zinc-800/60 rounded-2xl overflow-hidden transition-colors hover:border-zinc-700/70 open:border-[#7B72F8]/40 open:bg-[#111118]">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none">
                  <h2 className="text-white font-semibold text-base leading-snug group-hover:text-white">{q}</h2>
                  <span className="shrink-0 w-7 h-7 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-open:bg-[#7B72F8] group-open:text-white group-open:rotate-45 transition-all duration-200 text-lg leading-none">+</span>
                </summary>
                <div className="px-6 pb-6 pt-0">
                  <p className="text-zinc-400 leading-7 text-sm border-t border-zinc-800/50 pt-4">{a}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-14 relative overflow-hidden bg-gradient-to-br from-[#141225] to-[#0E0E14] border border-[#7B72F8]/30 rounded-3xl px-8 py-10 text-center">
            <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[90px]" />
            <div className="relative">
              <p className="text-zinc-400 mb-1.5">Не нашли ответ?</p>
              <p className="text-white font-semibold text-xl mb-5">Напишите нам напрямую</p>
              <a
                href="mailto:support@wewatch.uz"
                className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6B62E8] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#7B72F8]/25"
              >
                support@wewatch.uz
              </a>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800/40">
            <p className="text-zinc-600 text-sm mb-4">Полезные гайды:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/guides/smotret-youtube-vmeste" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Как смотреть YouTube вместе →
              </Link>
              <Link href="/guides/watch-party-besplatno" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Что такое watch party →
              </Link>
              <Link href="/guides/kino-s-drugom-onlayn" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Смотреть кино с друзьями онлайн →
              </Link>
            </div>
          </div>
        </main>
      </div>
      <GuideFooter locale="ru" />
    </>
  );
}
