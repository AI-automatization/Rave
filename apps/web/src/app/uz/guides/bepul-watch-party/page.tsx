import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/guides/bepul-watch-party';

export const metadata: Metadata = {
  title: 'Bepul Watch Party — qanday boshlash 2026',
  description:
    "Bepul veb Watch Party: do'stlar bilan YouTube, VK Video va Rutube'ni sinxron ko'ring. iOS va Android ilovalari ishlab chiqilmoqda.",
  keywords: [
    'bepul watch party',
    'watch party onlayn',
    "watch party qanday yaratiladi",
    "birgalikda tomosha bepul",
    "onlayn kino kechasi bepul",
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'Bepul Watch Party — qanday boshlash 2026 | WeWatch',
    description: "Bepul veb watch party — YouTube, VK va Rutube'ni sinxron ko'rish. iOS va Android ilovalari ishlab chiqilmoqda.",
    url: 'https://wewatch.uz/uz/guides/bepul-watch-party',
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const VERIFIED_FACTS = [
  "Birgalikda tomosha qilishning asosiy funksiyalari bepul",
  "YouTube, VK Video, Rutube va to'g'ridan-to'g'ri MP4 havolalari qo'llab-quvvatlanadi",
  "Veb-versiya telefon va kompyuter brauzerlarida ishlaydi",
  "Bitta xonada 10 tagacha ishtirokchi bo'lishi mumkin",
  "Xonada chat va emoji-reaksiyalar mavjud",
  "iOS va Android ilovalari ishlab chiqilmoqda",
];

const RELATED = [
  { href: '/uz/guides/birgalikda-tomosha-qilish', label: 'Birgalikda tomosha qilish' },
  { href: '/uz/pricing', label: 'WeWatch tariflari' },
  { href: '/uz/guides/youtube-birgalikda', label: 'YouTube birgalikda' },
];

/**
 * Rendered as the visible FAQ and published as FAQPage from this one array, so the
 * schema cannot drift from the page. Answers stay inside what
 * src/data/product-facts.ts actually asserts (verified 2026-08-06): core watch
 * party is free, Pro is `planned` with `purchaseAvailability: 'unavailable'` and
 * no published price — same constraint the RU counterpart follows.
 */
const FAQS = [
  { q: "WeWatch'da nima bepul?", a: "Birgalikda tomoshaning asosiy funksiyalari: xona, sinxron ijro, chat va reaksiyalar. Pro tarif hozircha tayyorlanmoqda — narxi e'lon qilinmagan, sotib olib bo'lmaydi." },
  { q: "Boshlash uchun karta kerakmi?", a: "Yo'q. WeWatch'da hozircha to'lov ulanmagan — xona yaratgach darhol tomosha qilishni boshlash mumkin." },
  { q: "Tomosha vaqtiga cheklov bormi?", a: "Davomiylikka cheklov yo'q. Xona faqat ishtirokchilar 10 daqiqa faolsiz bo'lganda avtomatik yopiladi." },
  { q: "Bepul nechta odamni taklif qilish mumkin?", a: "Bitta xonada 10 tagacha ishtirokchi — bu xonaning cheklovi, tarifning emas." },
  { q: "Qaysi video manbalar qo'llab-quvvatlanadi?", a: "YouTube, VK Video, Rutube va to'g'ridan-to'g'ri MP4 havolalari. Videoning o'ziga kirish tanlangan manba qoidalariga bog'liq." },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'uz',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function BepulWatchPartyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-page text-white">
        <div className="article max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/uz" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/birgalikda-tomosha-qilish" className="hover:text-white transition-colors">Birgalikda tomosha</Link>
            <span className="mx-2">/</span>
            <span>Bepul Watch Party</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Bepul Watch Party — 2026-da qanday boshlash
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch'ning asosiy watch party funksiyalari veb-versiyada bepul. YouTube, VK Video, Rutube va to&apos;g&apos;ridan-to&apos;g&apos;ri MP4 havolalari qo&apos;llab-quvvatlanadi; iOS va Android ilovalari ishlab chiqilmoqda.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">WeWatch'ning bepul Watch Party'sida nima mavjud</h2>
            <p className="text-zinc-400 leading-relaxed">
              Quyida faqat joriy veb-versiya tomonidan tasdiqlangan funksiya va cheklovlar keltirilgan. Raqobatchilar bilan solishtirish sanalangan tadqiqot va tekshiriladigan manbalarsiz e&apos;lon qilinmaydi.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Tasdiqlangan imkoniyatlar</h2>
            <ul className="space-y-3 text-zinc-400 text-sm">
              {VERIFIED_FACTS.map((fact) => <li key={fact}>✅ {fact}</li>)}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Ko&apos;p so&apos;raladigan savollar</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-2">{q}</div>
                  <div className="text-zinc-400 text-sm">{a}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Shuningdek o&apos;qing</h2>
            <div className="flex flex-col gap-2">
              {RELATED.map(({ href, label }) => (
                <Link key={href} href={href} className="text-purple-400 hover:underline text-sm">→ {label}</Link>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-2xl p-8 text-center border border-purple-800/30 mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">Bepul Watch Party'ni hoziroq boshlang</h2>
            <p className="text-zinc-400 mb-6">Bepul veb-versiyani oching; iOS va Android ilovalari ishlab chiqilmoqda</p>
            <a
              href={appUrl('/register')}
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Veb-versiyani ochish
            </a>
          </div>

          <div className="border-t border-zinc-800 pt-8">
            <Link href="/ru/guides/watch-party-besplatno" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="uz" currentPath="/uz/guides/bepul-watch-party" />
    </>
  );
}
