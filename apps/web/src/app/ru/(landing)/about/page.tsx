import type { Metadata } from 'next';
import { AboutContent } from '@/components/landing/AboutContent';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'О WeWatch — совместный просмотр видео онлайн' },
  description:
    'WeWatch — веб-сервис для совместного просмотра YouTube, VK и Rutube с друзьями онлайн. Приложения для iOS и Android находятся в разработке.',
  alternates: {
    canonical: `${APP_URL}/ru/about`,
    languages: hreflangFor('/ru/about', APP_URL),
  },
  openGraph: {
    title: 'О WeWatch',
    description: 'WeWatch — бесплатный веб watch party. Приложения для iOS и Android находятся в разработке.',
    url: `${APP_URL}/ru/about`,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${APP_URL}/ru/about`,
  url: `${APP_URL}/ru/about`,
  name: 'О WeWatch',
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

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AboutContent />
    </>
  );
}
