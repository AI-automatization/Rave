import type { Metadata } from 'next';
import { PricingContent } from './PricingContent';

export const metadata: Metadata = {
  title: 'Цены | WeWatch',
  description: "Тарифы WeWatch — Бесплатный и Pro. Основные функции бесплатны навсегда. Смотрите видео вместе с друзьями без подписки.",
  alternates: { canonical: 'https://wewatch.uz/pricing' },
};

export default function PricingPage() {
  return <PricingContent />;
}
