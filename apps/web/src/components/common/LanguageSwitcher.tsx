'use client';

import { useLocaleStore } from '@/store/locale.store';

type Locale = 'uz' | 'ru' | 'en';

const LOCALES: { value: Locale; flag: string; label: string }[] = [
  { value: 'uz', flag: '🇺🇿', label: "O'zbek" },
  { value: 'ru', flag: '🇷🇺', label: 'Русский' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore();
  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

  return (
    <div className="relative group">
      <button className="inline-flex items-center justify-center gap-1 h-7 px-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 transition-all text-sm">
        <span>{current.flag}</span>
        <span className="hidden sm:inline text-xs">{current.label}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
        {LOCALES.map(({ value, flag, label }) => (
          <button
            key={value}
            onClick={() => setLocale(value)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
              locale === value
                ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <span>{flag}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
