'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Users, MessageCircle, User, Bell, Settings, Headphones, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { useFriendRequests } from '@/hooks/use-friends';
import { useConversations } from '@/hooks/use-dm';
import { trackClick } from '@/lib/analytics';
import { FriendsPanel } from './OnlineFriendsWidget';

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

type Space = 'friends' | 'account' | null;

function spaceForPathname(pathname: string): Space {
  if (pathname.startsWith('/friends')) return 'friends';
  if (['/profile', '/notifications', '/support', '/settings'].some((p) => pathname.startsWith(p))) return 'account';
  return null;
}

interface RailIconProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  badge?: number;
}

// Discord/Slack-style rail item: icon-only, 44px target (Touch & Interaction, CRITICAL), a
// violet bar flush with the rail's own edge marks the active space, aria-label + native title
// stand in for the visible text label a classic sidebar row would have had.
function RailIcon({ href, label, icon: Icon, active, badge }: RailIconProps) {
  return (
    <div className="relative w-full flex items-center justify-center">
      <span
        className={`absolute left-0 w-1 rounded-r-full bg-violet-400 transition-all duration-200 ${
          active ? 'h-6 opacity-100 shadow-[0_0_6px_rgba(167,139,250,0.6)]' : 'h-2 opacity-0'
        }`}
      />
      <Link
        href={href}
        title={label}
        aria-label={label}
        onClick={() => trackClick('sidebar:rail', { href })}
        className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all cursor-pointer ${FOCUS_RING} ${
          active
            ? 'bg-violet-600/20 text-violet-300'
            : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] active:bg-white/[0.09]'
        }`}
      >
        <Icon size={20} />
        {!!badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold tabular-nums ring-2 ring-[#07050f]">
            {formatBadge(badge)}
          </span>
        )}
      </Link>
    </div>
  );
}

function AccountNavItem({
  href, label, icon: Icon, active, badge,
}: { href: string; label: string; icon: React.ComponentType<{ size?: number }>; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      onClick={() => trackClick('sidebar:account_nav', { href })}
      className={`flex items-center gap-2.5 px-2.5 h-10 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${FOCUS_RING} ${
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

function AccountPanel({ unreadNotifications }: { unreadNotifications: number }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const color = avatarColor(user?._id ?? user?.username ?? 'u');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-3 h-11 border-b border-white/[0.06] shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0"
          style={{ background: user?.avatar ? undefined : color }}
        >
          {user?.avatar
            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            : (user?.username?.[0]?.toUpperCase() ?? '?')}
        </div>
        <p className="flex-1 text-[13px] font-medium text-slate-300 truncate">{user?.username ?? '—'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
        <AccountNavItem href="/profile" label={t('myProfile')} icon={User} active={pathname.startsWith('/profile')} />
        <AccountNavItem href="/notifications" label={t('notifications')} icon={Bell} active={pathname.startsWith('/notifications')} badge={unreadNotifications} />
        <AccountNavItem href="/support" label={t('support')} icon={Headphones} active={pathname.startsWith('/support')} />
        <AccountNavItem href="/settings" label={t('settings')} icon={Settings} active={pathname.startsWith('/settings')} />

        {/* Destructive action kept visually + spatially separate from normal nav (ui-ux-pro-max
            `destructive-nav-separation`) — divider + red-tinted hover instead of just another row. */}
        <div className="my-1.5 h-px bg-white/[0.06]" />
        <button
          onClick={() => { trackClick('sidebar:logout'); logout(); }}
          className={`flex items-center gap-2.5 px-2.5 h-10 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] active:bg-red-500/[0.12] transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <LogOut size={16} />
          <span className="flex-1 text-left">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { count: unreadNotifications } = useUnreadCount();
  const { data: friendRequests } = useFriendRequests();
  const { data: conversations } = useConversations();

  const pendingRequestsCount = friendRequests?.length ?? 0;
  const unreadMessagesCount = (conversations ?? []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const space = spaceForPathname(pathname);

  return (
    <>
      {/* Desktop: icon rail + contextual panel (Discord-style two-tier) — panel only takes
          space when the current route actually needs one (Friends / Account). Home and
          Messages already have their own full-page content (Messages has its own conversation
          list column), so they get the full remaining width instead of a redundant second list. */}
      <div className="hidden lg:flex shrink-0">
        <nav className="w-16 flex flex-col items-center gap-1 py-3 border-r border-white/[0.07] glass-nav shrink-0">
          <RailIcon href="/home" label={t('home')} icon={Home} active={pathname.startsWith('/home')} />
          <RailIcon href="/friends" label={t('friends')} icon={Users} active={space === 'friends'} badge={pendingRequestsCount} />
          <RailIcon href="/messages" label={t('messages')} icon={MessageCircle} active={pathname.startsWith('/messages')} badge={unreadMessagesCount} />

          <div className="flex-1" />

          <RailIcon href="/profile" label={t('sectionAccount')} icon={User} active={space === 'account'} badge={unreadNotifications} />
        </nav>

        {space && (
          <aside className="w-56 border-r border-white/[0.07] glass-nav shrink-0">
            {space === 'friends' && <FriendsPanel />}
            {space === 'account' && <AccountPanel unreadNotifications={unreadNotifications} />}
          </aside>
        )}
      </div>

      {/* Mobile bottom nav — unchanged, the two-tier rail/panel pattern doesn't fit a narrow
          phone viewport the way it does a desktop-width column. */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-14 border-t border-white/[0.07] flex items-center justify-around px-2 glass-nav">
        {MOBILE_ITEMS.map(({ key, href, icon: Icon }) => {
          const active = key === 'profile' ? space === 'account' : pathname.startsWith(href);
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
