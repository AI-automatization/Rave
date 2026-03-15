import { useLanguageStore } from '@store/language.store';
import { translations, t as translate } from './translations';

export type { Language } from '@store/language.store';
export { translations };

export function useT() {
  const { lang } = useLanguageStore();
  return {
    lang,
    t: (section: keyof typeof translations, key: string): string => {
      return translate(section, key, lang);
    },
  };
}
