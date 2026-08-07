import type { Metadata } from 'next';
import { LandingContent } from '@/components/landing/LandingContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';
import { publishHomepageSchema } from '@/data/homepage-schema';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'WeWatch — Смотреть вместе онлайн | Watch Party бесплатно' },
  description:
    'WeWatch — смотри YouTube, VK и Rutube с друзьями в реальном времени через веб. Бесплатный watch party с чатом и эмодзи. Приложения для iOS и Android находятся в разработке.',
  alternates: {
    canonical: `${APP_URL}/ru`,
    languages: hreflangFor('/', APP_URL),
  },
  ...socialMeta({
    locale: 'ru',
    title: 'WeWatch — Смотреть вместе онлайн | Watch Party бесплатно',
    description:
      'Бесплатный watch party в вебе — YouTube, VK и Rutube с друзьями в реальном времени. Приложения для iOS и Android находятся в разработке.',
    url: `${APP_URL}/ru`,
  }),
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
      // SearchAction (sitelinks searchbox) убран: реальной страницы поиска нет
      // (только /api/content/search), а шаблон /?q={search_term_string} Google
      // индексировал как отдельный URL — лишний «Обнаружена, не проиндексирована».
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
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/#app`,
      name: 'WeWatch — смотри вместе',
      url: APP_URL,
      description:
        'Веб-сервис для совместного просмотра фильмов и видео онлайн. Смотрите YouTube, VK Видео, Rutube и прямые MP4-ссылки с друзьями в реальном времени. Нативные приложения iOS и Android разрабатываются.',
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Web',
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
        'YouTube, VK Видео, Rutube и прямые MP4-ссылки',
        'YouTube, VK Видео, Rutube и прямые MP4-ссылки',
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
          name: 'Откройте WeWatch',
          text: 'Откройте веб-версию WeWatch в браузере на телефоне или компьютере. Приложения для iOS и Android находятся в разработке.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Найдите видео',
          text: 'Откройте веб-версию WeWatch и вставьте ссылку YouTube, VK Видео, Rutube или прямую MP4-ссылку.',
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
            text: 'Откройте WeWatch в браузере, найдите видео на YouTube, VK или Rutube, создайте комнату и отправьте ссылку-приглашение другу. Все участники увидят один и тот же кадр в реальном времени.',
          },
        },
        {
          '@type': 'Question',
          name: 'Как смотреть кино вместе онлайн бесплатно?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WeWatch — веб-сервис для совместного просмотра кино онлайн. Откройте его в браузере, создайте Watch Party и пригласите друга по ссылке. Приложения для iOS и Android находятся в разработке.',
          },
        },
        {
          '@type': 'Question',
          name: 'Можно ли смотреть YouTube с друзьями одновременно?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, WeWatch поддерживает YouTube, VK Видео, Rutube и прямые MP4-ссылки. Пауза и перемотка работают для всех одновременно.',
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
            text: 'Основные функции WeWatch доступны бесплатно в веб-версии. Приложения для iOS и Android находятся в разработке.',
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
            text: 'Watch party — это совместный онлайн-просмотр видео. Откройте веб-версию WeWatch, создайте комнату и смотрите с друзьями; приложения iOS и Android находятся в разработке.',
          },
        },
        {
          '@type': 'Question',
          name: 'На каких устройствах работает WeWatch?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Веб-версия WeWatch работает в браузере на iPhone, iPad, Android и компьютере. Нативные приложения для iOS и Android находятся в разработке.',
          },
        },
        {
          '@type': 'Question',
          name: 'Можно ли смотреть вместе если один на телефоне а другой на сайте?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да — участники могут открыть веб-версию WeWatch в браузерах на iPhone, Android и компьютере и войти в одну синхронную комнату. Нативные приложения для iOS и Android находятся в разработке.',
          },
        },
        {
          '@type': 'Question',
          name: 'Можно ли смотреть аниме вместе онлайн?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, если аниме доступно через YouTube, VK Видео, Rutube или прямую MP4-ссылку. Создайте комнату и поделитесь ссылкой с другом.',
          },
        },
        {
          '@type': 'Question',
          name: "Как смотреть кино с друзьями онлайн?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Откройте WeWatch в браузере, найдите видео на YouTube, VK или Rutube, создайте комнату и отправьте ссылку другу. Все смотрят синхронно в реальном времени.",
          },
        },
      ],
    },
  ],
};

const publishedJsonLd = publishHomepageSchema(jsonLd, 'ru');

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(publishedJsonLd) }}
      />
      <LandingContent />
    </>
  );
}
