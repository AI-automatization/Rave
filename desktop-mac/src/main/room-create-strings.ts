// Words of the native "Create room" / "Join room" dialogs: uz / ru / en, following the web app's language.
// No Electron imports. Every line is copied from apps/app-web/messages/<locale>.json (key noted on the right) —
// nothing here is own wording.
import type { Locale } from './i18n';
import type { ErrorStrings } from './room-create-model';

export interface RoomDialogStrings extends ErrorStrings {
  readonly createTitle: string; //            room.createTitle
  readonly urlPlaceholder: string; //         room.urlPlaceholder
  readonly hintWeb: string; //                room.hintWeb
  readonly roomName: string; //               room.roomName
  readonly roomNamePlaceholder: string; //    room.roomNamePlaceholder
  readonly whoCanJoin: string; //             room.whoCanJoin
  readonly visibilityPublic: string; //       room.visibilityPublic
  readonly visibilityPublicDesc: string; //   room.visibilityPublicDesc
  readonly visibilityPrivate: string; //      room.visibilityPrivate
  readonly visibilityPrivateDesc: string; //  room.visibilityPrivateDesc
  readonly creating: string; //               room.creating
  readonly createBtn: string; //              room.createBtn
  readonly alreadyHaveRoom: string; //        room.alreadyHaveRoom
  readonly joinTitle: string; //              room.joinTitle
  readonly joinDesc: string; //               room.joinDesc
  readonly joining: string; //                room.joining
  readonly joinBtn: string; //                room.joinBtn
  readonly close: string; //                  achievements.close
  readonly whatToWatch: string; //            room.whatToWatch
  readonly backBtn: string; //                room.backBtn
  readonly searchPlaceholder: string; //      room.searchPlaceholder
  readonly searchNoResults: string; //        room.searchNoResults
  readonly searchAvailable: string; //        room.searchAvailable
  readonly otherSources: string; //           room.otherSources
  readonly clipboardDetected: string; //      room.clipboardDetected
  readonly hintPlatform: string; //           room.hintPlatform
  readonly checkingLink: string; //           room.checkingLink
  // ErrorStrings: createError/joinError = room.*, network = home.errorDesc, http* = common.http*
}

const TABLE: Readonly<Record<Locale, RoomDialogStrings>> = {
  uz: {
    createTitle: 'Xona yaratish',
    urlPlaceholder: "Video yoki sayt havolasini qo'ying",
    hintWeb: 'Istalgan sayt URL manzilini kiriting',
    roomName: 'Xona nomi (ixtiyoriy)',
    roomNamePlaceholder: 'Masalan: Kino kechasi',
    whoCanJoin: "Kim qo'shila oladi?",
    visibilityPublic: 'Ommaviy',
    visibilityPublicDesc: "Har kim qo'shilishi mumkin",
    visibilityPrivate: 'Shaxsiy',
    visibilityPrivateDesc: 'Faqat taklif havolasi orqali',
    creating: 'Yaratilmoqda...',
    createBtn: 'Yaratish',
    alreadyHaveRoom: 'Sizda ochiq xona bor — uni ochyapmiz',
    joinTitle: "Xonaga qo'shilish",
    joinDesc: "Taklif havolasini qo'ying yoki 6 xonali kodni kiriting",
    joining: "Qo'shilmoqda...",
    joinBtn: "Qo'shilish",
    close: 'Yopish',
    whatToWatch: 'Nima tomosha qilamiz?',
    backBtn: 'Orqaga',
    searchPlaceholder: "YouTube, VK, Rutube'dan video qidirish...",
    searchNoResults: 'Hech narsa topilmadi',
    searchAvailable: 'Sayt ichida qidiruv mavjud',
    otherSources: 'Boshqa manbalar',
    clipboardDetected: 'Bufer almashuvidan video',
    hintPlatform: 'Videoni oching va havolani bu yerga nusxalang',
    checkingLink: 'Havola tekshirilmoqda...',
    createError: "Xona yaratib bo'lmadi",
    joinError: "Xonaga qo'shilib bo'lmadi",
    network: 'Internetni tekshiring yoki qayta urining',
    httpForbidden: "Ruxsat yo'q",
    httpNotFound: 'Topilmadi',
    httpTooManyRequests: "So'rov juda ko'p — biroz kuting",
    httpServerError: 'Server xatosi',
    httpServiceUnavailable: 'Xizmat mavjud emas',
    httpMaintenance: "Texnik ishlar — keyinroq urinib ko'ring",
  },
  ru: {
    createTitle: 'Создать комнату',
    urlPlaceholder: 'Вставьте ссылку на видео или сайт',
    hintWeb: 'Введите URL любого сайта',
    roomName: 'Название комнаты (необязательно)',
    roomNamePlaceholder: 'Например: Вечер кино',
    whoCanJoin: 'Кто может присоединиться?',
    visibilityPublic: 'Публичная',
    visibilityPublicDesc: 'Любой может присоединиться',
    visibilityPrivate: 'Приватная',
    visibilityPrivateDesc: 'Только по ссылке-приглашению',
    creating: 'Создание...',
    createBtn: 'Создать',
    alreadyHaveRoom: 'У вас уже есть открытая комната — открываем её',
    joinTitle: 'Присоединиться к комнате',
    joinDesc: 'Вставьте ссылку-приглашение или введите 6-значный код',
    joining: 'Подключение...',
    joinBtn: 'Присоединиться',
    close: 'Закрыть',
    whatToWatch: 'Что будем смотреть?',
    backBtn: 'Назад',
    searchPlaceholder: 'Поиск видео на YouTube, VK, Rutube...',
    searchNoResults: 'Ничего не найдено',
    searchAvailable: 'Доступен поиск внутри сайта',
    otherSources: 'Другие источники',
    clipboardDetected: 'Видео из буфера обмена',
    hintPlatform: 'Откройте видео и скопируйте ссылку сюда',
    checkingLink: 'Проверяем ссылку...',
    createError: 'Не удалось создать комнату',
    joinError: 'Не удалось присоединиться',
    network: 'Проверьте подключение или попробуйте снова',
    httpForbidden: 'Нет доступа',
    httpNotFound: 'Не найдено',
    httpTooManyRequests: 'Слишком много запросов — подождите немного',
    httpServerError: 'Ошибка сервера',
    httpServiceUnavailable: 'Сервис недоступен',
    httpMaintenance: 'Технические работы — попробуйте позже',
  },
  en: {
    createTitle: 'Create a room',
    urlPlaceholder: 'Paste a video or website link',
    hintWeb: 'Enter any website URL',
    roomName: 'Room name (optional)',
    roomNamePlaceholder: 'E.g.: Movie night',
    whoCanJoin: 'Who can join?',
    visibilityPublic: 'Public',
    visibilityPublicDesc: 'Anyone can join',
    visibilityPrivate: 'Private',
    visibilityPrivateDesc: 'Invite link only',
    creating: 'Creating...',
    createBtn: 'Create',
    alreadyHaveRoom: 'You already have an open room — opening it',
    joinTitle: 'Join Room',
    joinDesc: 'Paste the invite link or enter the 6-character code',
    joining: 'Joining...',
    joinBtn: 'Join',
    close: 'Close',
    whatToWatch: 'What are we watching?',
    backBtn: 'Back',
    searchPlaceholder: 'Search YouTube, VK, Rutube...',
    searchNoResults: 'No results found',
    searchAvailable: 'In-app search available',
    otherSources: 'Other sources',
    clipboardDetected: 'Video from clipboard',
    hintPlatform: 'Open a video and copy the link here',
    checkingLink: 'Checking link...',
    createError: 'Failed to create room',
    joinError: 'Failed to join room',
    network: 'Check your connection or try again',
    httpForbidden: 'No access',
    httpNotFound: 'Not found',
    httpTooManyRequests: 'Too many requests — please wait a moment',
    httpServerError: 'Server error',
    httpServiceUnavailable: 'Service unavailable',
    httpMaintenance: 'Maintenance in progress — please try again later',
  },
};

export const roomDialogStringsFor = (locale: Locale): RoomDialogStrings => TABLE[locale];

/** Where each line comes from in apps/app-web/messages/<locale>.json — the test compares them. */
export const ROOM_DIALOG_SOURCE: Readonly<Record<keyof RoomDialogStrings, string>> = {
  createTitle: 'room.createTitle', urlPlaceholder: 'room.urlPlaceholder', hintWeb: 'room.hintWeb', roomName: 'room.roomName',
  roomNamePlaceholder: 'room.roomNamePlaceholder', whoCanJoin: 'room.whoCanJoin', visibilityPublic: 'room.visibilityPublic',
  visibilityPublicDesc: 'room.visibilityPublicDesc', visibilityPrivate: 'room.visibilityPrivate', visibilityPrivateDesc: 'room.visibilityPrivateDesc',
  creating: 'room.creating', createBtn: 'room.createBtn', alreadyHaveRoom: 'room.alreadyHaveRoom', joinTitle: 'room.joinTitle',
  joinDesc: 'room.joinDesc', joining: 'room.joining', joinBtn: 'room.joinBtn', close: 'achievements.close', createError: 'room.createError',
  joinError: 'room.joinError', whatToWatch: 'room.whatToWatch', backBtn: 'room.backBtn', searchPlaceholder: 'room.searchPlaceholder',
  searchNoResults: 'room.searchNoResults', searchAvailable: 'room.searchAvailable', otherSources: 'room.otherSources',
  clipboardDetected: 'room.clipboardDetected', hintPlatform: 'room.hintPlatform', checkingLink: 'room.checkingLink', network: 'home.errorDesc', httpForbidden: 'common.httpForbidden', httpNotFound: 'common.httpNotFound',
  httpTooManyRequests: 'common.httpTooManyRequests', httpServerError: 'common.httpServerError',
  httpServiceUnavailable: 'common.httpServiceUnavailable', httpMaintenance: 'common.httpMaintenance',
};
