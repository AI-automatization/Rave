import type { Metadata } from 'next';
import { FeaturesContent } from './FeaturesContent';

export const metadata: Metadata = {
  title: 'Funksiyalar',
  description: "WeWatch ning barcha funksiyalari — Watch Party, Battle, Achievement, bildirishnomalar va boshqalar.",
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
