import type { Metadata } from 'next';
import { FeaturesContent } from '@/app/(landing)/features/FeaturesContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'WeWatch Features — Watch Party, Battle Mode, Live Chat' },
  description:
    'Everything WeWatch does — watch party, Battle Mode, achievements and notifications. Watch YouTube, VK and Rutube with friends in sync, free.',
  alternates: {
    canonical: `${APP_URL}/en/features`,
    languages: hreflangFor('/features', APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'WeWatch Features',
    description: 'Watch party, Battle Mode, chat and emoji reactions — all free.',
    url: `${APP_URL}/en/features`,
  }),
  robots: { index: true, follow: true },
};

export default function EnFeaturesPage() {
  return <FeaturesContent />;
}
