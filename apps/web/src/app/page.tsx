import type { Metadata } from 'next';
import { LandingContent } from './LandingContent';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: 'WeWatch — Смотрите видео вместе с друзьями онлайн | Watch Party',
  description:
    'WeWatch — приложение для совместного просмотра фильмов и видео. Смотри YouTube, VK, Rutube с друзьями в реальном времени. Синхронный просмотр, чат, эмодзи. Скачай бесплатно.',
  alternates: { canonical: APP_URL },
  openGraph: {
    title: 'WeWatch — Смотрите видео вместе с друзьями онлайн',
    description:
      'Совместный просмотр фильмов и видео. YouTube, VK, Rutube — смотри с друзьями где бы они ни находились.',
    url: APP_URL,
    images: [{ url: '/og-image', width: 1200, height: 630 }],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'WeWatch',
      description: 'Совместный просмотр фильмов и видео онлайн с друзьями',
      inLanguage: ['ru', 'uz', 'en'],
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${APP_URL}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: 'WeWatch',
      url: APP_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_URL}/icons/icon-512x512.png`,
        width: 512,
        height: 512,
      },
      sameAs: ['https://apps.apple.com/app/wewatch'],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/#app`,
      name: 'WeWatch',
      url: APP_URL,
      description:
        'Приложение для совместного просмотра фильмов и видео онлайн. Смотри YouTube, VK, Rutube с друзьями в реальном времени.',
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'iOS, Android',
      inLanguage: ['ru', 'uz', 'en'],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1200',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Синхронный просмотр видео',
        'Watch Party с друзьями',
        'Встроенный браузер',
        'Поддержка YouTube, VK, Rutube',
        'Чат и эмодзи-реакции',
        'Батл — соревнование кто больше смотрит',
        'Система достижений',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${APP_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Как смотреть видео вместе с друзьями онлайн?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Скачайте WeWatch, откройте встроенный браузер, найдите видео на любом сайте (YouTube, VK, Rutube), создайте комнату и отправьте ссылку-приглашение другу. Все участники увидят один и тот же кадр в реальном времени.',
          },
        },
        {
          '@type': 'Question',
          name: 'Что делать, когда друг далеко?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WeWatch позволяет смотреть фильмы и видео вместе с друзьями на любом расстоянии. Просто создайте Watch Party, пригласите друга по ссылке — и вы смотрите синхронно, как будто сидите рядом.',
          },
        },
        {
          '@type': 'Question',
          name: 'Можно ли смотреть YouTube с друзьями одновременно?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, WeWatch поддерживает YouTube, VK Видео, Rutube, Uzmove и другие сайты. Встроенный браузер открывает любой сайт, и вы можете смотреть видео синхронно с друзьями.',
          },
        },
        {
          '@type': 'Question',
          name: 'WeWatch бесплатный?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, WeWatch полностью бесплатный. Скачайте приложение в App Store или Google Play и начните смотреть вместе с друзьями прямо сейчас.',
          },
        },
        {
          '@type': 'Question',
          name: 'Как организовать совместный просмотр фильма?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'В WeWatch откройте встроенный браузер → найдите фильм на любом сайте → нажмите "Создать комнату" → поделитесь ссылкой с друзьями. Пауза и перемотка синхронизируются для всех участников автоматически.',
          },
        },
        {
          '@type': 'Question',
          name: 'На каких устройствах работает WeWatch?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WeWatch работает на iOS (iPhone, iPad) и Android. Приложение доступно в App Store и Google Play.',
          },
        },
      ],
    },
  ],
};

export default function LandingPage() {
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
