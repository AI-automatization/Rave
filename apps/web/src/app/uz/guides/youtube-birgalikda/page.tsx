import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  title: "YouTube-ni do'st bilan onlayn birgalikda ko'rish — bepul",
  description:
    "WeWatch orqali YouTube videolarini do'stingiz bilan sinxron holda tomosha qiling. Bir kishi pause bosadi — hammaga to'xtaydi. iPhone, Android, kompyuter — bepul.",
  keywords: [
    "youtube birgalikda ko'rish",
    "youtube do'st bilan onlayn",
    "youtube watch party o'zbek",
    "youtube birgalikda tomosha",
    "ютуб биргаликда",
    "youtube sinxron tomosha",
    "do'st bilan youtube ko'rish bepul",
    "youtube birga onlayn",
  ],
  alternates: {
    canonical: 'https://wewatch.uz/uz/guides/youtube-birgalikda',
    languages: {
      'ru': 'https://wewatch.uz/guides/smotret-youtube-vmeste',
      'uz': 'https://wewatch.uz/uz/guides/youtube-birgalikda',
      'x-default': 'https://wewatch.uz/guides/smotret-youtube-vmeste',
    },
  },
  openGraph: {
    title: "YouTube birgalikda ko'rish — bepul | WeWatch",
    description:
      "YouTube-ni do'stingiz bilan sinxron tomosha qiling. Bir kishi pause bosdi — hammaga to'xtaydi.",
    url: 'https://wewatch.uz/uz/guides/youtube-birgalikda',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: "YouTube-ni do'st bilan onlayn birgalikda ko'rish",
  description: "WeWatch orqali YouTube videolarini do'stingiz bilan sinxron holda tomosha qiling",
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-16',
  inLanguage: 'uz',
  mainEntityOfPage: 'https://wewatch.uz/uz/guides/youtube-birgalikda',
};

export default function YoutubeBirgalikdaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="uz" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/youtube-birgalikda" className="hover:text-white transition-colors">
              YouTube birgalikda
            </Link>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            YouTube-ni do'st bilan onlayn birgalikda ko'rish
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch orqali YouTube videolarini do'stingiz yoki sevimli odamingiz bilan onlayn sinxron holda
            tomosha qiling. Pause bosasiz — u ham to'xtaydi. Tezlatishingiz — u ham tezlashadi.
            Masofa muhim emas.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Nima uchun oddiy YouTube link yubormaysiz?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Odatda link yuborsangiz, ikkovingiz bir xil videoni ochasiz, lekin sinxron emas: biri 10 sekund
              oldinda, ikkinchisi orqada. Gaplashib bo'lmaydi, kulgili sahnani bir vaqtda ko'rmaysiz.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch bu muammoni hal qiladi — server orqali sinxronlashtiradi. Hamma bir xil kadrni ko'radi.
              Kimdir internet tufayli kechiksa — server hammani kutib turadi.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">YouTube-ni birgalikda qanday ko'rish mumkin?</h2>
            <ol className="space-y-4">
              {[
                { n: '1', t: "WeWatch ilovasini oching", d: "App Store yoki Google Play'dan yuklab oling — bepul." },
                { n: '2', t: "Yangi xona yarating", d: "'Xona yaratish' tugmasini bosing va istalgan nom bering." },
                { n: '3', t: "YouTube videosini toping", d: "Ichki brauzerni oching, YouTube'da kerakli videoni toping va 'Shu yerda ko'r' tugmasini bosing." },
                { n: '4', t: "Do'stingizni taklif qiling", d: "Xona havolasini Telegram yoki WhatsApp orqali yuboring." },
                { n: '5', t: "Birgalikda tomosha boshlang", d: "Do'stingiz qo'shilgach play bosing — ikkovingiz bir vaqtda tomosha qilasiz." },
              ].map(({ n, t, d }) => (
                <li key={n} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{n}</span>
                  <div>
                    <strong className="text-white">{t}</strong>
                    <p className="text-zinc-400 text-sm mt-1">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Afzalliklari</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Sinxron tomosha', desc: "Bir kadr — bir vaqtda. Server barcha ishtirokchilarni sinxronlashtiradi." },
                { title: "Bepul va ro'yxatsiz", desc: "Xona yaratuvchi ro'yxatdan o'tadi, do'stingiz shunchaki havola orqali kiradi." },
                { title: 'Har qanday qurilma', desc: 'iPhone, Android yoki kompyuter — farq qilmaydi.' },
                { title: 'Demokratik pause', desc: "Kimdir internet tufayli to'xtatsa — server hammani kutib turadi." },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-2">{title}</div>
                  <div className="text-sm text-zinc-400">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Ko'p so'raladigan savollar</h2>
            <div className="space-y-4">
              {[
                {
                  q: "YouTube Premium kerakmi?",
                  a: "Yo'q. WeWatch oddiy YouTube videolari bilan ishlaydi — Premium shart emas.",
                },
                {
                  q: "Do'stim boshqa shaharda bo'lsa ham ishlaydi?",
                  a: "Ha, internet bo'lsa bas. Toshkent, Samarqand, Moskva — farqi yo'q.",
                },
                {
                  q: "Chatda gaplashish mumkinmi?",
                  a: "Ha. WeWatch xonasida matn chat mavjud, tomosha paytida xabar yozish mumkin.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-2">{q}</div>
                  <div className="text-zinc-400 text-sm">{a}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-r from-red-900/30 to-purple-900/30 rounded-2xl p-8 text-center border border-red-800/20 mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">Do'stingiz bilan YouTube ko'ring</h2>
            <p className="text-zinc-400 mb-6">Hoziroq bepul boshlang — ro'yxatdan o'tish shart emas.</p>
            <Link
              href="/register"
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Xona yaratish
            </Link>
          </div>

          <div className="border-t border-zinc-800 pt-8">
            <p className="text-zinc-500 text-sm mb-4">Boshqa maqolalar:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/uz/guides/birgalikda-tomosha-qilish" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Birgalikda tomosha →</Link>
              <Link href="/uz/guides/kino-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Kino birgalikda →</Link>
              <Link href="/uz/guides/anime-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Anime birgalikda →</Link>
              <Link href="/uz/guides/serial-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Serial birgalikda →</Link>
              <Link href="/guides/smotret-youtube-vmeste" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="uz" currentPath="/uz/guides/youtube-birgalikda" />
    </>
  );
}
