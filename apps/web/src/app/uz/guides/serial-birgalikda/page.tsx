import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

export const metadata: Metadata = {
  title: "Serial do'stlar bilan birgalikda ko'rish onlayn — bepul",
  description:
    "WeWatch orqali seriallarni do'stlaringiz bilan onlayn sinxron tomosha qiling. Turkish seriallar, koreya dramalari, rus seriallar — bepul, ro'yxatdan o'tmasdan.",
  keywords: [
    "serial birgalikda ko'rish",
    "serial do'stlar bilan onlayn",
    "turk serial birgalikda",
    "koreya serial birgalikda",
    "serial watch party o'zbek",
    "serial sinxron tomosha",
    "serial birga ko'rish bepul",
    "turk seriallari birgalikda",
    "dorama birgalikda ko'rish",
    "birga serial korish",
    "serial birga korish",
    "turk serial birga korish",
  ],
  alternates: {
    canonical: 'https://wewatch.uz/uz/guides/serial-birgalikda',
    languages: {
      'ru': 'https://wewatch.uz/guides/smotret-serial-vmeste',
      'uz': 'https://wewatch.uz/uz/guides/serial-birgalikda',
      'x-default': 'https://wewatch.uz/guides/smotret-serial-vmeste',
    },
  },
  ...socialMeta({
    locale: 'uz',
    title: "Serial birgalikda ko'rish — bepul | WeWatch",
    description: "Seriallarni do'stlaringiz bilan sinxron tomosha qiling. Turk, koreya, rus seriallar — bepul.",
    url: 'https://wewatch.uz/uz/guides/serial-birgalikda',
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: "Serial do'stlar bilan birgalikda ko'rish onlayn",
  description: "WeWatch orqali seriallarni do'stlaringiz bilan sinxron holda tomosha qiling",
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-16',
  inLanguage: 'uz',
  mainEntityOfPage: 'https://wewatch.uz/uz/guides/serial-birgalikda',
};

export default function SerialBirgalikdaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="uz" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/serial-birgalikda" className="hover:text-white transition-colors">
              Serial birgalikda
            </Link>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Serial do'stlar bilan birgalikda ko'rish
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Turk seriallar, koreya dramalari yoki rus seriallar — WeWatch orqali istalgan serialni
            do'stlaringiz bilan sinxron holda tomosha qiling. Uzoqlikda bo'lsangiz ham, bir xil kadrni
            bir vaqtda ko'rasiz.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Qanday serial turlari mavjud?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Turk seriallar', desc: "Diriliş Ertuğrul, Qora Qush va boshqalar" },
                { label: 'Koreya dramalari', desc: "Squid Game, Crash Landing on You" },
                { label: "Xorijiy seriallar", desc: "Breaking Bad, Money Heist va b." },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-1">{label}</div>
                  <div className="text-sm text-zinc-400">{desc}</div>
                </div>
              ))}
            </div>
            <p className="text-zinc-400 text-sm">
              WeWatch ichki brauzeri orqali VK Video, YouTube va boshqa platformalardagi seriallarni
              ochib tomosha qilish mumkin.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Serial birgalikda ko'rish bosqichlari</h2>
            <ol className="space-y-4">
              {[
                { n: '1', t: "WeWatch ilovasini yuklab oling", d: "App Store yoki Google Play — bepul." },
                { n: '2', t: "Xona yarating", d: "'Xona yaratish' tugmasini bosing va nom bering." },
                { n: '3', t: "Serial saytini oching", d: "Ichki brauzerni oching, kerakli serialni VK yoki YouTube'dan toping." },
                { n: '4', t: "Do'stlaringizni taklif qiling", d: "Xona havolasini Telegram'dan yuboring. Do'stingiz havola orqali kiradi." },
                { n: '5', t: "Birgalikda tomosha qiling", d: "Play bosasiz — hammangiz bir vaqtda ko'rasiz. Pause — ham sinxron." },
              ].map(({ n, t, d }) => (
                <li key={n} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{n}</span>
                  <div>
                    <strong className="text-white">{t}</strong>
                    <p className="text-zinc-400 text-sm mt-1">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Nima uchun WeWatch qulay?</h2>
            <div className="space-y-3">
              {[
                "Sinxron pause — kimdir bosadi, hammaga ta'sir qiladi",
                "Demokratik kutish — internet sekinlashsa, server hammani kutadi",
                "Har qanday qurilmada — iPhone, Android, kompyuter",
                "Bepul va ro'yxatdan o'tmasdan do'stlaringizni taklif qilish mumkin",
                "Matn chat — tomosha paytida fikr almashish",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span className="text-zinc-400 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Ko'p so'raladigan savollar</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Turk seriallarini qayerdan topish mumkin?",
                  a: "VK Video va YouTube'da ko'plab turk seriallar tarjima bilan mavjud. WeWatch ichki brauzeri orqali ularni sinxron tomosha qilish mumkin.",
                },
                {
                  q: "Bir seriyadan keyingisiga o'tish osonmi?",
                  a: "Ha. Keyingi seriya havolasini xonaga joylashtirasiz — hammaga yangi video yuklanadi.",
                },
                {
                  q: "Tomosha paytida gaplashish mumkinmi?",
                  a: "Ha, xonada matn chat mavjud. Ovozli chat ham qo'shilmoqda.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-2">{q}</div>
                  <div className="text-zinc-400 text-sm">{a}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-2xl p-8 text-center border border-purple-800/30 mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">Serial tomosha boshlang</h2>
            <p className="text-zinc-400 mb-6">Do'stlaringizni taklif qiling — bepul, ro'yxatsiz.</p>
            <a
              href={appUrl('/register')}
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Xona yaratish
            </a>
          </div>

          <div className="border-t border-zinc-800 pt-8">
            <p className="text-zinc-500 text-sm mb-4">Boshqa maqolalar:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/uz/guides/birgalikda-tomosha-qilish" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Birgalikda tomosha →</Link>
              <Link href="/uz/guides/youtube-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">YouTube birgalikda →</Link>
              <Link href="/uz/guides/anime-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Anime birgalikda →</Link>
              <Link href="/uz/guides/kino-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Kino birgalikda →</Link>
              <Link href="/guides/smotret-serial-vmeste" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="uz" currentPath="/uz/guides/serial-birgalikda" />
    </>
  );
}
