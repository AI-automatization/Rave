'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaSearch, FaBell } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { LanguageSwitcher } from './LanguageSwitcher';

export function TopBar() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);
  const t      = useTranslations('topbar');
  const tAuth  = useTranslations('auth');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (new FormData(e.currentTarget).get('q') as string)?.trim();
    if (q) router.push(`/movies?q=${encodeURIComponent(q)}`);
    else router.push('/movies');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-4 px-5 h-14">
        {/* Logo — mobile only */}
        <Link href="/home" className="lg:hidden text-xl font-display text-white tracking-[0.2em] flex-shrink-0">
          CINE<span className="text-[#7C3AED]">SYNC</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <FaSearch
              size={13}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
            />
            <input
              name="q"
              type="search"
              placeholder={t('searchPlaceholder')}
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/50 focus:bg-white/[0.07] transition-all"
              aria-label={t('searchPlaceholder')}
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <LanguageSwitcher />

          <Link
            href="/notifications"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
            aria-label="Notifications"
          >
            <FaBell size={16} />
          </Link>

          {user ? (
            <Link
              href={`/profile/${user.username}`}
              className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden bg-[#7C3AED]/20 border border-[#7C3AED]/30 hover:border-[#7C3AED]/60 transition-all"
            >
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-xs font-bold text-[#7C3AED]">
                  {user.username[0].toUpperCase()}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="h-8 px-4 rounded-lg bg-[#7C3AED] text-white text-xs font-semibold hover:bg-[#6D28D9] hover:shadow-lg hover:shadow-violet-500/30 transition-all active:scale-95 inline-flex items-center"
            >
              {tAuth('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
