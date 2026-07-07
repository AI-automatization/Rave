import type { Metadata } from 'next';
import { FeaturesContent } from './FeaturesContent';

export const metadata: Metadata = {
  title: 'Возможности',
  description: "Все функции WeWatch — Watch Party, Battle Mode, достижения, уведомления и многое другое. Смотрите видео вместе с друзьями бесплатно.",
  alternates: { canonical: 'https://wewatch.uz/features' },
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
