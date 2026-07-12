import type { Metadata } from 'next';
import { ContactContent } from './ContactContent';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'Контакты — WeWatch и tezcode.dev | Написать нам' },
  description:
    'Свяжитесь с командой WeWatch и tezcode.dev: email tezcode@tezcode.dev, Telegram, Instagram. Вопросы, сотрудничество или идеи — мы на связи.',
  alternates: { canonical: `${APP_URL}/contact` },
  openGraph: {
    title: 'Контакты — WeWatch и tezcode.dev',
    description: 'Напишите команде WeWatch и tezcode.dev — email, Telegram, Instagram.',
    url: `${APP_URL}/contact`,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Контакты WeWatch',
  url: `${APP_URL}/contact`,
  mainEntity: {
    '@type': 'Organization',
    name: 'tezcode.dev',
    email: 'tezcode@tezcode.dev',
    url: 'https://www.tezcode.dev/',
    sameAs: ['https://t.me/webdevelopertk', 'https://instagram.com/tezcode_dev'],
  },
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContactContent />
    </>
  );
}
