'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaPlay, FaChevronRight } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';

export function LandingNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('landing');

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const links = [
    { href: '/',         label: t('nav_home') },
    { href: '/features', label: t('nav_features') },
    { href: '/pricing',  label: t('nav_pricing') },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.4)]">
              <FaPlay size={9} className="text-white ml-0.5" />
            </div>
            <span className="text-xl font-display tracking-wider text-white hover:text-[#7C3AED] transition-colors">
              CINE<span className="text-[#7C3AED]">SYNC</span>
            </span>
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

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="h-8 px-4 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium flex items-center">
              {t('login')}
            </Link>
            <Link href="/register" className="h-8 px-4 rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all text-sm font-semibold flex items-center shadow-[0_0_12px_rgba(124,58,237,0.3)]">
              {t('getStarted')}
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden relative z-[60] w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <span
              className="transition-all duration-300"
              style={{ opacity: menuOpen ? 0 : 1, position: menuOpen ? 'absolute' : 'static' }}
            >
              <FaBars size={18} />
            </span>
            <span
              className="transition-all duration-300"
              style={{ opacity: menuOpen ? 1 : 0, position: menuOpen ? 'static' : 'absolute' }}
            >
              <FaTimes size={18} />
            </span>
          </button>
        </div>
      </header>

      {/* ── MOBILE DRAWER ───────────────────────────────────────── */}

      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none' }}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          background: 'linear-gradient(160deg, #111120, #0d0d18)',
          borderLeft: '1px solid rgba(124,58,237,0.2)',
          boxShadow: menuOpen ? '-20px 0 60px rgba(124,58,237,0.15)' : 'none',
        }}
      >
        {/* Drawer glow */}
        <div className="absolute top-20 right-0 w-40 h-40 bg-[#7C3AED]/15 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-[#7C3AED]/10 rounded-full blur-[50px] pointer-events-none" />

        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/60">
          <Link href="/" onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#7C3AED] flex items-center justify-center">
              <FaPlay size={8} className="text-white ml-0.5" />
            </div>
            <span className="font-display text-white tracking-wider">
              CINE<span className="text-[#7C3AED]">SYNC</span>
            </span>
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === href
                  ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
              <FaChevronRight size={11} className={pathname === href ? 'text-[#7C3AED]' : 'text-zinc-700'} />
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-4 pb-6 pt-4 border-t border-zinc-800/60 space-y-3">
          {/* Language switcher */}
          <div className="flex items-center justify-between px-2">
            <span className="text-zinc-600 text-xs uppercase tracking-widest">Til</span>
            <LanguageSwitcher />
          </div>

          {/* Auth buttons */}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center h-11 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-all text-sm font-medium w-full"
          >
            {t('login')}
          </Link>
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center h-11 rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all text-sm font-semibold w-full shadow-[0_0_15px_rgba(124,58,237,0.35)]"
          >
            {t('getStarted')}
          </Link>
        </div>
      </div>
    </>
  );
}
