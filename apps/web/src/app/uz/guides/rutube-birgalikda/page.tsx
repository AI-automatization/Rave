import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideRoomMockup, GuideFAQ } from '@/components/common/GuideArticleUI';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/guides/rutube-birgalikda';

export const metadata: Metadata = {
  title: "Rutube-ni do'st bilan birgalikda ko'rish — sinxron",
  description:
    "WeWatch veb-versiyasi orqali Rutube videolarini do'stingiz bilan sinxron tomosha qiling. Ro'yxatdan o'tish va kengaytma shart emas.",
  keywords: [
    "rutube birgalikda ko'rish",
    "rutube birga korish",
    "rutube watch party o'zbek",
    "рутуб биргаликда",
    "rutube sinxron tomosha",
    "do'st bilan rutube ko'rish",
    "rutube birga onlayn",
    "rutube birgalikda tomosha",
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: "Rutube birgalikda ko'rish — bepul | WeWatch",
    description: "Rutube-ni do'stingiz bilan sinxron tomosha qiling. Bir kishi pause bosdi — hammaga to'xtaydi.",
    url: `https://wewatch.uz${PATH}`,
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

/**
 * Rendered as the visible FAQ and published as FAQPage from this one array — the
 * same rule the guide registry follows, so the schema cannot drift from the page.
 * seo-geo-aeo.spec.ts asserts every question and answer appears in the visible HTML.
 */
const FAQS = [
  {
    q: 'Rutube akkaunti kerakmi?',
    a: "Yo'q. Ochiq Rutube videolari kirishsiz ochiladi — akkaunt shart emas.",
  },
  {
    q: 'Brauzer kengaytmasi (extension) kerakmi?',
    a: "Yo'q. WeWatch veb-versiyasida ishlaydi, hech qanday kengaytma o'rnatish shart emas.",
  },
  {
    q: 'Bepulmi?',
    a: "Ha, WeWatch'ning asosiy birgalikda ko'rish funksiyalari bepul.",
  },
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

export default function RutubeBirgalikdaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="guide-page flex-1 bg-page text-white">
        <div className="page-hero shell relative pt-16 pb-8">
          <nav className="text-sm text-zinc-500">
            <Link href="/uz" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/rutube-birgalikda" className="hover:text-white transition-colors">
              Rutube birgalikda
            </Link>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1>Rutube-ni do'st bilan birgalikda ko'rish</h1>
              <p>
                WeWatch orqali Rutube videolarini do'stingiz bilan onlayn sinxron holda tomosha qiling.
                Kengaytma yoki ro'yxat shart emas — bitta havola yetadi. Masofa muhim emas.
              </p>
            </div>
            <GuideRoomMockup locale="uz" photo="girl-laptop" priority />
          </div>
        </div>

        <div className="article shell py-12">

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Nima uchun oddiy Rutube link yubormaysiz?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Odatda Rutube havolasini yuborsangiz, ikkovingiz bir xil videoni ochasiz, lekin sinxron emas:
              biri oldinda, ikkinchisi orqada. Bir vaqtda tomosha qilib bo'lmaydi.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch Rutube oqimini olib, hamma uchun bitta ijro vaqtini ushlab turadi — hamma bir xil kadrni
              bir vaqtda ko'radi. Kimdir internet tufayli kechiksa, server hammani kutib turadi.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Rutube-ni birgalikda qanday ko'rish mumkin?</h2>
            <ol className="space-y-4">
              {[
                { n: '1', t: "WeWatch'ni oching", d: "wewatch.uz'ni brauzerda oching; iOS va Android ilovalari ishlab chiqilmoqda." },
                { n: '2', t: 'Rutube videoni toping', d: 'WeWatch brauzerida Rutube-ni oching va kerakli videoni tanlang.' },
                { n: '3', t: 'Yangi xona yarating', d: "'Xona yaratish' tugmasini bosing va taklif havolasini do'stingizga yuboring." },
                { n: '4', t: 'Birgalikda tomosha boshlang', d: "Do'stingiz qo'shilgach play bosing — WeWatch Rutube oqimini hammada sinxron ushlaydi." },
              ].map(({ n, t, d }) => (
                <li key={n} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{n}</span>
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
                { title: 'Sinxron tomosha', desc: 'Bir kadr — bir vaqtda. Server barcha ishtirokchilarni sinxronlashtiradi.' },
                { title: 'Kengaytmasiz', desc: "Hech qanday brauzer kengaytmasi o'rnatish shart emas — to'g'ridan-to'g'ri veb-versiyada." },
                { title: 'Har qanday qurilma', desc: 'iPhone, Android yoki kompyuter brauzerida ishlaydi; mobil ilovalar ishlab chiqilmoqda.' },
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
            <GuideFAQ items={FAQS.map(({ q, a }) => ({ q, a }))} />
          </section>

          <div className="bg-gradient-to-r from-sky-900/30 to-purple-900/30 rounded-2xl p-8 text-center border border-sky-800/20 mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">Do'stingiz bilan Rutube ko'ring</h2>
            <p className="text-zinc-400 mb-6">Hoziroq bepul boshlang — ro'yxatdan o'tish shart emas.</p>
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
              <Link href="/uz/guides/vk-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">VK Video birgalikda →</Link>
              <Link href="/uz/guides/youtube-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">YouTube birgalikda →</Link>
              <Link href="/uz/guides/birgalikda-tomosha-qilish" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Birgalikda tomosha →</Link>
              <Link href="/ru/guides/smotret-rutube-vmeste" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="uz" currentPath="/uz/guides/rutube-birgalikda" />
    </>
  );
}
