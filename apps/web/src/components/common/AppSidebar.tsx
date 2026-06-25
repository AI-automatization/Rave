'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Users, MessageCircle, User, Bell, Settings, Headphones, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUnreadCount } from '@/hooks/use-unread-count';

const PALETTE = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#DB2777', '#0891B2'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

const MAIN_ITEMS = [
  { key: 'home', href: '/home', icon: Home },
  { key: 'friends', href: '/friends', icon: Users },
  { key: 'messages', href: '/messages', icon: MessageCircle },
] as const;

const MOBILE_ITEMS = [
  { key: 'home', href: '/home', icon: Home },
  { key: 'friends', href: '/friends', icon: Users },
  { key: 'messages', href: '/messages', icon: MessageCircle },
  { key: 'profile', href: '/profile', icon: User },
] as const;

const PROFILE_SUB_PATHS = ['/profile', '/notifications', '/support', '/settings'];

export function AppSidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { count: unreadCount } = useUnreadCount();

  const isInProfileSection = PROFILE_SUB_PATHS.some((p) => pathname.startsWith(p));
  const [profileOpen, setProfileOpen] = useState(isInProfileSection);

  useEffect(() => {
    if (isInProfileSection) setProfileOpen(true);
  }, [isInProfileSection]);

  const color = avatarColor(user?._id ?? user?.username ?? 'u');

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-white/[0.07] shrink-0 glass-nav">
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-700 uppercase px-2 mb-1.5">Main</p>

          {MAIN_ITEMS.map(({ key, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-2.5 px-2 h-8 rounded-md text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-violet-600/[0.12] text-violet-300'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={15} />
                {t(key)}
              </Link>
            );
          })}

          <div className="my-2 h-px bg-white/[0.05]" />

          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-700 uppercase px-2 mb-1.5">Account</p>

          <button
            onClick={() => setProfileOpen((v) => !v)}
            className={`flex items-center gap-2.5 px-2 h-8 rounded-md text-[13px] font-medium transition-colors w-full text-left ${
              isInProfileSection
                ? 'bg-violet-600/[0.12] text-violet-300'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <User size={15} />
            <span className="flex-1">{t('profile')}</span>
            <ChevronRight
              size={12}
              className={`text-slate-600 transition-transform duration-150 ${profileOpen ? 'rotate-90' : ''}`}
            />
          </button>

          {profileOpen && (
            <div className="flex flex-col gap-0.5 ml-4 pl-2 border-l border-violet-500/[0.15]">
              <SubItem href="/profile" label={t('myProfile')} icon={<User size={13} />} pathname={pathname} />

              <Link
                href="/notifications"
                className={`flex items-center gap-2 px-2 h-7 rounded-md text-[13px] transition-colors ${
                  pathname.startsWith('/notifications')
                    ? 'text-violet-300 bg-violet-600/[0.1]'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <Bell size={13} />
                <span className="flex-1">{t('notifications')}</span>
                {unreadCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                )}
              </Link>

              <SubItem href="/support" label={t('support')} icon={<Headphones size={13} />} pathname={pathname} />
              <SubItem href="/settings" label={t('settings')} icon={<Settings size={13} />} pathname={pathname} />
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="px-3 py-2.5 border-t border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0"
              style={{ background: user?.avatar ? undefined : color }}
            >
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : (user?.username?.[0]?.toUpperCase() ?? '?')}
            </div>
            <span className="flex-1 text-[13px] font-medium text-slate-300 truncate">{user?.username ?? '—'}</span>
            <button
              onClick={logout}
              className="p-1 text-slate-600 hover:text-red-400 transition-colors rounded cursor-pointer"
              title={t('logout')}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-14 border-t border-white/[0.07] flex items-center justify-around px-2 glass-nav">
        {MOBILE_ITEMS.map(({ key, href, icon: Icon }) => {
          const active = key === 'profile' ? isInProfileSection : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={`flex flex-col items-center gap-1 transition-colors min-w-[56px] py-1 ${
                active ? 'text-violet-400' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <div className="relative">
                <Icon size={19} />
                {key === 'profile' && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </div>
              <span className="text-[10px] font-medium">{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SubItem({
  href,
  label,
  icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  pathname: string;
}) {
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2 h-7 rounded-md text-[13px] transition-colors ${
        active
          ? 'text-violet-300 bg-violet-600/[0.1]'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
