import type { Metadata } from 'next';
import { AboutContent } from './AboutContent';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'О WeWatch — бесплатное приложение для совместного просмотра видео' },
  description:
    'WeWatch — бесплатное приложение для совместного просмотра YouTube, VK и Rutube с друзьями онлайн. iOS, Android и Web. Создано tezcode.dev в Ташкенте.',
  alternates: { canonical: `${APP_URL}/about` },
  openGraph: {
    title: 'О WeWatch',
    description: 'WeWatch — бесплатный watch party для iOS, Android и Web. Смотри видео синхронно с друзьями.',
    url: `${APP_URL}/about`,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${APP_URL}/about`,
  url: `${APP_URL}/about`,
  name: 'О WeWatch',
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

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AboutContent />
    </>
  );
}
