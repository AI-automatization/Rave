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
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-display text-cyan-400 tracking-wider">
          CINESYNC
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href
                  ? 'text-cyan-400 font-medium'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login" className="inline-flex items-center justify-center gap-2 h-7 px-3 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all text-sm font-medium active:scale-95">
            {t('login')}
          </Link>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 h-7 px-3 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-sm font-medium active:scale-95">
            {t('getStarted')}
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden inline-flex items-center justify-center gap-2 h-7 w-7 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-3 space-y-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block py-2 text-sm text-slate-400 hover:text-slate-300"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <LanguageSwitcher />
            <Link href="/login" className="inline-flex items-center justify-center gap-2 h-7 px-3 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all text-sm font-medium flex-1 active:scale-95">
              {t('login')}
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 h-7 px-3 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-sm font-medium flex-1 active:scale-95">
              {t('getStarted')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
