import type { Metadata } from 'next';
import { PricingContent } from '@/app/(landing)/pricing/PricingContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'WeWatch Pricing — Core Features Free Forever' },
  description:
    'WeWatch plans — Free and Pro. The core watch party is free forever, no subscription needed to watch videos together with friends.',
  alternates: {
    canonical: `${APP_URL}/en/pricing`,
    languages: hreflangFor('/pricing', APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'WeWatch Pricing',
    description: 'Free and Pro plans — the core features are free forever.',
    url: `${APP_URL}/en/pricing`,
  }),
  robots: { index: true, follow: true },
};

export default function EnPricingPage() {
  return <PricingContent />;
}
