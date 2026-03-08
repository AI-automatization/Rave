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
      <button className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all text-sm">
        <span>{current.flag}</span>
        <span className="hidden sm:inline text-xs">{current.label}</span>
      </button>
      <div className="absolute right-0 top-full mt-1.5 w-36 bg-[#111118] border border-zinc-800 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
        {LOCALES.map(({ value, flag, label }) => (
          <button
            key={value}
            onClick={() => setLocale(value)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              locale === value
                ? 'bg-[#7C3AED]/15 text-[#7C3AED] font-medium'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
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
