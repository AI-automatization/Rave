'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaFilm, FaUsers, FaTrophy, FaChartBar, FaBell, FaCog, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';

const NAV_ITEM_KEYS = [
  { href: '/home',          icon: FaHome,          key: 'home' },
  { href: '/search',        icon: FaSearch,        key: 'search' },
  { href: '/movies',        icon: FaFilm,          key: 'movies' },
  { href: '/friends',       icon: FaUsers,         key: 'friends' },
  { href: '/battle',        icon: GiCrossedSwords, key: 'battle' },
  { href: '/achievements',  icon: FaTrophy,        key: 'achievements' },
  { href: '/stats',         icon: FaChartBar,      key: 'stats' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user, refreshToken, clearAuth } = useAuthStore();
  const t = useTranslations('nav');

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout', { refreshToken });
    } catch (err) {
      logger.error('Logout xatosi', err);
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  const rankColors: Record<string, string> = {
    bronze:  'text-amber-600',
    silver:  'text-zinc-400',
    gold:    'text-amber-400',
    diamond: 'text-[#7C3AED]',
    legend:  'text-[#7C3AED]',
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#111118]/95 backdrop-blur-md border-r border-zinc-800 h-screen sticky top-0 shadow-2xl">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 px-6 py-6 border-b border-zinc-800">
          <span className="text-3xl font-display text-[#7C3AED] tracking-[0.18em]">CINESYNC</span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-2">
          {NAV_ITEM_KEYS.map(({ href, icon: Icon, key }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-base transition-all ${
                  active
                    ? 'bg-[#7C3AED] text-white font-semibold shadow-lg shadow-violet-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {t(key)}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: notifications + settings + user */}
        <div className="border-t border-base-300 p-4 space-y-2">
          <Link
            href="/notifications"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-base-content/75 hover:bg-base-300/80 hover:text-base-content transition-colors"
          >
            <FaBell size={20} />
            {t('notifications')}
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-base-content/75 hover:bg-base-300/80 hover:text-base-content transition-colors"
          >
            <FaCog size={20} />
            {t('settings')}
          </Link>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-base-300/55">
              <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="avatar">
                  <div className="w-11 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-lg">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.username} width={44} height={44} className="object-cover" unoptimized />
                    ) : (
                      <span className="text-sm font-semibold">{user.username[0].toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-zinc-300">{user.username}</p>
                  <p className={`text-sm capitalize ${rankColors[user.rank] ?? 'text-zinc-500'}`}>
                    {user.rank}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => void handleLogout()}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all"
                aria-label="Logout"
              >
                <FaSignOutAlt size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#111118]/95 backdrop-blur-md border-t border-zinc-800 z-50 shadow-[0_-10px_24px_rgba(4,6,13,0.45)]">
        <div className="flex items-center justify-around px-2 py-3">
          {NAV_ITEM_KEYS.slice(0, 5).map(({ href, icon: Icon, key }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  active ? 'text-[#7C3AED]' : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                <Icon size={22} />
                <span className="text-xs">{t(key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
