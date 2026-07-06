import type { Metadata } from 'next';
import { LocaleBoundary } from '@/components/common/LocaleBoundary';

export const metadata: Metadata = {
  alternates: {
    languages: {
      'ru': 'https://wewatch.uz',
      'en': 'https://wewatch.uz/en',
    },
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <LocaleBoundary locale="en">{children}</LocaleBoundary>;
}
