'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

export function LandingNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/',          label: 'Bosh sahifa' },
    { href: '/features',  label: 'Funksiyalar' },
    { href: '/pricing',   label: 'Narxlar' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-display text-primary tracking-wider">
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
                  ? 'text-primary font-medium'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn btn-ghost btn-sm">Kirish</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Boshlash</Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden btn btn-ghost btn-sm btn-circle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <FaTimes size={23} /> : <FaBars size={23} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-base-200 border-t border-base-300 px-4 py-3 space-y-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block py-2 text-sm text-base-content/70 hover:text-base-content"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="btn btn-ghost btn-sm flex-1">Kirish</Link>
            <Link href="/register" className="btn btn-primary btn-sm flex-1">Boshlash</Link>
          </div>
        </div>
      )}
    </header>
  );
}
