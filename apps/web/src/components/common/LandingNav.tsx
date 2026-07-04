'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';
import { WeWatchLogo } from './WeWatchLogo';

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
    { href: '/features', label: t('nav_features') },
    { href: '/pricing',  label: t('nav_pricing') },
    { href: '/company',  label: t('nav_company') },
    { href: '/about',    label: t('nav_about') },
    { href: '/contact',  label: t('nav_contact') },
  ];

  return (
    <>
        <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-5 pt-3">
        <div className="max-w-7xl mx-auto relative rounded-2xl border border-white/10 bg-[#0D0D14]/85 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
          {/* top gradient hairline */}
          <div className="absolute top-0 left-6 right-6 h-px rounded-full" aria-hidden="true"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(123,114,248,0.5), transparent)' }} />
          {/* soft glow */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-72 h-28 rounded-full blur-[60px] opacity-25 pointer-events-none -z-10" aria-hidden="true"
            style={{ background: 'rgba(123,114,248,0.25)' }} />

          <div className="relative px-5 sm:px-7 py-3.5 flex items-center justify-between gap-4">

            {/* Logo + tagline */}
            <div className="flex items-center gap-3 min-w-0">
              <WeWatchLogo iconSize={32} textSize="text-lg" />
              <span className="hidden lg:block text-[9px] uppercase tracking-[0.14em] text-zinc-500 border-l border-zinc-700/70 pl-3 leading-tight max-w-[120px]">
                {t('nav_tagline')}
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-7">
              {links.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative text-sm transition-colors ${
                      active ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {label}
                    {active && (
                      <span
                        className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #7B72F8, #a855f7)' }}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA — pill buttons */}
            <div className="hidden md:flex items-center gap-2.5">
              <LanguageSwitcher />
              <Link
                href="/login"
                className="h-9 px-4 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all text-sm font-medium flex items-center"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="group h-9 pl-4 pr-3.5 rounded-full bg-[#7B72F8] text-white hover:bg-[#6B63E8] transition-all text-sm font-semibold flex items-center gap-1.5 shadow-[0_0_16px_rgba(123,114,248,0.35)] hover:shadow-[0_0_26px_rgba(123,114,248,0.55)]"
              >
                {t('getStarted')}
                <FaArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>

            {/* Mobile burger */}
            <button
              className="md:hidden relative z-[60] w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              <span
                className="transition-all duration-300"
                style={{ opacity: menuOpen ? 0 : 1, position: menuOpen ? 'absolute' : 'static' }}
              >
                <FaBars size={17} />
              </span>
              <span
                className="transition-all duration-300"
                style={{ opacity: menuOpen ? 1 : 0, position: menuOpen ? 'static' : 'absolute' }}
              >
                <FaTimes size={17} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer — occupies the flow space of the fixed header */}
      <div aria-hidden="true" className="h-[88px]" />

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
          borderLeft: '1px solid rgba(123,114,248,0.2)',
          boxShadow: menuOpen ? '-20px 0 60px rgba(123,114,248,0.15)' : 'none',
        }}
      >
        {/* Drawer glow */}
        <div className="absolute top-20 right-0 w-40 h-40 bg-[#7B72F8]/15 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-[#7B72F8]/10 rounded-full blur-[50px] pointer-events-none" />

        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/60">
          <WeWatchLogo iconSize={30} textSize="text-lg" />
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
                  ? 'bg-[#7B72F8]/15 text-white border border-[#7B72F8]/30 shadow-[0_0_20px_rgba(123,114,248,0.15)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
              <FaChevronRight size={11} className={pathname === href ? 'text-[#7B72F8]' : 'text-zinc-700'} />
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

          {/* Login button */}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center h-11 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all text-sm font-medium w-full"
          >
            {t('login')}
          </Link>

          {/* CTA button */}
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center h-11 rounded-xl bg-[#7B72F8] text-white hover:bg-[#6B63E8] hover:shadow-[0_0_30px_rgba(123,114,248,0.5)] transition-all text-sm font-semibold w-full shadow-[0_0_15px_rgba(123,114,248,0.35)]"
          >
            {t('getStarted')}
          </Link>
        </div>
      </div>
    </>
  );
}
