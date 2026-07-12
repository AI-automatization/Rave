import type { Metadata } from 'next';
import { LandingContent } from './LandingContent';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'WeWatch — Смотреть вместе онлайн | Watch Party бесплатно' },
  description:
    'WeWatch — смотри YouTube, VK и Rutube с друзьями в реальном времени. Бесплатный watch party с синхронизацией, чатом и эмодзи. Скачай на iOS и Android.',
  alternates: {
    canonical: APP_URL,
    // Next merges `alternates` shallowly — without languages here the root
    // layout's hreflang set is dropped on the homepage
    languages: {
      'x-default': APP_URL,
      'ru': APP_URL,
      'ru-RU': APP_URL,
    },
  },
  openGraph: {
    title: 'WeWatch — Смотреть вместе онлайн | Watch Party бесплатно',
    description:
      'Бесплатный watch party — смотри YouTube, VK, Rutube с друзьями в реальном времени. Синхронизация, чат, эмодзи. iOS и Android.',
    url: APP_URL,
    images: [{ url: '/og-image', width: 1200, height: 630, alt: 'WeWatch — смотри видео вместе с друзьями онлайн бесплатно' }],
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
      alternateName: ['wewatch', 'wewatch.uz', 'WeWatch app', 'вивотч', 'ви вотч', 'вевотч', 'ви воч'],
      description: 'Бесплатный watch party — смотри YouTube, VK, Rutube с друзьями в реальном времени',
      inLanguage: ['ru', 'uz', 'en'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${APP_URL}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: 'WeWatch',
      alternateName: ['wewatch', 'wewatch.uz'],
      slogan: 'Ты паузишь — все паузят',
      url: APP_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_URL}/icons/icon-512x512.png`,
        width: 512,
        height: 512,
      },
    },
    {
      '@type': 'MobileApplication',
      '@id': `${APP_URL}/#app`,
      name: 'WeWatch — смотри вместе',
      url: APP_URL,
      description:
        'Бесплатное приложение для совместного просмотра фильмов и видео онлайн. Смотри YouTube, VK, Rutube, Uzmove с друзьями в реальном времени. Синхронизация, чат, эмодзи-реакции.',
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'iOS, Android',
      inLanguage: ['ru', 'uz', 'en'],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'Синхронный просмотр видео в реальном времени',
        'Watch Party с друзьями',
        'Встроенный браузер — любой сайт',
        'YouTube, VK Видео, Rutube, Uzmove',
        'Чат и эмодзи-реакции',
        'Батл — соревнование кто больше смотрит',
        'Система достижений',
        'Бесплатно',
      ],
    },
    {
      '@type': 'HowTo',
      '@id': `${APP_URL}/#howto`,
      name: 'Как смотреть видео вместе с друзьями онлайн',
      description: 'Пошаговая инструкция как начать watch party и смотреть YouTube, VK, Rutube синхронно с друзьями через WeWatch',
      totalTime: 'PT2M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Скачайте WeWatch',
          text: 'Установите бесплатное приложение WeWatch из App Store или Google Play на iPhone или Android.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Найдите видео',
          text: 'Откройте встроенный браузер в WeWatch и перейдите на YouTube, VK Видео, Rutube или любой другой видеосайт. Найдите фильм или видео которое хотите посмотреть.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Создайте комнату',
          text: 'Нажмите "Создать комнату" — WeWatch создаст приватную Watch Party и выдаст ссылку-приглашение.',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Пригласите друга',
          text: 'Отправьте ссылку другу в любом мессенджере. Когда он перейдёт по ссылке — вы смотрите синхронно. Пауза и перемотка работают для всех одновременно.',
        },
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
          name: 'Как смотреть кино вместе онлайн бесплатно?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WeWatch — полностью бесплатное приложение для совместного просмотра кино онлайн. Скачайте на iOS или Android, создайте Watch Party, пригласите друга по ссылке — и смотрите синхронно любые фильмы с YouTube, VK, Rutube.',
          },
        },
        {
          '@type': 'Question',
          name: 'Можно ли смотреть YouTube с друзьями одновременно?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, WeWatch поддерживает YouTube, VK Видео, Rutube, Uzmove и другие видеосайты. Встроенный браузер открывает любой сайт, и вы смотрите видео синхронно с друзьями — пауза и перемотка работают для всех одновременно.',
          },
        },
        {
          '@type': 'Question',
          name: 'Что делать, когда друг далеко?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WeWatch позволяет смотреть фильмы и видео вместе с друзьями на любом расстоянии. Создайте Watch Party, пригласите друга по ссылке — и вы смотрите синхронно, как будто сидите рядом. Работает через интернет, расстояние не важно.',
          },
        },
        {
          '@type': 'Question',
          name: 'WeWatch бесплатный?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, WeWatch полностью бесплатный. Скачайте приложение в App Store или Google Play и сразу начните смотреть с друзьями — регистрация по номеру телефона.',
          },
        },
        {
          '@type': 'Question',
          name: 'Как организовать совместный просмотр фильма?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'В WeWatch: откройте браузер → найдите фильм на любом сайте → нажмите "Создать комнату" → поделитесь ссылкой. Пауза и перемотка синхронизируются для всех участников автоматически.',
          },
        },
        {
          '@type': 'Question',
          name: 'Что такое watch party?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Watch party — это совместный онлайн-просмотр видео, когда несколько человек смотрят один и тот же контент синхронно через интернет. WeWatch делает watch party бесплатно — скачай приложение, создай комнату и смотри с друзьями.',
          },
        },
        {
          '@type': 'Question',
          name: 'На каких устройствах работает WeWatch?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WeWatch работает на iOS (iPhone, iPad) и Android. Приложение доступно в App Store и Google Play бесплатно.',
          },
        },
        {
          '@type': 'Question',
          name: 'Можно ли смотреть вместе если один на телефоне а другой на сайте?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да — WeWatch синхронизирует просмотр между всеми платформами одновременно. Один участник может открыть приложение на iPhone, другой зайти через браузер на компьютере — видео будет идти синхронно у всех. Это уникальная особенность WeWatch: кросс-платформенный watch party без ограничений по устройству.',
          },
        },
        {
          '@type': 'Question',
          name: 'Можно ли смотреть аниме вместе онлайн?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, WeWatch поддерживает любые видеосайты через встроенный браузер — включая сайты с аниме. Откройте нужный сайт в браузере WeWatch, создайте комнату и смотрите аниме с другом синхронно.',
          },
        },
        {
          '@type': 'Question',
          name: "Как смотреть кино с друзьями онлайн?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Скачайте приложение WeWatch, найдите видео во встроенном браузере на YouTube, VK или Rutube, создайте комнату и отправьте ссылку другу. Все смотрят синхронно в реальном времени.",
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
