import type { Metadata } from 'next';
import { PricingContent } from './PricingContent';

export const metadata: Metadata = {
  title: 'Narxlar',
  description: "CineSync narx rejalari — Bepul va Pro. Asosiy funksiyalar hammaga bepul.",
};

export default function PricingPage() {
  return <PricingContent />;
}
