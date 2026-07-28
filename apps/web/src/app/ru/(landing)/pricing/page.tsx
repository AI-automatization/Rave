import type { Metadata } from 'next';
import { PricingContent } from '@/components/landing/PricingContent';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: 'Цены',
  description: "Тарифы WeWatch — Бесплатный и Pro. Основные функции бесплатны навсегда. Смотрите видео вместе с друзьями без подписки.",
  alternates: {
    canonical: `${APP_URL}/ru/pricing`,
    languages: hreflangFor('/ru/pricing', APP_URL),
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
