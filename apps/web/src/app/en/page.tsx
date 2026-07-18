import type { Metadata } from 'next';
import { LandingContent } from '../LandingContent';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

const LANGUAGES = {
  'x-default': APP_URL,
  'ru': APP_URL,
  'uz': `${APP_URL}/uz`,
  'en': `${APP_URL}/en`,
};

export const metadata: Metadata = {
  title: { absolute: 'WeWatch — Watch Videos Together With Friends Online | Free Watch Party' },
  description:
    'WeWatch — watch YouTube, VK and Rutube together with friends in real time. One on iPhone, another on the web — sync just works. Free watch party with chat and emoji. iOS and Android.',
  alternates: {
    canonical: `${APP_URL}/en`,
    languages: LANGUAGES,
  },
  openGraph: {
    title: 'WeWatch — Watch Videos Together With Friends Online',
    description:
      'Free watch party — watch YouTube, VK, Rutube with friends in real time. Sync, chat, emoji. iOS and Android.',
    url: `${APP_URL}/en`,
    locale: 'en_US',
    images: [{ url: '/og-image', width: 1200, height: 630, alt: 'WeWatch — watch videos together with friends online free' }],
  },
  // Full twitter block: Next.js replaces (not deep-merges) the root layout's
  // Russian twitter metadata, so card/site/images must be repeated here.
  twitter: {
    card: 'summary_large_image',
    site: '@wewatch_app',
    creator: '@wewatch_app',
    title: 'WeWatch — Watch Videos Together With Friends',
    description:
      'Free watch party — YouTube, VK, Rutube in sync with friends. Chat, emoji. iOS and Android.',
    images: ['/og-image'],
  },
  robots: { index: true, follow: true },
};

export default function EnHomePage() {
  return <LandingContent />;
}
