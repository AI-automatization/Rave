import type { Metadata } from 'next';
import { FeaturesContent } from './FeaturesContent';

export const metadata: Metadata = {
  title: 'Возможности | WeWatch',
  description: "Все функции WeWatch — Watch Party, Battle Mode, достижения, уведомления и многое другое. Смотрите видео вместе с друзьями бесплатно.",
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
