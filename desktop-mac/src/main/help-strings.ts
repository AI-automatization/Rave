// Words and links of the native Help screen (shown from the login page's footer before sign-in). No Electron imports —
// pure, unit-tested.
//
// Nothing here is invented. Sources, copied as they are:
//   - FAQ questions/answers: apps/web/src/app/uz/faq/page.tsx and apps/web/src/app/ru/faq/page.tsx (the public wewatch.uz/{uz,ru}/faq);
//     only entries that make sense inside the desktop app (no pricing, no "open wewatch.uz in the browser").
//   - "forgot password": apps/app-web/messages/{uz,ru}.json  auth.forgotHeading + auth.forgotSubtitle.
//   - header: messages support.title / emptyTitle / subtitle (apps/app-web); the page title is auth.help ("Yordam" / "Помощь").
//   - contact channels: wewatch.uz/{uz,ru}/contact — Telegram support @wewatch_support, Telegram channel @wewatchh, e-mail support@wewatch.uz.
// English: apps/web/src/app/en/faq/page.tsx and apps/app-web/messages/en.json (same selection as uz/ru). Own translation of the
// design's Uzbek: contactTitle / contactSub / back.
import type { Locale } from './i18n';

/** The renderer names a contact channel by id; this table is the ONLY place that decides where it leads. */
export const HELP_CONTACTS = {
  'telegram-support': 'https://t.me/wewatch_support',
  'telegram-channel': 'https://t.me/wewatchh',
  email: 'mailto:support@wewatch.uz',
} as const;
export type HelpContactId = keyof typeof HELP_CONTACTS;
export const HELP_CONTACT_IDS = Object.keys(HELP_CONTACTS) as HelpContactId[];

/** The fixed URL for a contact id, or null for anything that is not exactly a known id (also prototype keys like "constructor"). */
export function helpContactUrl(id: unknown): string | null {
  return typeof id === 'string' && Object.hasOwn(HELP_CONTACTS, id) ? HELP_CONTACTS[id as HelpContactId] : null;
}

export interface HelpContact {
  readonly id: HelpContactId;
  readonly label: string;
  readonly handle: string;
}
export interface HelpFaqItem {
  readonly q: string;
  readonly a: string;
}
export interface HelpStrings {
  readonly lang: Locale;
  readonly title: string;
  /** Label of the button that returns to the login page. */
  readonly back: string;
  readonly heading: string;
  readonly subtitle: string;
  readonly faqTitle: string;
  readonly faq: readonly HelpFaqItem[];
  readonly contactTitle: string;
  readonly contactSub: string;
  /** Label of the button on a contact row. */
  readonly open: string;
  readonly contacts: readonly HelpContact[];
}

const UZ: HelpStrings = {
  lang: 'uz',
  title: 'Yordam',
  back: 'Kirishga qaytish',
  heading: 'Qanday yordam bera olamiz?',
  subtitle: 'Odatda bir necha soat ichida javob beramiz',
  faqTitle: 'Tez-tez beriladigan savollar',
  faq: [
    {
      q: 'Parolni unutdingizmi?',
      a: 'Hisobingiz emailini kiriting — parolni tiklash havolasini yuboramiz.',
    },
    {
      q: 'Watch party nima?',
      a: "Watch party — internet orqali sinxron birgalikda ko'rish. Bir necha kishi bitta videoni real vaqtda ko'radi, xuddi yonma-yon o'tirgandek. WeWatch ko'rishni tekislab turadi: play, pauza va oldinga o'tish xonadagi hamma uchun bir vaqtda sodir bo'ladi.",
    },
    {
      q: "WeWatch qaysi video xizmatlarni qo'llab-quvvatlaydi?",
      a: "WeWatch veb-versiyada YouTube, VK Video, Rutube va to'g'ridan-to'g'ri .mp4 havolalarini qo'llab-quvvatlaydi.",
    },
    {
      q: "Ko'rish uchun akkaunt kerakmi?",
      a: "Xona yaratish va ko'rishni boshqarish uchun bepul akkaunt kerak. Agar kimdir sizga xona havolasini yuborsa, mehmon sifatida kirib, ro'yxatdan o'tmasdan ko'rishingiz mumkin.",
    },
    {
      q: 'Bitta xonada necha kishi bo‘lishi mumkin?',
      a: 'Bitta xonada 10 nafargacha ishtirokchi. Xona 10 daqiqa harakatsizlikdan keyin avtomatik yopiladi.',
    },
    {
      q: "Biri telefondan, biri kompyuterdan ko'rsa bo'ladimi?",
      a: "Ha. Ishtirokchilar veb-versiyani iPhone, Android va kompyuter brauzerlarida ochib, bitta sinxron xonaga qo'shila oladi. Mobil ilovalar ishlab chiqilmoqda.",
    },
  ],
  contactTitle: "To'g'ridan-to'g'ri kanallar",
  contactSub: 'Tez javob beramiz — odatda kun ichida.',
  open: 'Ochish',
  contacts: [
    { id: 'telegram-support', label: 'Telegram', handle: '@wewatch_support' },
    { id: 'telegram-channel', label: 'Telegram kanal', handle: '@wewatchh' },
    { id: 'email', label: 'Email', handle: 'support@wewatch.uz' },
  ],
};

const RU: HelpStrings = {
  lang: 'ru',
  title: 'Помощь',
  back: 'Назад ко входу',
  heading: 'Чем можем помочь?',
  subtitle: 'Обычно отвечаем в течение нескольких часов',
  faqTitle: 'Частые вопросы',
  faq: [
    {
      q: 'Забыли пароль?',
      a: 'Введите email вашего аккаунта — мы отправим ссылку для сброса пароля.',
    },
    {
      q: 'Что такое watch party?',
      a: 'Watch party — это синхронный совместный просмотр видео через интернет. Несколько человек смотрят одно и то же видео в реальном времени, как будто сидят рядом. WeWatch синхронизирует воспроизведение: пауза, перемотка и старт происходят одновременно у всех участников комнаты.',
    },
    {
      q: 'Какие видеосервисы поддерживает WeWatch?',
      a: 'WeWatch поддерживает YouTube, VK Видео, Rutube, а также прямые .mp4 ссылки в веб-версии.',
    },
    {
      q: 'Нужна ли регистрация для просмотра?',
      a: 'Для создания комнаты и управления воспроизведением нужна бесплатная регистрация. Если у вас есть ссылка на комнату — можно зайти как гость и смотреть без аккаунта.',
    },
    {
      q: 'Сколько человек может быть в одной комнате?',
      a: 'До 10 участников в одной комнате одновременно. Комната закрывается автоматически после 10 минут неактивности.',
    },
    {
      q: 'Можно ли смотреть вместе с телефона и компьютера одновременно?',
      a: 'Да. Участники могут открыть веб-версию в браузерах на iPhone, Android и компьютере и войти в одну синхронную комнату. Нативные приложения находятся в разработке.',
    },
  ],
  contactTitle: 'Прямые каналы',
  contactSub: 'Отвечаем быстро — обычно в течение дня.',
  open: 'Открыть',
  contacts: [
    { id: 'telegram-support', label: 'Telegram', handle: '@wewatch_support' },
    { id: 'telegram-channel', label: 'Telegram канал', handle: '@wewatchh' },
    { id: 'email', label: 'Email', handle: 'support@wewatch.uz' },
  ],
};

const EN: HelpStrings = {
  lang: 'en',
  title: 'Help',
  back: 'Back to sign in',
  heading: 'How can we help?',
  subtitle: 'We usually reply within a few hours',
  faqTitle: 'Frequently asked questions',
  faq: [
    {
      q: 'Forgot your password?',
      a: "Enter your account email — we'll send you a password reset link.",
    },
    {
      q: 'What is a watch party?',
      a: 'A watch party is synchronized co-watching over the internet. Several people watch the same video in real time, as if they were sitting together. WeWatch keeps playback aligned: play, pause and seek happen simultaneously for everyone in the room.',
    },
    {
      q: 'Which video services does WeWatch support?',
      a: 'WeWatch supports YouTube, VK Video, Rutube and direct .mp4 links in the web version.',
    },
    {
      q: 'Do I need an account to watch?',
      a: 'Creating a room and controlling playback requires a free account. If someone sends you a room link, you can join as a guest and watch without signing up.',
    },
    {
      q: 'How many people can be in one room?',
      a: 'Up to 10 participants in a single room. A room closes automatically after 10 minutes of inactivity.',
    },
    {
      q: 'Can one person watch from a phone and another from a computer?',
      a: 'Yes. Participants can open the web version in browsers on iPhone, Android and desktop and join the same synchronized room. Native apps are in development.',
    },
  ],
  contactTitle: 'Direct channels',
  contactSub: 'We reply fast — usually within a day.',
  open: 'Open',
  contacts: [
    { id: 'telegram-support', label: 'Telegram', handle: '@wewatch_support' },
    { id: 'telegram-channel', label: 'Telegram channel', handle: '@wewatchh' },
    { id: 'email', label: 'Email', handle: 'support@wewatch.uz' },
  ],
};

export function helpStringsFor(l: Locale): HelpStrings {
  return l === 'uz' ? UZ : l === 'en' ? EN : RU;
}
