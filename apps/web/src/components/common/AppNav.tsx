'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bell, LogOut } from 'lucide-react';
import { WIcon } from '@/components/common/WeWatchLogo';
import { useAuthStore } from '@/store/auth.store';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export function AppNav() {
  const t = useTranslations('nav');
  const { user, logout, isLoading } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 h-14 bg-[#0A0A12]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between">
      {/* Left: Logo */}
      <Link href="/home" className="flex items-center gap-2" aria-label="WeWatch">
        <WIcon size={24} />
        <span className="font-extrabold text-base tracking-tight text-white hidden sm:inline">
          We<span style={{ color: '#6231EF' }}>Watch</span>
        </span>
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        <button className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]">
          <Bell size={18} />
        </button>

        {isLoading && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] animate-pulse" />
            <div className="hidden md:block w-20 h-3.5 rounded bg-white/[0.08] animate-pulse" />
          </div>
        )}

        {!isLoading && user && (
          <div className="flex items-center gap-2.5">
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300 overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : user.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm text-slate-300 hidden md:inline">{user.username}</span>
            </Link>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/[0.05]"
              title={t('logout')}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
