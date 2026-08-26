import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideHeroWide, GuideCTA } from '@/components/common/GuideArticleUI';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

export const metadata: Metadata = {
  title: "Onlayn birgalikda tomosha qilish — do'stlar bilan bepul",
  description:
    "WeWatch veb-versiyasida do'stlar bilan film, serial va videolarni sinxron tomosha qiling. iOS va Android ilovalari ishlab chiqilmoqda.",
  keywords: [
    "birgalikda tomosha qilish",
    "onlayn birgalikda tomosha",
    "do'stlar bilan film ko'rish",
    "sinxron tomosha qilish",
    "birga kino ko'rish onlayn",
    "bepul watch party",
    "onlayn kinoteatr do'stlar bilan",
    "WeWatch o'zbek",
    "film do'st bilan onlayn",
    "birga korish",
    "birga tomosha qilish",
    "do'st bilan birga korish",
  ],
  alternates: {
    canonical: 'https://wewatch.uz/uz/guides/birgalikda-tomosha-qilish',
    languages: {
      'ru': 'https://wewatch.uz/ru/guides/smotret-vmeste-onlayn',
      'uz': 'https://wewatch.uz/uz/guides/birgalikda-tomosha-qilish',
      'x-default': 'https://wewatch.uz/ru/guides/smotret-vmeste-onlayn',
    },
  },
  ...socialMeta({
    locale: 'uz',
    title: "Onlayn birgalikda tomosha qilish — bepul | WeWatch",
    description: "Do'stlaringiz bilan istagan filmni onlayn sinxron tomosha qiling. Bir kishi pause bosadi — hammaga to'xtaydi.",
    url: 'https://wewatch.uz/uz/guides/birgalikda-tomosha-qilish',
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      inLanguage: 'uz',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'WeWatch bepulmi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Asosiy sinxron tomosha funksiyalari bepul. Xona yaratish uchun akkaunt kerak, mehmon esa taklif havolasi orqali akkauntsiz qo'shilishi mumkin.",
          },
        },
        {
          '@type': 'Question',
          name: "Do'stimga ilova kerakmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Yo'q. Hozir barcha ishtirokchilar veb-versiyani brauzerda ochadi; iOS va Android ilovalari ishlab chiqilmoqda.",
          },
        },
        {
          '@type': 'Question',
          name: "Qancha kishi birgalikda tomosha qila oladi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Bir xonada bir necha kishi bo'lishi mumkin. Hamma bir xil videoni sinxron holda ko'radi.",
          },
        },
        {
          '@type': 'Question',
          name: "Internet tezligi qancha bo'lishi kerak?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oddiy video uchun 5 Mbit/s yetarli. HD video uchun 15-25 Mbit/s tavsiya etiladi.',
          },
        },
      ],
    },
  ],
};

export default function BirgalikdaTomashaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="guide-page flex-1 bg-page text-white">
        <div className="page-hero shell relative pt-16 pb-8">
          <nav className="text-sm text-zinc-500">
            <Link href="/uz" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/birgalikda-tomosha-qilish" className="hover:text-white transition-colors">
              Birgalikda tomosha
            </Link>
          </nav>

          <GuideHeroWide locale="uz" photo="group-watch">
            <h1>Onlayn birgalikda tomosha qilish — bepul</h1>
            <p>
          WeWatch — do'stlaringiz bilan istagan film, serial yoki videoni onlayn sinxron tomosha qiling.
          Bir kishi pause bosadi — hammaga to'xtaydi. Uzoqlik muhim emas.
            </p>
          </GuideHeroWide>
        </div>

        <div className="article shell py-12">

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Birgalikda onlayn tomosha qilish nima?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Birgalikda onlayn tomosha (watch party) — bu internet orqali bir necha kishi uchun videoni bir vaqtda
              sinxron ko'rsatish. Har bir ishtirokchi bir xil kadrni bir xil vaqtda ko'radi. Kimdir tezlatsa yoki
              pause bossa — bu o'zgarish hammaga birdan ta'sir qiladi.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch bu jarayonni oddiy qiladi: veb-versiyani oching, istalgan videoni
              toping va xona yarating. Do'stlaringiz taklif havolasiga o'tadilar — va siz birgalikda tomosha
              qilasiz, go'yo yonma-yon o'tirgandek.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Qanday boshlash kerak?</h2>
            <ol className="space-y-4">
              {[
                { n: '1', t: "WeWatch'ni oching", d: "wewatch.uz'ni brauzerda bepul oching; mobil ilovalar ishlab chiqilmoqda." },
                { n: '2', t: "Xona yarating", d: "Bosh sahifada «Xona yaratish» tugmasini bosing. Istalgan nom bering." },
                { n: '3', t: "Video qo'shing", d: "YouTube, VK Video, Rutube yoki to'g'ridan-to'g'ri MP4 havolasini kiriting." },
                { n: '4', t: "Do'stlarni taklif qiling", d: "Xona havolasini WhatsApp, Telegram yoki SMS orqali yuboring." },
                { n: '5', t: "Birgalikda tomosha qiling", d: "Do'stlaringiz qo'shilgandan so'ng play tugmasini bosing — sinxron tomosha boshlanadi." },
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
                { label: 'iPhone / iPad', desc: 'Veb-brauzer; iOS ilovasi ishlab chiqilmoqda' },
                { label: 'Android', desc: 'Veb-brauzer; Android ilovasi ishlab chiqilmoqda' },
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
                  q: "WeWatch bepulmi?",
                  a: "Asosiy sinxron tomosha funksiyalari bepul. Xona yaratish uchun akkaunt kerak, mehmon esa taklif havolasi orqali akkauntsiz qo'shilishi mumkin.",
                },
                {
                  q: "Do'stimga ilova kerakmi?",
                  a: "Yo'q. Hozir barcha ishtirokchilar veb-versiyani brauzerda ochadi; iOS va Android ilovalari ishlab chiqilmoqda.",
                },
                {
                  q: "Qancha kishi birgalikda tomosha qila oladi?",
                  a: "Bir xonada bir necha kishi bo'lishi mumkin. Hamma bir xil videoni sinxron holda ko'radi.",
                },
                {
                  q: "Internet tezligi qancha bo'lishi kerak?",
                  a: "Oddiy video uchun 5 Mbit/s yetarli. HD video uchun 15-25 Mbit/s tavsiya etiladi.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-2">{q}</div>
                  <div className="text-zinc-400 text-sm">{a}</div>
                </div>
              ))}
            </div>
          </section>

          <GuideCTA title="Hoziroq boshlang" subtitle="Bepul, ro'yxatsiz, istagan qurilmadan.">
            <a
              href={appUrl('/register')}
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Xona yaratish
            </a>
          </GuideCTA>

          <div className="border-t border-zinc-800 pt-8">
            <p className="text-zinc-500 text-sm mb-4">Boshqa maqolalar:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/uz/guides/kino-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Kino birgalikda →</Link>
              <Link href="/uz/guides/youtube-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">YouTube birgalikda →</Link>
              <Link href="/uz/guides/anime-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Anime birgalikda →</Link>
              <Link href="/uz/guides/serial-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Serial birgalikda →</Link>
              <Link href="/uz/use-cases/masofadagi-juftlik" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Masofadan birga ko'rish →</Link>
              <Link href="/uz/use-cases/onlayn-uchrashuv" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Onlayn uchrashuv →</Link>
              <Link href="/ru/guides/smotret-vmeste-onlayn" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="uz" currentPath="/uz/guides/birgalikda-tomosha-qilish" />
    </>
  );
}
