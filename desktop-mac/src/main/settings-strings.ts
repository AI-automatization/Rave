// Words of the native Sozlamalar screen: uz / ru / en, following the web app's language.
// No Electron imports — pure, unit-tested. Wherever the web app (apps/app-web/messages/*.json) already has the
// wording, it is copied from there (test/i18n.test.ts compares them); the few lines it has no equivalent for are
// marked "own" in the interface.
import type { Locale } from './i18n';

export interface SettingsStrings {
  readonly title: string;
  readonly profileTitle: string;
  readonly photoHint: string;
  readonly photoButton: string;
  readonly avatarUpdated: string;
  readonly avatarTooLarge: string;
  readonly avatarError: string;
  readonly usernameLabel: string;
  readonly bioLabel: string;
  readonly save: string;
  readonly saving: string;
  readonly saved: string;
  readonly saveError: string;
  readonly language: string;
  readonly changePassword: string;
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmNewPassword: string;
  readonly pwMinLength: string;
  readonly pwMismatch: string;
  readonly pwRequired: string;
  readonly pwChanged: string;
  readonly pwChangedDesc: string;
  readonly sessions: string;
  readonly signOutAll: string;
  readonly signOutConfirm: string;
  readonly confirm: string;
  readonly cancel: string;
  readonly dangerZone: string;
  readonly deleteAccount: string;
  readonly deleteMyAccount: string;
  readonly deleteConfirm: string;
  readonly deleteHint: string;
  readonly yourPassword: string;
  readonly deleteFailed: string;
  readonly logout: string;
  readonly logoutInfo: string;
  readonly logoutError: string;
  readonly loadError: string;
  // own (no web equivalent)
  readonly usernameRule: string;
  readonly usernameTaken: string;
  readonly usernameBanned: string;
  readonly bioRule: string;
  readonly wrongPassword: string;
  readonly pwMaxLength: string;
  readonly reloginNote: string;
  readonly photoTypeError: string;
  readonly retry: string;
  readonly languageNames: Readonly<Record<'uz' | 'ru' | 'en', string>>;
  readonly chooseFile: string;
  /** `{n}` = the user's name that must be typed to confirm deleting the account. */
  readonly deleteTypeName: string;
  readonly sessionExpired: string;
}

const UZ: SettingsStrings = {
  title: "Sozlamalar",
  profileTitle: "Profil",
  photoHint: "JPEG, PNG yoki WebP\nMaksimal 5 MB",
  photoButton: "Rasmni almashtirish",
  avatarUpdated: "Rasm yangilandi",
  avatarTooLarge: "Rasm 5 MB dan katta bo'lmasin",
  avatarError: "Rasmni yuklab bo'lmadi",
  usernameLabel: "Foydalanuvchi nomi",
  bioLabel: "Bio",
  save: "Saqlash",
  saving: "Saqlanmoqda...",
  saved: "Profil saqlandi",
  saveError: "Saqlab bo'lmadi",
  language: "Til",
  changePassword: "PAROLNI O'ZGARTIRISH",
  currentPassword: "Joriy parol",
  newPassword: "Yangi parol",
  confirmNewPassword: "Yangi parolni tasdiqlang",
  pwMinLength: "Yangi parol kamida 6 belgidan iborat bo'lishi kerak",
  pwMismatch: "Parollar mos kelmayapti",
  pwRequired: "Parol majburiy",
  pwChanged: "Parol o'zgartirildi",
  pwChangedDesc: "Parolingiz yangilandi.",
  sessions: "SESSIYALAR",
  signOutAll: "Barcha qurilmalardan chiqish",
  signOutConfirm: "Barcha qurilmalardan chiqiladi. Davom etasizmi?",
  confirm: "Tasdiqlash",
  cancel: "Bekor qilish",
  dangerZone: "XAVFLI HUDUD",
  deleteAccount: "Hisobni o'chirish",
  deleteMyAccount: "Mening hisobimni o'chirish",
  deleteConfirm: "Bu harakat qaytarib bo'lmaydi. Tasdiqlash uchun parolni kiriting.",
  deleteHint: "Hisobingiz, do'stlaringiz va barcha yozishmalar butunlay o'chiriladi. Buni qaytarib bo'lmaydi.",
  yourPassword: "Parolingiz",
  deleteFailed: "Hisobni o'chirib bo'lmadi",
  logout: "Chiqish",
  logoutInfo: "Hisobdan chiqish qurilmada saqlangan ma'lumotlarni o'chiradi.",
  logoutError: "Chiqishda xato",
  loadError: "Sozlamalarni yuklashda xato",
  usernameRule: "3–20 belgi: harf, raqam yoki _",
  usernameTaken: "Bu foydalanuvchi nomi band",
  usernameBanned: "Bu nomni ishlatib bo‘lmaydi",
  bioRule: "Eng ko‘pi bilan 200 belgi",
  wrongPassword: "Joriy parol noto‘g‘ri",
  pwMaxLength: "Parol 128 belgidan oshmasin",
  reloginNote: "Xavfsizlik uchun qayta kirishingiz kerak.",
  photoTypeError: "Faqat JPEG, PNG yoki WebP rasm",
  retry: "Qayta urinish",
  languageNames: {"uz": "O‘zbekcha", "ru": "Русский", "en": "English"},
  chooseFile: "Rasm tanlang",
  deleteTypeName: "Tasdiqlash uchun foydalanuvchi nomingizni yozing: {n}",
  sessionExpired: "Seans tugagan, qayta kiring",
};

const RU: SettingsStrings = {
  title: "Настройки",
  profileTitle: "Профиль",
  photoHint: "JPEG, PNG или WebP\nМаксимум 5 МБ",
  photoButton: "Сменить фото",
  avatarUpdated: "Фото обновлено",
  avatarTooLarge: "Файл больше 5 МБ",
  avatarError: "Не удалось загрузить фото",
  usernameLabel: "Имя пользователя",
  bioLabel: "О себе",
  save: "Сохранить",
  saving: "Сохранение...",
  saved: "Профиль сохранён",
  saveError: "Не удалось сохранить",
  language: "Язык",
  changePassword: "ИЗМЕНИТЬ ПАРОЛЬ",
  currentPassword: "Текущий пароль",
  newPassword: "Новый пароль",
  confirmNewPassword: "Подтвердите новый пароль",
  pwMinLength: "Новый пароль должен быть не менее 6 символов",
  pwMismatch: "Пароли не совпадают",
  pwRequired: "Пароль обязателен",
  pwChanged: "Пароль изменён",
  pwChangedDesc: "Ваш пароль обновлён.",
  sessions: "СЕССИИ",
  signOutAll: "Выйти со всех устройств",
  signOutConfirm: "Вы выйдете со всех устройств. Продолжить?",
  confirm: "Подтвердить",
  cancel: "Отмена",
  dangerZone: "ОПАСНАЯ ЗОНА",
  deleteAccount: "Удалить аккаунт",
  deleteMyAccount: "Удалить мой аккаунт",
  deleteConfirm: "Это действие необратимо. Введите пароль для подтверждения.",
  deleteHint: "Аккаунт, друзья и вся переписка будут удалены безвозвратно.",
  yourPassword: "Ваш пароль",
  deleteFailed: "Не удалось удалить аккаунт",
  logout: "Выйти",
  logoutInfo: "Выход удалит сохранённые данные на устройстве.",
  logoutError: "Ошибка выхода",
  loadError: "Ошибка загрузки настроек",
  usernameRule: "3–20 символов: буквы, цифры или _",
  usernameTaken: "Это имя уже занято",
  usernameBanned: "Это имя использовать нельзя",
  bioRule: "Не более 200 символов",
  wrongPassword: "Текущий пароль неверный",
  pwMaxLength: "Пароль не длиннее 128 символов",
  reloginNote: "В целях безопасности нужно войти заново.",
  photoTypeError: "Только JPEG, PNG или WebP",
  retry: "Повторить",
  languageNames: {"uz": "O‘zbekcha", "ru": "Русский", "en": "English"},
  chooseFile: "Выберите изображение",
  deleteTypeName: "Для подтверждения введите своё имя пользователя: {n}",
  sessionExpired: "Сеанс истёк, войдите снова",
};

const EN: SettingsStrings = {
  title: "Settings",
  profileTitle: "Profile",
  photoHint: "JPEG, PNG or WebP\nMax 5 MB",
  photoButton: "Change photo",
  avatarUpdated: "Photo updated",
  avatarTooLarge: "File is larger than 5 MB",
  avatarError: "Could not upload photo",
  usernameLabel: "Username",
  bioLabel: "Bio",
  save: "Save",
  saving: "Saving...",
  saved: "Profile saved",
  saveError: "Failed to save",
  language: "Language",
  changePassword: "CHANGE PASSWORD",
  currentPassword: "Current password",
  newPassword: "New password",
  confirmNewPassword: "Confirm new password",
  pwMinLength: "New password must be at least 6 characters",
  pwMismatch: "Passwords do not match",
  pwRequired: "Password is required",
  pwChanged: "Password changed",
  pwChangedDesc: "Your password has been updated.",
  sessions: "SESSIONS",
  signOutAll: "Sign out of all devices",
  signOutConfirm: "This will sign you out of all devices. Continue?",
  confirm: "Confirm",
  cancel: "Cancel",
  dangerZone: "DANGER ZONE",
  deleteAccount: "Delete account",
  deleteMyAccount: "Delete my account",
  deleteConfirm: "This action is irreversible. Enter your password to confirm.",
  deleteHint: "Your account, friends and all conversations will be deleted permanently.",
  yourPassword: "Your password",
  deleteFailed: "Failed to delete account",
  logout: "Logout",
  logoutInfo: "Logging out will clear saved data on this device.",
  logoutError: "Logout error",
  loadError: "Error loading settings",
  usernameRule: "3–20 characters: letters, digits or _",
  usernameTaken: "This username is taken",
  usernameBanned: "This name can’t be used",
  bioRule: "Up to 200 characters",
  wrongPassword: "Current password is incorrect",
  pwMaxLength: "Password can’t be longer than 128 characters",
  reloginNote: "For safety you need to sign in again.",
  photoTypeError: "JPEG, PNG or WebP only",
  retry: "Retry",
  languageNames: {"uz": "O‘zbekcha", "ru": "Русский", "en": "English"},
  chooseFile: "Choose an image",
  deleteTypeName: "To confirm, type your username: {n}",
  sessionExpired: "Session expired, sign in again",
};

const TABLE: Readonly<Record<Locale, SettingsStrings>> = { uz: UZ, ru: RU, en: EN };
export const settingsStringsFor = (locale: Locale): SettingsStrings => TABLE[locale];
