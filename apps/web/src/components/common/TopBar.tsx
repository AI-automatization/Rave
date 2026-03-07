'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaSearch, FaBell, FaUser } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { LanguageSwitcher } from './LanguageSwitcher';

export function TopBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const t = useTranslations('topbar');
  const tAuth = useTranslations('auth');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('q') as string)?.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-md border-b border-zinc-800 shadow-lg">
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        {/* Logo (mobile only) */}
        <Link href="/home" className="lg:hidden text-2xl font-display text-[#7C3AED] tracking-[0.18em]">
          CS
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            <FaSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              name="q"
              type="search"
              placeholder={t('searchPlaceholder')}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-800 border border-zinc-800 text-zinc-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60"
              aria-label={t('searchPlaceholder')}
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/notifications" className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all" aria-label="Bildirishnomalar">
            <FaBell size={16} />
          </Link>
          {user ? (
            <Link href={`/profile/${user.username}`} className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-zinc-400 hover:bg-zinc-800/50 transition-all">
              {user.avatar ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <Image src={user.avatar} alt={user.username} width={32} height={32} className="object-cover w-full h-full" unoptimized />
                </div>
              ) : (
                <FaUser size={16} />
              )}
            </Link>
          ) : (
            <Link href="/login" className="inline-flex items-center justify-center gap-2 h-7 px-3 rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:shadow-lg hover:shadow-violet-500/40 transition-all text-sm font-medium active:scale-95">
              {tAuth('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
