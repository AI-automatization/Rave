import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    languages: {
      'ru': 'https://wewatch.uz',
      'uz': 'https://wewatch.uz/uz',
    },
  },
};

export default function UzLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
