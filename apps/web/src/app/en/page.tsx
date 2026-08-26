import type { Metadata } from 'next';
import { LandingContent } from '@/components/landing/LandingContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { publishHomepageSchema } from '@/data/homepage-schema';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

// See the note in app/uz/page.tsx — derived, not hand-written.
const LANGUAGES = hreflangFor('/', APP_URL);

export const metadata: Metadata = {
  title: { absolute: 'WeWatch — Watch Videos Together With Friends Online | Free Watch Party' },
  description:
    'WeWatch — watch YouTube, VK and Rutube together with friends in real time on the web. Free watch party with chat and emoji. Native iOS and Android apps are in development.',
  alternates: {
    canonical: `${APP_URL}/en`,
    languages: LANGUAGES,
  },
  openGraph: {
    title: 'WeWatch — Watch Videos Together With Friends Online',
    description:
      'Free web watch party — watch YouTube, VK and Rutube with friends in real time. Native iOS and Android apps are in development.',
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
      'Free web watch party — YouTube, VK and Rutube in sync with friends. Native iOS and Android apps are in development.',
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
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/en#app`,
      name: 'WeWatch — Watch Together',
      url: `${APP_URL}/en`,
      description:
        'Free web watch party for watching movies and videos with friends. YouTube, VK and Rutube stay in sync in real time. Native iOS and Android apps are in development.',
      applicationCategory: 'EntertainmentApplication',
      applicationSubCategory: 'SocialNetworkingApplication',
      operatingSystem: 'Web',
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
            text: 'Open wewatch.uz in a browser, create a room, paste a YouTube, VK or Rutube link and share the room link with your friend. Native iOS and Android apps are in development.',
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
            text: 'Core watch-party features are free, with no time limit. A Pro plan is planned for additional features, but it is not purchasable yet and its price has not been announced.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does it work between iPhone, Android and a desktop browser?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Participants can open the web version in browsers on iPhone, Android and desktop and share the same synchronized room. Native mobile apps are in development.',
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

const publishedJsonLd = publishHomepageSchema(jsonLd, 'en');

export default function EnHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(publishedJsonLd) }}
      />
      <div className="brand-fonts">
        <LandingContent locale="en" />
      </div>
    </>
  );
}
