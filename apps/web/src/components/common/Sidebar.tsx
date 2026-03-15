'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaHome, FaFilm, FaUsers, FaTrophy,
  FaChartBar, FaBell, FaCog, FaSignOutAlt, FaLink,
} from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';

const NAV = [
  { href: '/home',         icon: FaHome,          key: 'home' },
  { href: '/movies',       icon: FaFilm,          key: 'movies' },
  { href: '/my-videos',    icon: FaLink,          key: 'myVideos' },
  { href: '/friends',      icon: FaUsers,         key: 'friends' },
  { href: '/battle',       icon: GiCrossedSwords, key: 'battle' },
  { href: '/achievements', icon: FaTrophy,        key: 'achievements' },
  { href: '/stats',        icon: FaChartBar,      key: 'stats' },
] as const;

const RANK_COLOR: Record<string, string> = {
  bronze:  'text-amber-500',
  silver:  'text-zinc-400',
  gold:    'text-amber-400',
  diamond: 'text-[#7C3AED]',
  legend:  'text-[#7C3AED]',
};

export function Sidebar() {
  const pathname              = usePathname();
  const { user, clearAuth } = useAuthStore();
  const t                     = useTranslations('nav');

  const handleLogout = async () => {
    try { await apiClient.post('/api/auth/logout', {}); }
    catch (e) { logger.error('Logout error', e); }
    finally { clearAuth(); window.location.href = '/login'; }
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0d0d14] border-r border-white/[0.06] h-screen sticky top-0 overflow-hidden">

        {/* Logo */}
        <Link
          href="/home"
          className="flex items-center gap-2 px-6 py-5 border-b border-white/[0.06]"
        >
          <span className="text-2xl font-display tracking-[0.2em] text-white">
            CINE<span className="text-[#7C3AED]">SYNC</span>
          </span>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV.map(({ href, icon: Icon, key }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-[#7C3AED]/15 text-white'
                    : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#7C3AED] rounded-r-full shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
                )}
                <Icon
                  size={17}
                  className={`shrink-0 transition-colors ${active ? 'text-[#7C3AED]' : 'group-hover:text-zinc-300'}`}
                />
                {t(key)}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/[0.06] p-3 space-y-0.5">
          <Link
            href="/notifications"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive('/notifications')
                ? 'bg-[#7C3AED]/15 text-white'
                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
            }`}
          >
            <FaBell size={16} />
            {t('notifications')}
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive('/settings')
                ? 'bg-[#7C3AED]/15 text-white'
                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
            }`}
          >
            <FaCog size={16} />
            {t('settings')}
          </Link>

          {/* User card */}
          {user && (
            <div className="mt-2 flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-2.5 flex-1 min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-300 truncate">{user.username}</p>
                  <p className={`text-[11px] capitalize ${RANK_COLOR[user.rank] ?? 'text-zinc-500'}`}>
                    {user.rank}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => void handleLogout()}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
                aria-label="Logout"
              >
                <FaSignOutAlt size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom nav ─────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d14]/95 backdrop-blur-xl border-t border-white/[0.06] z-50">
        <div className="flex items-center justify-around px-1 py-2">
          {NAV.slice(0, 5).map(({ href, icon: Icon, key }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  active ? 'text-[#7C3AED]' : 'text-zinc-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{t(key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
