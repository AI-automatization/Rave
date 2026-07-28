import type { Metadata } from 'next';
import { LandingContent } from '@/components/landing/LandingContent';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

// See the note in app/uz/page.tsx — derived, not hand-written.
const LANGUAGES = hreflangFor('/', APP_URL);

export const metadata: Metadata = {
  title: { absolute: 'WeWatch — Watch Videos Together With Friends Online | Free Watch Party' },
  description:
    'WeWatch — watch YouTube, VK and Rutube together with friends in real time. One on iPhone, another on the web — sync just works. Free watch party with chat and emoji. iOS and Android.',
  alternates: {
    canonical: `${APP_URL}/en`,
    languages: LANGUAGES,
  },
  openGraph: {
    title: 'WeWatch — Watch Videos Together With Friends Online',
    description:
      'Free watch party — watch YouTube, VK, Rutube with friends in real time. Sync, chat, emoji. iOS and Android.',
    url: `${APP_URL}/en`,
    locale: 'en_US',
    images: [{ url: '/og-image', width: 1200, height: 630, alt: 'WeWatch — watch videos together with friends online free' }],
  },
  // Full twitter block: Next.js replaces (not deep-merges) the root layout's
  // Russian twitter metadata, so card/site/images must be repeated here.
  twitter: {
    card: 'summary_large_image',
    site: '@wewatch_app',
    creator: '@wewatch_app',
    title: 'WeWatch — Watch Videos Together With Friends',
    description:
      'Free watch party — YouTube, VK, Rutube in sync with friends. Chat, emoji. iOS and Android.',
    images: ['/og-image'],
  },
  robots: { index: true, follow: true },
};

// EN structured data — the English page had none at all, so Google and the AI
// answer engines saw no entity, no offer and no Q&A for English queries.
// Facts (500 ms drift, 10 participants) come from shared/src/constants — they
// must not be invented here or they will contradict llms.txt and the app.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/en#website`,
      url: `${APP_URL}/en`,
      name: 'WeWatch',
      alternateName: ['wewatch', 'wewatch.uz', 'watch party', 'watch videos together', 'watch together online'],
      description: 'Watch YouTube, VK and Rutube together with friends in real time — synced playback, chat and emoji.',
      inLanguage: 'en',
    },
    {
      '@type': 'MobileApplication',
      '@id': `${APP_URL}/en#app`,
      name: 'WeWatch — Watch Together',
      url: `${APP_URL}/en`,
      description:
        'Free watch party app for watching movies and videos with friends. YouTube, VK and Rutube stay in sync in real time. Live chat and emoji reactions. iOS, Android and web.',
      applicationCategory: 'EntertainmentApplication',
      applicationSubCategory: 'SocialNetworkingApplication',
      operatingSystem: 'iOS, Android, Web',
      inLanguage: 'en',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    },
    {
      '@type': 'FAQPage',
      '@id': `${APP_URL}/en#faq`,
      inLanguage: 'en',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I watch videos together with friends online?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Open wewatch.uz or install WeWatch on iOS or Android, create a room, paste a YouTube, VK or Rutube link and share the room link with your friend. As soon as they join, playback is synchronized — when you pause, it pauses for everyone.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is a watch party?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A watch party is synchronized co-watching over the internet. Several people watch the same video at the same moment, as if sitting together. WeWatch keeps play, pause and seek aligned for every participant in the room.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is WeWatch free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The free tier has no time limit — you can create rooms and watch together for as long as you want. A Pro plan is available for extra features, but nothing essential is behind it.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does it work between iPhone, Android and a desktop browser?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. One participant on iPhone, another on Android and another in a desktop browser can share the same room. Playback is scheduled against a shared server clock, so every device stays in sync regardless of platform.',
          },
        },
        {
          '@type': 'Question',
          name: 'How many people can join one room?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Up to 10 participants per room. Rooms close automatically after 10 minutes of inactivity.',
          },
        },
        {
          '@type': 'Question',
          name: 'How accurate is the synchronization?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Each client measures its clock offset against the server, and playback commands are scheduled at a shared future timestamp instead of running on arrival, which absorbs network latency. A periodic heartbeat corrects any client that drifts more than 500 ms from the room position.',
          },
        },
      ],
    },
  ],
};

export default function EnHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingContent />
    </>
  );
}
