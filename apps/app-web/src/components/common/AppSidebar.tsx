'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Users, MessageCircle, User, Bell, Settings, Headphones, LogOut, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { useFriendRequests } from '@/hooks/use-friends';
import { useConversations } from '@/hooks/use-dm';
import { useUserStats } from '@/hooks/use-profile';
import { trackClick } from '@/lib/analytics';
import { OnlineFriendsWidget } from './OnlineFriendsWidget';

const PALETTE = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#DB2777', '#0891B2'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function formatBadge(n: number): string {
  return n > 99 ? '99+' : String(n);
}

// ui-ux-pro-max skill: visible focus ring on every interactive element (Accessibility, CRITICAL).
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0e0a20]';

const MOBILE_ITEMS = [
  { key: 'home', href: '/home', icon: Home },
  { key: 'friends', href: '/friends', icon: Users },
  { key: 'messages', href: '/messages', icon: MessageCircle },
  { key: 'profile', href: '/profile', icon: User },
] as const;

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  badge?: number;
}

// Flat nav row shared by every sidebar item — no more accordion/indentation for "Профиль":
// one consistent 40px touch target (ui-ux-pro-max Touch & Interaction, CRITICAL), one visual
// weight, active/focus/badge all handled the same way regardless of section.
function NavItem({ href, label, icon: Icon, active, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={() => trackClick('sidebar:nav', { href })}
      className={`flex items-center gap-2.5 px-2 h-10 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${FOCUS_RING} ${
        active
          ? 'bg-violet-600/[0.14] text-violet-300'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] active:bg-white/[0.08]'
      }`}
    >
      <Icon size={16} />
      <span className="flex-1">{label}</span>
      {!!badge && badge > 0 && (
        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums">
          {formatBadge(badge)}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-700 uppercase px-2 mb-1.5 mt-3 first:mt-0">
      {children}
    </p>
  );
}

export function AppSidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { count: unreadNotifications } = useUnreadCount();
  const { data: friendRequests } = useFriendRequests();
  const { data: conversations } = useConversations();
  const { data: stats } = useUserStats();

  const pendingRequestsCount = friendRequests?.length ?? 0;
  const unreadMessagesCount = (conversations ?? []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const isInProfileSection = ['/profile', '/notifications', '/support', '/settings'].some((p) => pathname.startsWith(p));
  const color = avatarColor(user?._id ?? user?.username ?? 'u');

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-white/[0.07] shrink-0 glass-nav">
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
          <SectionLabel>{t('sectionMain')}</SectionLabel>
          <NavItem href="/home" label={t('home')} icon={Home} active={pathname.startsWith('/home')} />
          <NavItem href="/friends" label={t('friends')} icon={Users} active={pathname.startsWith('/friends')} badge={pendingRequestsCount} />
          <NavItem href="/messages" label={t('messages')} icon={MessageCircle} active={pathname.startsWith('/messages')} badge={unreadMessagesCount} />

          <SectionLabel>{t('sectionAccount')}</SectionLabel>
          <NavItem href="/profile" label={t('profile')} icon={User} active={pathname.startsWith('/profile')} />
          <NavItem href="/notifications" label={t('notifications')} icon={Bell} active={pathname.startsWith('/notifications')} badge={unreadNotifications} />
          <NavItem href="/support" label={t('support')} icon={Headphones} active={pathname.startsWith('/support')} />
          <NavItem href="/settings" label={t('settings')} icon={Settings} active={pathname.startsWith('/settings')} />

          <OnlineFriendsWidget />
        </nav>

        {/* User footer — avatar, rank badge (real data from useUserStats, matches profile page), logout */}
        <div className="px-3 py-2.5 border-t border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden shrink-0"
              style={{ background: user?.avatar ? undefined : color }}
            >
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : (user?.username?.[0]?.toUpperCase() ?? '?')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-slate-300 truncate leading-tight">{user?.username ?? '—'}</p>
              {stats?.rank && (
                <p className="flex items-center gap-1 text-[10.5px] text-emerald-500/80 leading-tight">
                  <Trophy size={10} />
                  {stats.rank}
                </p>
              )}
            </div>
            <button
              onClick={() => { trackClick('sidebar:logout'); logout(); }}
              aria-label={t('logout')}
              className={`p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-md cursor-pointer ${FOCUS_RING}`}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-14 border-t border-white/[0.07] flex items-center justify-around px-2 glass-nav">
        {MOBILE_ITEMS.map(({ key, href, icon: Icon }) => {
          const active = key === 'profile' ? isInProfileSection : pathname.startsWith(href);
          const badge = key === 'friends' ? pendingRequestsCount
            : key === 'messages' ? unreadMessagesCount
            : key === 'profile' ? unreadNotifications
            : 0;
          return (
            <Link
              key={key}
              href={href}
              className={`flex flex-col items-center gap-1 transition-colors min-w-[56px] py-1 ${FOCUS_RING} ${
                active ? 'text-violet-400' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <div className="relative">
                <Icon size={19} />
                {badge > 0 && (
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
