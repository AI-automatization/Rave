import type { Metadata } from 'next';
import { FeaturesContent } from '@/components/landing/FeaturesContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'WeWatch Features — Watch Party, Sync Playback & Live Chat' },
  description:
    'Everything WeWatch does — watch party, sync playback, live chat, achievements and notifications. Watch YouTube, VK and Rutube together with friends, free.',
  alternates: {
    canonical: `${APP_URL}/en/features`,
    languages: hreflangFor('/ru/features', APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'WeWatch Features',
    description: 'Watch party, sync playback, live chat and emoji reactions — watch videos together, free.',
    url: `${APP_URL}/en/features`,
  }),
  robots: { index: true, follow: true },
};

export default function EnFeaturesPage() {
  return <FeaturesContent />;
}
