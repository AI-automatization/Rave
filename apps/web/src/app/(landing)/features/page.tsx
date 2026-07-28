import type { Metadata } from 'next';
import { FeaturesContent } from './FeaturesContent';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: 'Возможности',
  description: "Все функции WeWatch — Watch Party, Battle Mode, достижения, уведомления и многое другое. Смотрите видео вместе с друзьями бесплатно.",
  alternates: {
    canonical: `${APP_URL}/features`,
    languages: hreflangFor('/features', APP_URL),
  },
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
