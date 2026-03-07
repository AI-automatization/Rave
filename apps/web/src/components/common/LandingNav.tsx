'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';

export function LandingNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('landing');

  const links = [
    { href: '/',          label: t('nav_home') },
    { href: '/features',  label: t('nav_features') },
    { href: '/pricing',   label: t('nav_pricing') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-display tracking-wider text-white hover:text-[#7C3AED] transition-colors">
          CINE<span className="text-[#7C3AED]">SYNC</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href
                  ? 'text-white font-medium'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login" className="inline-flex items-center justify-center h-8 px-4 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium active:scale-95">
            {t('login')}
          </Link>
          <Link href="/register" className="inline-flex items-center justify-center h-8 px-4 rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all text-sm font-semibold active:scale-95">
            {t('getStarted')}
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 transition-all"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#111118] border-t border-zinc-800 px-4 py-3 space-y-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <LanguageSwitcher />
            <Link href="/login" className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium flex-1 active:scale-95">
              {t('login')}
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-all text-sm font-semibold flex-1 active:scale-95">
              {t('getStarted')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
