import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';
import uz from './locales/uz.json';

const savedLang = localStorage.getItem('admin-lang') ?? 'ru';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ru: { translation: ru }, uz: { translation: uz } },
  lng: savedLang,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

export default i18n;
