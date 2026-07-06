import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Anime do'stlar bilan onlayn birgalikda ko'rish — bepul | WeWatch",
  description:
    "WeWatch orqali anime-ni do'stlaringiz bilan sinxron holda tomosha qiling. Bir kishi pause bosadi — hammaga to'xtaydi. Jujutsu Kaisen, One Piece, Attack on Titan — bepul.",
  keywords: [
    "anime birgalikda ko'rish",
    "anime do'stlar bilan onlayn",
    "anime watch party o'zbek",
    "anime birga tomosha",
    "jujutsu kaisen birga",
    "one piece birga ko'rish",
    "anime sinxron tomosha",
    "anime do'st bilan bepul",
    "o'zbek anime tomosha",
  ],
  alternates: {
    canonical: 'https://wewatch.uz/uz/guides/anime-birgalikda',
    languages: {
      'ru': 'https://wewatch.uz/guides/smotret-anime-vmeste',
      'uz': 'https://wewatch.uz/uz/guides/anime-birgalikda',
      'x-default': 'https://wewatch.uz/guides/smotret-anime-vmeste',
    },
  },
  openGraph: {
    title: "Anime birgalikda ko'rish — bepul | WeWatch",
    description:
      "Anime-ni do'stlaringiz bilan sinxron tomosha qiling. Bir kishi pause bosdi — hammaga to'xtaydi.",
    url: 'https://wewatch.uz/uz/guides/anime-birgalikda',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: "Anime do'stlar bilan onlayn birgalikda ko'rish",
  description: "WeWatch orqali anime-ni do'stlaringiz bilan sinxron holda tomosha qiling",
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-16',
  inLanguage: 'uz',
  mainEntityOfPage: 'https://wewatch.uz/uz/guides/anime-birgalikda',
};

const POPULAR_ANIME = [
  'Jujutsu Kaisen',
  'One Piece',
  'Attack on Titan',
  'Demon Slayer',
  'Naruto',
  'Dragon Ball',
  'My Hero Academia',
  'Death Note',
];

export default function AnimeBirgalikdaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/anime-birgalikda" className="hover:text-white transition-colors">
              Anime birgalikda
            </Link>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Anime do'stlar bilan birgalikda ko'rish
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Sevimli anime-ni do'stlaringiz bilan bir vaqtda tomosha qiling — sinxron, bepul va
            istagan joydan. Jujutsu Kaisen, One Piece, Attack on Titan — WeWatch orqali hammasi mumkin.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Nima uchun anime-ni birgalikda ko'rish kerak?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Anime tomosha qilish tajribasi do'stlar bilan bo'lganida butunlay boshqacha. Kulgili sahnalarda
              birga kulasiz, dramatik sahnalarda fikr almashashsiz, spoilerdan xavotir olmasiz — chunki
              hammangiz bir xil kadrni ko'ryapsiz.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch sinxron tomosha orqali bu tajribani onlayn qayta yaratadi. Siz Toshkentda, do'stingiz
              Samarqandda yoki Moskvada bo'lishi mumkin — muhim emas.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Qanday anime-larni birgalikda ko'rish mumkin?</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {POPULAR_ANIME.map((a) => (
                <span key={a} className="bg-zinc-800 text-zinc-300 text-sm px-3 py-1 rounded-full border border-zinc-700">
                  {a}
                </span>
              ))}
            </div>
            <p className="text-zinc-400 text-sm">
              VK Video, YouTube, Rutube va boshqa platformalardagi anime-larni WeWatch orqali sinxron tomosha
              qilish mumkin. Ichki brauzer yordamida istalgan saytni ochasiz.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Anime birgalikda qanday ko'riladi?</h2>
            <ol className="space-y-4">
              {[
                { n: '1', t: "WeWatch ilovasini yuklab oling", d: "App Store yoki Google Play'dan bepul." },
                { n: '2', t: "Xona yarating", d: "Bosh sahifada 'Xona yaratish' tugmasini bosing." },
                { n: '3', t: "Anime-ni toping", d: "Ichki brauzerni oching. VK Video, YouTube yoki boshqa saytda kerakli anime seriyasini toping." },
                { n: '4', t: "Do'stlarni taklif qiling", d: "Xona havolasini Telegram yoki WhatsApp orqali yuboring. Ular hech narsa yuklamasa ham kirishi mumkin." },
                { n: '5', t: "Birgalikda tomosha qiling", d: "Hammasi qo'shilgach play bosing. Sinxron tomosha boshlanadi." },
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
            <h2 className="text-2xl font-bold text-white mb-4">Ko'p so'raladigan savollar</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Qaysi saytlardagi anime-larni ko'rish mumkin?",
                  a: "VK Video, YouTube va boshqa ochiq platformalardagi anime-larni WeWatch orqali tomosha qilish mumkin.",
                },
                {
                  q: "Do'stim boshqa shaharda bo'lsa ham ishlaydi?",
                  a: "Ha. Toshkent, Samarqand, Moskva — internet bo'lsa bas. Masofa ta'sir qilmaydi.",
                },
                {
                  q: "Bir vaqtda nechta kishi tomosha qila oladi?",
                  a: "Bir xonada bir necha kishi bo'lishi mumkin. Hamma sinxron holda tomosha qiladi.",
                },
                {
                  q: "Seriya tugagach keyingisiga avtomatik o'tadimi?",
                  a: "Hozircha emas, lekin keyingi seriyaning havolasini joylashtirish juda tez. Bir kishi URL-ni o'zgartiradi — yangi seriya barchaga yuklanadi.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-2">{q}</div>
                  <div className="text-zinc-400 text-sm">{a}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/30 rounded-2xl p-8 text-center border border-purple-800/30 mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">Anime tomosha boshlang</h2>
            <p className="text-zinc-400 mb-6">Do'stlaringizni taklif qiling — bepul, ro'yxatsiz.</p>
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
              <Link href="/uz/guides/youtube-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">YouTube birgalikda →</Link>
              <Link href="/uz/guides/serial-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Serial birgalikda →</Link>
              <Link href="/guides/smotret-anime-vmeste" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
