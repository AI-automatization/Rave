import type { Metadata } from 'next';
import { FeaturesContent } from '@/components/landing/FeaturesContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: "WeWatch imkoniyatlari — birga ko'rish, chat" },
  description:
    "WeWatch'ning barcha funksiyalari — Watch Party, yutuqlar, bildirishnomalar. Do'stlaring bilan birga video ko'r, bepul.",
  alternates: {
    canonical: `${APP_URL}/uz/features`,
    languages: hreflangFor('/ru/features', APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'WeWatch imkoniyatlari',
    description: "Watch Party, chat va emoji — hammasi bepul.",
    url: `${APP_URL}/uz/features`,
  }),
  robots: { index: true, follow: true },
};

export default function UzFeaturesPage() {
  return <FeaturesContent />;
}
