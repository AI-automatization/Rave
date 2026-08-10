import type { Metadata } from 'next';
import { AboutContent } from '@/components/landing/AboutContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: "WeWatch haqida — videoni birga onlayn ko'rish" },
  description:
    "WeWatch — YouTube, VK va Rutube'ni do'stlar bilan onlayn birga ko'rish uchun veb-servis. iOS va Android ilovalari ishlab chiqilmoqda.",
  alternates: {
    canonical: `${APP_URL}/uz/about`,
    languages: hreflangFor('/ru/about', APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'WeWatch haqida',
    description: "WeWatch — bepul veb watch party. iOS va Android ilovalari ishlab chiqilmoqda.",
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
    '@type': 'SoftwareApplication',
    name: 'WeWatch',
    url: APP_URL,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
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
