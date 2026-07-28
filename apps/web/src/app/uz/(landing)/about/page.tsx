import type { Metadata } from 'next';
import { AboutContent } from '@/app/(landing)/about/AboutContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: "WeWatch haqida — birga video ko'rish uchun bepul ilova" },
  description:
    "WeWatch — YouTube, VK va Rutube'ni do'stlar bilan onlayn birga ko'rish uchun bepul ilova. iOS, Android va Web. Toshkentdagi tezcode.dev tomonidan yaratilgan.",
  alternates: {
    canonical: `${APP_URL}/uz/about`,
    languages: hreflangFor('/about', APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'WeWatch haqida',
    description: "WeWatch — iOS, Android va Web uchun bepul watch party. Do'stlar bilan sinxron ko'r.",
    url: `${APP_URL}/uz/about`,
  }),
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${APP_URL}/uz/about`,
  url: `${APP_URL}/uz/about`,
  name: 'WeWatch haqida',
  inLanguage: 'uz',
  about: {
    '@type': 'MobileApplication',
    name: 'WeWatch',
    url: APP_URL,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'iOS, Android',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: {
      '@type': 'Organization',
      name: 'tezcode.dev',
      url: 'https://www.tezcode.dev/',
    },
  },
};

export default function UzAboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AboutContent />
    </>
  );
}
