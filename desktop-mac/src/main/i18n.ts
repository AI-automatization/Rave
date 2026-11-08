// Languages of the native screens (sidebar, toolbar, Home): uz / ru / en, following the web app's own setting.
// No Electron imports — pure, unit-tested.
//
// The web app keeps the user's language in the cookie `wewatch-locale` (apps/app-web store/locale.store.ts) and falls
// back to Russian when it is missing; the native screens read the same cookie and use the same fallback, so the app
// never shows two languages at once.
//
// Wording: Uzbek is the approved design (Stitch Variant 1). Where the web app already translates a string, the same
// words are used here in all three languages (tests compare them with apps/app-web/messages/*.json). The few strings
// the web app has no equivalent for (marked "own") are plain translations of the design's Uzbek.
import type { NavItemId } from './shell-model';

export type Locale = 'uz' | 'ru' | 'en';
export const LOCALES: readonly Locale[] = ['uz', 'ru', 'en'];
export const LOCALE_COOKIE = 'wewatch-locale';
export const DEFAULT_LOCALE: Locale = 'ru';

export function parseLocale(v: unknown): Locale {
  return v === 'uz' || v === 'ru' || v === 'en' ? v : DEFAULT_LOCALE;
}

export interface Strings {
  readonly nav: Readonly<Record<NavItemId, string>>;
  /** One per sidebar section, in the order of NAV_SECTIONS. */
  readonly sections: readonly [string, string, string];
  readonly ui: {
    readonly back: string;
    readonly forward: string;
    readonly search: string;
    readonly searchLabel: string;
    readonly navLabel: string;
    readonly toggleSidebar: string;
    readonly newRoom: string;
    /** Status line under the user's name in the sidebar ("Onlayn · <this Mac>"). */
    readonly online: string;
  };
  readonly home: {
    readonly banner: string;
    readonly joinBanner: string;
    readonly join: string;
    readonly waitingRoom: string;
    readonly sectionTitle: string;
    readonly sectionSub: string;
    /** `{n}` is replaced by the number of people. */
    readonly viewers: string;
    readonly people: string;
    readonly badgeLive: string;
    readonly badgeStarting: string;
    readonly badgePaused: string;
    readonly emptyTitle: string;
    readonly emptyDesc: string;
    readonly noMatch: string;
    readonly errorTitle: string;
    readonly errorDesc: string;
    readonly retry: string;
    readonly untitled: string;
    readonly railTrending: string;
    readonly railHistory: string;
    /** `{n}` is replaced by the number of people who watched it this week. */
    readonly weeklyViewers: string;
    readonly startError: string;
    readonly sortLabel: string;
    readonly sortViewers: string;
    readonly sortNewest: string;
    readonly owner: string;
    /** Bosh sahifa header + start block: the web app's own words. `{n}` = the user's name / a count. */
    readonly greetingMorning: string;
    readonly greetingDay: string;
    readonly greetingEvening: string;
    readonly greetingGuest: string;
    readonly friendsOnline: string;
    readonly noFriendsOnline: string;
    readonly create: string;
    readonly step1: string;
    readonly step2: string;
    readonly step3: string;
    readonly startTitle: string;
    readonly startSub: string;
    readonly quickCreate: string;
    readonly quickJoin: string;
    readonly startSources: string;
    readonly startDirect: string;
  };
}

const UZ: Strings = {
  nav: { home: 'Bosh sahifa', rooms: 'Xonalar', live: 'Jonli efirlar', friends: "Do'stlar", history: 'Tarix', settings: 'Sozlamalar' },
  sections: ['ASOSIY', "DO'STLAR & HAMJAMIYAT", 'KUTUBXONA'],
  ui: { back: 'Orqaga', forward: 'Oldinga', search: 'Qidirish', searchLabel: 'Xonalarni qidirish', navLabel: 'Asosiy navigatsiya',
    toggleSidebar: 'Yon panel', newRoom: 'Yangi xona', online: 'Onlayn' },
  home: {
    banner: 'ASOSIY JONLI XONA',
    joinBanner: "Xonaga qo'shilish",
    join: "Qo'shilish",
    waitingRoom: 'Kutish xonasi',
    sectionTitle: 'Faol xonalar',
    sectionSub: "Do'stlaringiz va jamoat xonalari ro'yxati",
    viewers: '{n} nafar tomoshabin onlayn',
    people: '{n} kishi',
    badgeLive: 'JONLI',
    badgeStarting: 'BOSHLANMOQDA',
    badgePaused: 'PAUZADA',
    emptyTitle: "Hali xonalar yo'q",
    emptyDesc: "Xona yarating va do'stlaringizni birga tomosha qilishga taklif qiling",
    noMatch: 'Hech narsa topilmadi',
    errorTitle: "Xonalarni yuklab bo'lmadi",
    errorDesc: 'Internetni tekshiring yoki qayta urining',
    retry: 'Qayta urinish',
    untitled: 'Nomsiz xona',
    railTrending: 'Haftaning top kinolari',
    railHistory: 'Ko‘rganlarim',
    weeklyViewers: '{n} kishi ko‘rdi',
    startError: 'Xona ochilmadi, qayta urinib ko‘ring',
    sortLabel: 'Saralash:',
    sortViewers: "Ko'ruvchilar soni bo'yicha",
    sortNewest: 'Yangi xonalar',
    owner: 'Xona egasi',
    greetingMorning: "Xayrli tong, {n}",
    greetingDay: "Salom, {n}",
    greetingEvening: "Xayrli kech, {n}",
    greetingGuest: "Xush kelibsiz",
    friendsOnline: "{n} do‘st onlayn",
    noFriendsOnline: "Hozir hech kim onlayn emas",
    create: "Xona yaratish",
    step1: "Xona yarating",
    step2: "Do‘stlaringizga kod yuboring",
    step3: "Birga tomosha qiling",
    startTitle: "Xona oching va birga tomosha qiling",
    startSub: "Video havolasini joylashtiring, do‘stlaringizga kod yuboring — hammangiz bir vaqtda, bir xil daqiqada ko‘rasiz.",
    quickCreate: "Xona yaratish",
    quickJoin: "Kod bilan kirish",
    startSources: "Qo‘llab-quvvatlanadi",
    startDirect: "To‘g‘ridan havola",
  },
};

const RU: Strings = {
  nav: { home: 'Главная', rooms: 'Комнаты', live: 'Прямые эфиры', friends: 'Друзья', history: 'История', settings: 'Настройки' },
  sections: ['ОСНОВНОЕ', 'ДРУЗЬЯ И СООБЩЕСТВО', 'БИБЛИОТЕКА'],
  ui: { back: 'Назад', forward: 'Вперёд', search: 'Поиск', searchLabel: 'Поиск комнат', navLabel: 'Основная навигация',
    toggleSidebar: 'Боковая панель', newRoom: 'Новая комната', online: 'В сети' },
  home: {
    banner: 'СЕЙЧАС В ЭФИРЕ',
    joinBanner: 'Присоединиться',
    join: 'Присоединиться',
    waitingRoom: 'Комната ожидания',
    sectionTitle: 'Активные комнаты',
    sectionSub: 'Комнаты друзей и сообщества',
    viewers: '{n} смотрят',
    people: '{n} чел.',
    badgeLive: 'LIVE',
    badgeStarting: 'СКОРО',
    badgePaused: 'ПАУЗА',
    emptyTitle: 'Пока нет комнат',
    emptyDesc: 'Создайте комнату и пригласите друзей смотреть вместе',
    noMatch: 'Ничего не найдено',
    errorTitle: 'Не удалось загрузить комнаты',
    errorDesc: 'Проверьте подключение или попробуйте снова',
    retry: 'Повторить',
    untitled: 'Комната без названия',
    railTrending: 'Топ недели',
    railHistory: 'История',
    weeklyViewers: 'Смотрели: {n}',
    startError: 'Не удалось открыть комнату, попробуйте ещё раз',
    sortLabel: 'Сортировка:',
    sortViewers: 'По числу зрителей',
    sortNewest: 'Новые комнаты',
    owner: 'Владелец комнаты',
    greetingMorning: "Доброе утро, {n}",
    greetingDay: "Привет, {n}",
    greetingEvening: "Добрый вечер, {n}",
    greetingGuest: "Добро пожаловать",
    friendsOnline: "{n} друзей онлайн",
    noFriendsOnline: "Сейчас никого нет онлайн",
    create: "Создать комнату",
    step1: "Создать комнату",
    step2: "Отправить код друзьям",
    step3: "Смотреть вместе",
    startTitle: "Откройте комнату и смотрите вместе",
    startSub: "Вставьте ссылку на видео, отправьте друзьям код — и вы смотрите синхронно, кадр в кадр.",
    quickCreate: "Создать комнату",
    quickJoin: "Войти по коду",
    startSources: "Поддерживается",
    startDirect: "Прямая ссылка",
  },
};

const EN: Strings = {
  nav: { home: 'Home', rooms: 'Rooms', live: 'Live streams', friends: 'Friends', history: 'History', settings: 'Settings' },
  sections: ['MAIN', 'FRIENDS & COMMUNITY', 'LIBRARY'],
  ui: { back: 'Back', forward: 'Forward', search: 'Search', searchLabel: 'Search rooms', navLabel: 'Main navigation',
    toggleSidebar: 'Sidebar', newRoom: 'New room', online: 'Online' },
  home: {
    banner: 'LIVE RIGHT NOW',
    joinBanner: 'Join',
    join: 'Join',
    waitingRoom: 'Waiting room',
    sectionTitle: 'Active rooms',
    sectionSub: 'Rooms of your friends and the community',
    viewers: '{n} watching',
    people: '{n}',
    badgeLive: 'LIVE',
    badgeStarting: 'STARTING',
    badgePaused: 'PAUSED',
    emptyTitle: 'No rooms yet',
    emptyDesc: 'Create a room and invite friends to watch together',
    noMatch: 'Nothing found',
    errorTitle: 'Failed to load rooms',
    errorDesc: 'Check your connection or try again',
    retry: 'Retry',
    untitled: 'Untitled room',
    railTrending: 'Top this week',
    railHistory: 'Watched',
    weeklyViewers: '{n} watched',
    startError: 'Couldn’t open a room, try again',
    sortLabel: 'Sort by:',
    sortViewers: 'By viewers',
    sortNewest: 'Newest rooms',
    owner: 'Room owner',
    greetingMorning: "Good morning, {n}",
    greetingDay: "Hi, {n}",
    greetingEvening: "Good evening, {n}",
    greetingGuest: "Welcome",
    friendsOnline: "{n} friends online",
    noFriendsOnline: "Nobody online right now",
    create: "Create a room",
    step1: "Create a room",
    step2: "Send friends the code",
    step3: "Watch together",
    startTitle: "Open a room and watch together",
    startSub: "Paste a video link, send your friends the code — everyone watches in sync, frame for frame.",
    quickCreate: "Create room",
    quickJoin: "Join with code",
    startSources: "Supported",
    startDirect: "Direct link",
  },
};

const TABLE: Readonly<Record<Locale, Strings>> = { uz: UZ, ru: RU, en: EN };

export const stringsFor = (locale: Locale): Strings => TABLE[locale];
