import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  title: "Do'stlar bilan onlayn kino ko'rish — bepul",
  description:
    "Do'stim bilan onlayn kino ko'rish mumkinmi? Ha — WeWatch orqali do'stlaringiz bilan istalgan filmni sinxron ko'ring. Biri telefonda, biri kompyuterda — bepul ishlaydi.",
  keywords: [
    "do'stlar bilan kino ko'rish",
    "do'stim bilan kino ko'rish onlayn",
    "birga kino ko'rish",
    "onlayn kino birgalikda",
    "do'stlar bilan film ko'rish onlayn",
    "kino birga ko'rish bepul",
    "onlayn kinoteatr do'stlar bilan",
    "masofadan birga kino ko'rish",
    "WeWatch kino",
  ],
  alternates: {
    canonical: 'https://wewatch.uz/uz/guides/kino-birgalikda',
    languages: {
      'ru': 'https://wewatch.uz/guides/kino-s-drugom-onlayn',
      'uz': 'https://wewatch.uz/uz/guides/kino-birgalikda',
      'x-default': 'https://wewatch.uz/guides/kino-s-drugom-onlayn',
    },
  },
  openGraph: {
    title: "Do'stlar bilan onlayn kino ko'rish — bepul | WeWatch",
    description:
      "Do'stingiz uzoqda bo'lsa ham birga kino ko'ring. Bir kishi pause bosadi — hammaga to'xtaydi. Bepul, iOS va Android.",
    url: 'https://wewatch.uz/uz/guides/kino-birgalikda',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: "Do'stlar bilan onlayn kino ko'rish — bepul",
      description:
        "WeWatch orqali do'stlaringiz bilan onlayn kino va filmlarni sinxron ko'rish bo'yicha qo'llanma",
      author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
      publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
      datePublished: '2026-07-07',
      inLanguage: 'uz',
      mainEntityOfPage: 'https://wewatch.uz/uz/guides/kino-birgalikda',
    },
    {
      '@type': 'HowTo',
      name: "Do'stim bilan onlayn kino qanday ko'raman?",
      description: "WeWatch orqali do'stlar bilan birga kino ko'rishni boshlash — 4 qadam",
      totalTime: 'PT2M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'WeWatch ilovasini yuklab oling',
          text: "App Store yoki Google Play'dan bepul yuklab oling.",
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Kinoni toping',
          text: "Ichki brauzerni oching va istalgan video-saytga o'ting — YouTube, VK, Rutube, Uzmove yoki boshqa sayt. Ko'rmoqchi bo'lgan kinoni toping.",
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Xona yarating',
          text: '«Xona yaratish» tugmasini bosing — WeWatch taklif havolasini beradi.',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: "Do'stingizni chaqiring",
          text: "Havolani Telegram yoki istalgan messenjerda yuboring. Do'stingiz havolaga o'tgach — kino hammada sinxron boradi.",
        },
      ],
    },
    {
      '@type': 'FAQPage',
      inLanguage: 'uz',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Do'stim bilan onlayn kino ko'rish mumkinmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Ha — WeWatch aynan shu uchun yaratilgan. Ilovani yuklab oling, kinoni toping, xona yarating va do'stingizga havola yuboring. Ikkalangiz bir xil kadrni bir vaqtda ko'rasiz, pause va oldinga o'tkazish hammaga birdan ishlaydi.",
          },
        },
        {
          '@type': 'Question',
          name: "Do'stlar bilan kino ko'rish bepulmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Ha, WeWatch to'liq bepul. App Store yoki Google Play'dan yuklab oling — pullik tarif yo'q.",
          },
        },
        {
          '@type': 'Question',
          name: "Biri telefonda, biri kompyuterda bo'lsa ham birga kino ko'rish mumkinmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Ha — WeWatch kross-platforma: iPhone, Android va kompyuter brauzeri bitta xonada sinxron ishlaydi. Qurilma turi muhim emas.",
          },
        },
        {
          '@type': 'Question',
          name: "Qaysi saytlardan kino ko'rish mumkin?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "WeWatch ichki brauzer orqali istalgan video-sayt bilan ishlaydi — YouTube, VK Video, Rutube, Uzmove, Cinerama va boshqalar.",
          },
        },
        {
          '@type': 'Question',
          name: "Do'stim boshqa shaharda yoki davlatda bo'lsa-chi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Masofa muhim emas — sinxronizatsiya internet orqali ishlaydi. Toshkentda va Moskvada bo'lsangiz ham bitta xonada birga kino ko'rasiz.",
          },
        },
      ],
    },
  ],
};

export default function KinoBirgalikdaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="uz" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/birgalikda-tomosha-qilish" className="hover:text-white transition-colors">
              Birgalikda tomosha
            </Link>
            <span className="mx-2">/</span>
            <span>Kino birgalikda</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Do'stlar bilan onlayn kino ko'rish — bepul
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Do'stingiz bilan kino ko'rmoqchisiz, lekin har xil joydasizmi? WeWatch buni hal qiladi —
            onlayn sinxron kino ko'rish, bepul, istalgan qurilmada. Go'yo yonma-yon o'tirgandek.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">WeWatch'ning boshqalardan farqi nimada?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Ko'pchilik watch party servislar bitta platformaga bog'langan (faqat Netflix yoki faqat YouTube).
              WeWatch esa ichki brauzer orqali <strong className="text-white">istalgan video-saytni</strong> ochadi —
              kinoni qayerdan bo'lsa ham birga ko'ring.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Yana bir afzallik — kross-platforma: siz iPhone'da, do'stingiz Android yoki noutbukda bo'lsa ham,
              sinxronizatsiya barcha qurilmalar o'rtasida bir vaqtda ishlaydi.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Do'stim bilan kino qanday ko'raman — 4 qadam</h2>
            <ol className="space-y-4">
              {[
                { n: '1', t: 'WeWatch ilovasini yuklab oling', d: "App Store (iPhone) yoki Google Play (Android) — bepul." },
                { n: '2', t: 'Kinoni toping', d: "Ichki brauzerni oching, istalgan video-saytga o'ting — YouTube, VK, Rutube, Uzmove yoki boshqa sayt." },
                { n: '3', t: 'Xona yarating', d: "«Xona yaratish» tugmasini bosing va do'stingizga taklif havolasini yuboring." },
                { n: '4', t: "Birga ko'ring", d: "Do'stingiz havolaga o'tadi — ko'rish sinxronlashadi. Chatda yozing, emoji tashlang, har sahnani muhokama qiling." },
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
            <h2 className="text-2xl font-bold text-white mb-4">Qanday qurilmalarda ishlaydi?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'iPhone / iPad', desc: 'iOS 15+, App Store' },
                { label: 'Android', desc: 'Android 8+, Google Play' },
                { label: 'Kompyuter', desc: 'Brauzer orqali (veb versiya)' },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-1">{label}</div>
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
                  q: "Do'stim bilan onlayn kino ko'rish mumkinmi?",
                  a: "Ha — WeWatch aynan shu uchun yaratilgan. Kinoni toping, xona yarating, havolani yuboring — ikkalangiz bir xil kadrni bir vaqtda ko'rasiz.",
                },
                {
                  q: "Bepulmi?",
                  a: "Ha, WeWatch to'liq bepul. Pullik tarif yo'q.",
                },
                {
                  q: "Biri telefonda, biri kompyuterda bo'lsa ham ishlaydimi?",
                  a: "Ha — iPhone, Android va kompyuter brauzeri bitta xonada sinxron ishlaydi. Qurilma turi muhim emas.",
                },
                {
                  q: "Do'stim boshqa shaharda bo'lsa-chi?",
                  a: "Masofa muhim emas — sinxronizatsiya internet orqali ishlaydi. Boshqa davlatda bo'lsa ham birga ko'rasiz.",
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
            <h2 className="text-2xl font-bold text-white mb-3">Hoziroq birga kino ko'ring</h2>
            <p className="text-zinc-400 mb-6">Bepul, istagan qurilmadan.</p>
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
              <Link href="/uz/guides/birgalikda-tomosha-qilish" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Birgalikda tomosha qilish →</Link>
              <Link href="/uz/guides/youtube-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">YouTube birgalikda →</Link>
              <Link href="/uz/guides/serial-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Serial birgalikda →</Link>
              <Link href="/guides/kino-s-drugom-onlayn" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="uz" />
    </>
  );
}
