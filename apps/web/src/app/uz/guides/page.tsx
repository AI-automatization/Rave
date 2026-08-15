import type { Metadata } from 'next';
import Link from 'next/link';
import { guidesFor } from '@/data/guides';
import { socialMeta } from '@/lib/i18n/metadata';

const URL = 'https://wewatch.uz/uz/guides';

export const metadata: Metadata = {
  title: "WeWatch gaydlari — do'stlar bilan birgalikda tomosha qilish",
  description:
    "WeWatch gaydlari: YouTube, kino, serial va anime-ni do'stlaringiz bilan veb-versiyada sinxron tomosha qilish. iOS va Android ilovalari ishlab chiqilmoqda.",
  alternates: {
    canonical: URL,
    languages: {
      ru: 'https://wewatch.uz/ru/guides',
      uz: URL,
      'x-default': 'https://wewatch.uz/ru/guides',
    },
  },
  ...socialMeta({
    locale: 'uz',
    title: 'WeWatch gaydlari — birgalikda tomosha qilish',
    description: "Do'stlar bilan sinxron tomosha qilish bo'yicha bosqichma-bosqich gaydlar.",
    url: URL,
  }),
  robots: { index: true, follow: true },
};

const guides = guidesFor('uz');

// Ko'rinadigan ro'yxat va schema bitta massivdan quriladi — mos kelmaslik bo'lmaydi.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${URL}#page`,
      url: URL,
      name: 'WeWatch gaydlari',
      description: "Do'stlar bilan sinxron tomosha qilish bo'yicha gaydlar.",
      inLanguage: 'uz',
      isPartOf: { '@id': 'https://wewatch.uz/#website' },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: guides.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.title,
          url: `https://wewatch.uz${g.path}`,
        })),
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'WeWatch', item: 'https://wewatch.uz/uz' },
        { '@type': 'ListItem', position: 2, name: 'Gaydlar', item: URL },
      ],
    },
  ],
};

export default function UzGuidesHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-page text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
          <nav aria-label="Yo'l xaritasi" className="text-zinc-600 text-xs mb-6">
            <Link href="/uz" className="hover:text-zinc-400 transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-500">Gaydlar</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">WeWatch gaydlari</h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mb-10">
            YouTube, kino, serial va anime-ni do&apos;stlaringiz bilan qanday qilib sinxron tomosha
            qilish mumkin — bepul va brauzer kengaytmasisiz. Bir kishi pause bosadi — video
            xonadagi hammada to&apos;xtaydi.
          </p>

          <ul className="grid gap-4 sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.path}>
                <Link
                  href={g.path}
                  className="block h-full rounded-2xl border border-zinc-800/60 bg-[#0E0E14] px-6 py-5 hover:border-[#7B72F8]/40 transition-colors"
                >
                  <span className="block text-white font-semibold mb-1.5">{g.title}</span>
                  <span className="block text-zinc-500 text-sm leading-relaxed">{g.summary}</span>
                </Link>
              </li>
            ))}
          </ul>

          <section className="mt-12 rounded-2xl border border-zinc-800/60 bg-[#0E0E14] px-6 py-7">
            <h2 className="text-2xl font-bold mb-4">Birgalikda tomosha qilishni qanday boshlash kerak?</h2>
            <div className="space-y-4 text-zinc-400 leading-relaxed">
              <p>
                WeWatch&apos;ning veb-versiyasini kompyuter yoki telefon brauzerida oching, xona yarating
                va taklif havolasini do&apos;stlaringizga yuboring. Ishtirokchilar bir xil xonaga kirgach,
                videoni boshqarish sinxron ishlaydi: pauza, davom ettirish va vaqtni o&apos;zgartirish
                xonadagi barcha qurilmalarda moslashtiriladi.
              </p>
              <p>
                Alohida dastur yoki brauzer kengaytmasini o&apos;rnatish shart emas. Hozir xizmat Web
                platformasida ishlaydi; Android va iOS ilovalari ishlab chiqilmoqda. Barqaror tomosha
                uchun barcha ishtirokchilarga tez internet va yangilangan brauzerdan foydalanishni
                tavsiya qilamiz.
              </p>
              <p>
                Quyidagi gaydlarda YouTube, kino, serial va anime uchun alohida ko&apos;rsatmalar,
                xonaga ulanish tartibi hamda sinxronlash bilan bog&apos;liq keng tarqalgan savollarga
                javoblar berilgan.
              </p>
            </div>
          </section>

          <div className="mt-12 flex flex-wrap gap-4 text-sm">
            {/* Раньше здесь стоял русский /faq — узбекская версия появилась в T-S189. */}
            <Link href="/uz/faq" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
              Ko&apos;p so&apos;raladigan savollar →
            </Link>
            <Link href="/uz/how-it-works" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
              Qanday ishlaydi →
            </Link>
            {/* Явный переход на другой язык — подпись по-русски намеренно. */}
            <Link href="/ru/guides" hrefLang="ru" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
              Ruscha gaydlar →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
