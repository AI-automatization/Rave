'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Film,
  Users,
  Swords,
  Trophy,
  BarChart2,
  Bell,
  Settings,
  LogOut,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';

const NAV_ITEMS = [
  { href: '/home',          icon: Home,     label: 'Bosh sahifa' },
  { href: '/search',        icon: Search,   label: 'Qidirish' },
  { href: '/movies',        icon: Film,     label: 'Filmlar' },
  { href: '/friends',       icon: Users,    label: "Do'stlar" },
  { href: '/battle',        icon: Swords,   label: 'Battle' },
  { href: '/achievements',  icon: Trophy,   label: 'Yutuqlar' },
  { href: '/stats',         icon: BarChart2, label: 'Statistika' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      logger.error('Logout xatosi', err);
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  const rankColors: Record<string, string> = {
    bronze:  'text-orange-400',
    silver:  'text-silver',
    gold:    'text-gold',
    diamond: 'text-diamond',
    legend:  'text-primary',
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-base-200 border-r border-base-300 h-screen sticky top-0">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 px-5 py-5 border-b border-base-300">
          <span className="text-2xl font-display text-primary tracking-wider">CINESYNC</span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary text-primary-content font-medium'
                    : 'text-base-content/70 hover:bg-base-300 hover:text-base-content'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: notifications + settings + user */}
        <div className="border-t border-base-300 p-3 space-y-1">
          <Link
            href="/notifications"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/70 hover:bg-base-300 hover:text-base-content transition-colors"
          >
            <Bell className="w-4 h-4" />
            Bildirishnomalar
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/70 hover:bg-base-300 hover:text-base-content transition-colors"
          >
            <Settings className="w-4 h-4" />
            Sozlamalar
          </Link>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 mt-1">
              <Link href={`/profile/${user.username}`} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="avatar">
                  <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.username} width={32} height={32} className="object-cover" unoptimized />
                    ) : (
                      <span className="text-xs">{user.username[0].toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.username}</p>
                  <p className={`text-xs capitalize ${rankColors[user.rank] ?? 'text-base-content/50'}`}>
                    {user.rank}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => void handleLogout()}
                className="btn btn-ghost btn-xs btn-circle"
                aria-label="Chiqish"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.slice(0, 5).map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  active ? 'text-primary' : 'text-base-content/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
