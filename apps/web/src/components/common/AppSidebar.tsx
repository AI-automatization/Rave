'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Users, MessageCircle, User, Tv } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'home', href: '/home', icon: Home },
  { key: 'friends', href: '/friends', icon: Users },
  { key: 'messages', href: '/messages', icon: MessageCircle },
  { key: 'profile', href: '/profile', icon: User },
] as const;

export function AppSidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-white/[0.06] bg-[#0A0A12]/50 px-3 py-4 gap-1">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-violet-600/15 text-violet-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon size={18} />
              {t(key)}
            </Link>
          );
        })}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-[#0A0A12]/90 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around px-4">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
                active ? 'text-violet-400' : 'text-slate-500'
              }`}
            >
              <Icon size={20} />
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
