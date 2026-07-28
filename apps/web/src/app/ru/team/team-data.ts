// WeWatch / tezcode team roster — used by /team hub and /team/[slug] person pages.
// Bios are role/skill-based and honest; sameAs powers Person schema (fill socials).
// Photos: /public/team/<slug>.jpg (generated branded office headshots).

export type FocusArea = { title: string; desc: string };

export type TeamMember = {
  slug: string;
  name: string;          // primary Latin name
  nameAlt: string;       // Cyrillic transliteration for name-search SEO
  role: string;
  tagline: string;       // one-line value proposition (hero subtitle)
  location: string;
  bio: string[];         // paragraphs for the "who is" section
  knowsAbout: string[];  // expertise tags / schema knowsAbout
  focus: FocusArea[];    // "Направления" cards
  sameAs: string[];      // social profiles for Person.sameAs
  photo: string;         // /team/<slug>.jpg
};

export const TEZCODE_TEAM_URL = 'https://tezcode.dev/team';
export const LOCATION = 'Ташкент, Узбекистан';

export const TEAM: TeamMember[] = [
  {
    slug: 'bekzod-mirzaliyev',
    name: 'Bekzod Mirzaliyev',
    nameAlt: 'Бекзод Мирзалиев',
    role: 'Founder & CEO, tezcode',
    tagline: 'Основатель tezcode — строю AI-first студию и продукты, которые доходят до пользователя.',
    location: LOCATION,
    bio: [
      'Bekzod Mirzaliyev (Бекзод Мирзалиев) — основатель и CEO tezcode, AI-first студии разработки из Ташкента. Отвечает за продуктовую стратегию студии и её продуктов, включая WeWatch.',
      'Двигает инженерную культуру команды, проводит code review проектов и задаёт планку качества — от архитектуры до релиза. Подход простой: продукт должен решать реальную задачу пользователя, а технологии подбираются под неё, а не наоборот.',
    ],
    knowsAbout: ['AI', 'product strategy', 'engineering leadership', 'startups'],
    focus: [
      { title: 'Продуктовая стратегия', desc: 'Направление продуктов студии — от идеи до метрик.' },
      { title: 'Инженерная культура', desc: 'Code review, стандарты качества и архитектуры.' },
      { title: 'AI-first подход', desc: 'Внедрение AI в процессы и продукты tezcode.' },
    ],
    sameAs: [],
    photo: '/ru/team/bekzod-mirzaliyev.jpg',
  },
  {
    slug: 'ertan-emirhan',
    name: 'Ertan Emirhan',
    nameAlt: 'Эртан Эмирхан',
    role: 'Mobile Lead',
    tagline: 'Веду мобильную разработку WeWatch — плавный кросс-платформенный опыт на iOS и Android.',
    location: LOCATION,
    bio: [
      'Ertan Emirhan (Эртан Эмирхан) — Mobile Lead WeWatch. Отвечает за мобильные приложения продукта на React Native и Expo: интерфейс, производительность и стабильность на iOS и Android.',
      'Ключевая задача — кросс-платформенная синхронизация просмотра: чтобы пауза и перемотка мгновенно применялись у всех участников, независимо от устройства и сети.',
    ],
    knowsAbout: ['React Native', 'Expo', 'iOS', 'Android', 'mobile UX'],
    focus: [
      { title: 'Мобильные приложения', desc: 'iOS и Android на React Native + Expo.' },
      { title: 'Sync-опыт', desc: 'Синхронный плеер и реакции в реальном времени.' },
      { title: 'Производительность', desc: 'Плавность и стабильность на слабых сетях.' },
    ],
    sameAs: [],
    photo: '/ru/team/ertan-emirhan.jpg',
  },
  {
    slug: 'saidazim-buriboyev',
    name: 'Saidazim Buriboyev',
    nameAlt: 'Саидазим Бурибоев',
    role: 'Backend & Mobile Engineer',
    tagline: 'Строю backend и real-time синхронизацию WeWatch — микросервисы, которые держат просмотр вместе.',
    location: LOCATION,
    bio: [
      'Saidazim Buriboyev (Саидазим Бурибоев) — Backend & Mobile инженер WeWatch. Отвечает за серверную часть продукта: микросервисы на Node.js, MongoDB, Redis и real-time слой на Socket.io.',
      'Его зона — синхронизация просмотра и инфраструктура: извлечение видеопотоков (YouTube, VK, Rutube), компенсация задержек и стабильность комнат. Также участвует в мобильной разработке.',
    ],
    knowsAbout: ['Node.js', 'microservices', 'MongoDB', 'Redis', 'Socket.io', 'backend', 'DevOps'],
    focus: [
      { title: 'Backend-микросервисы', desc: 'Node.js, MongoDB, Redis — auth, user, content, watch-party.' },
      { title: 'Real-time sync', desc: 'Socket.io, компенсация задержек, состояние комнат.' },
      { title: 'Видео-экстракция', desc: 'YouTube, VK, Rutube через встроенный браузер + прокси.' },
    ],
    sameAs: ['https://github.com/Foreger'],
    photo: '/ru/team/saidazim-buriboyev.jpg',
  },
  {
    slug: 'abdulaziz-yormatov',
    name: 'Abdulaziz Yormatov',
    nameAlt: 'Абдулазиз Ёрматов',
    role: 'Software Engineer',
    tagline: 'Инженер tezcode — разработка и контроль качества продуктов студии.',
    location: LOCATION,
    bio: [
      'Abdulaziz Yormatov (Абдулазиз Ёрматов) — инженер команды tezcode. Участвует в разработке продуктов студии, а также в аудите качества и безопасности кода.',
      'Помогает держать планку: ревью, проверка уязвимостей и стабильности перед релизами — чтобы продукты выходили надёжными.',
    ],
    knowsAbout: ['software engineering', 'code review', 'security', 'QA'],
    focus: [
      { title: 'Разработка', desc: 'Участие в продуктах студии tezcode.' },
      { title: 'Аудит качества', desc: 'Code review и проверка стабильности.' },
      { title: 'Безопасность', desc: 'Поиск уязвимостей перед релизом.' },
    ],
    sameAs: [],
    photo: '/ru/team/abdulaziz-yormatov.jpg',
  },
];

export function getMember(slug: string): TeamMember | undefined {
  return TEAM.find((m) => m.slug === slug);
}
