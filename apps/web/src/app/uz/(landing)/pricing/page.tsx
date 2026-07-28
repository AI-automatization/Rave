import type { Metadata } from 'next';
import { PricingContent } from '@/components/landing/PricingContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: "WeWatch narxlari — asosiy funksiyalar abadiy bepul" },
  description:
    "WeWatch tariflari — Bepul va Pro. Asosiy funksiyalar abadiy bepul. Do'stlaring bilan birga video ko'rish uchun obuna shart emas.",
  alternates: {
    canonical: `${APP_URL}/uz/pricing`,
    languages: hreflangFor('/ru/pricing', APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'WeWatch narxlari',
    description: 'Bepul va Pro tariflar — asosiy funksiyalar abadiy bepul.',
    url: `${APP_URL}/uz/pricing`,
  }),
  robots: { index: true, follow: true },
};

export default function UzPricingPage() {
  return <PricingContent />;
}
