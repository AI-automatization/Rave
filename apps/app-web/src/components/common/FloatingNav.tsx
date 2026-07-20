'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
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

type Popover = 'friends' | 'account' | null;

interface DockIconProps {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  badge?: number;
  href?: string;
  onClick?: () => void;
}

// Single dock button — either a direct Link (Home, Messages) or a toggle button that opens a
// popover above the dock (Friends, Account). 44px target (Touch & Interaction, CRITICAL),
// aria-label since there's no visible text label (icon-only dock, macOS/Discord style).
function DockIcon({ label, icon: Icon, active, badge, href, onClick }: DockIconProps) {
  const className = `relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all cursor-pointer ${FOCUS_RING} ${
    active
      ? 'bg-violet-600/20 text-violet-300'
      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] active:bg-white/[0.12]'
  }`;
  const content = (
    <>
      <Icon size={20} />
      {!!badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold tabular-nums ring-2 ring-[#0e0a20]">
          {formatBadge(badge)}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} title={label} aria-label={label} onClick={() => trackClick('dock:nav', { href })} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" title={label} aria-label={label} aria-expanded={active} onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function AccountPopoverContent({ unreadNotifications, onNavigate }: { unreadNotifications: number; onNavigate: () => void }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const color = avatarColor(user?._id ?? user?.username ?? 'u');

  const items = [
    { href: '/profile', label: t('myProfile'), icon: User, badge: 0 },
    { href: '/notifications', label: t('notifications'), icon: Bell, badge: unreadNotifications },
    { href: '/support', label: t('support'), icon: Headphones, badge: 0 },
    { href: '/settings', label: t('settings'), icon: Settings, badge: 0 },
  ];

  return (
    <div className="flex flex-col w-64">
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

      <div className="p-1.5 flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => { trackClick('dock:account_nav', { href }); onNavigate(); }}
              className={`flex items-center gap-2.5 px-2.5 h-10 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${FOCUS_RING} ${
                active ? 'bg-violet-600/[0.14] text-violet-300' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] active:bg-white/[0.08]'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums">
                  {formatBadge(badge)}
                </span>
              )}
            </Link>
          );
        })}

        {/* Destructive action kept visually + spatially separate (ui-ux-pro-max
            destructive-nav-separation) — divider + red-tinted hover, not just another row. */}
        <div className="my-1.5 h-px bg-white/[0.06]" />
        <button
          onClick={() => { trackClick('dock:logout'); logout(); }}
          className={`flex items-center gap-2.5 px-2.5 h-10 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] active:bg-red-500/[0.12] transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <LogOut size={16} />
          <span className="flex-1 text-left">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}

export function FloatingNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { count: unreadNotifications } = useUnreadCount();
  const { data: friendRequests } = useFriendRequests();
  const { data: conversations } = useConversations();

  const pendingRequestsCount = friendRequests?.length ?? 0;
  const unreadMessagesCount = (conversations ?? []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const [popover, setPopover] = useState<Popover>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Close on route change — a Link inside a popover already navigates; this just clears the
  // now-stale open state so it doesn't linger over the new page.
  useEffect(() => { setPopover(null); }, [pathname]);

  // Escape key closes (ui-ux-pro-max modal-escape / escape-routes, Accessibility).
  useEffect(() => {
    if (!popover) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPopover(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popover]);

  const isAccountRoute = ['/profile', '/notifications', '/support', '/settings'].some((p) => pathname.startsWith(p));

  return (
    <>
      {/* Click-outside backdrop — transparent, just catches the dismiss click/tap. */}
      {popover && (
        <div className="fixed inset-0 z-40" onClick={() => setPopover(null)} aria-hidden="true" />
      )}

      {/* Floating dock — one component for desktop AND mobile, replaces both the old left
          sidebar and the separate bottom bar. Fixed positioning means it takes no space in the
          page flow, so `main` in (app)/layout.tsx now gets the full viewport width on every
          breakpoint (the reason this option was chosen over the rail+panel one). */}
      <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div
          ref={dockRef}
          className="relative flex items-center gap-1 px-2 py-2 rounded-2xl glass-nav border border-white/[0.08] shadow-2xl pointer-events-auto"
        >
          {/* AnimatePresence gives this a real exit animation, not just enter — plain CSS
              can only animate an element INTO existence, never its removal (there's no hook
              for "about to unmount"). This is the textbook case for framer-motion: everything
              else in the app (Dialog/Toast) already gets enter+exit for free from Radix's own
              data-state mechanism, but this popover is hand-rolled conditional rendering. */}
          <AnimatePresence>
            {popover && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformOrigin: 'bottom center' }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 rounded-2xl glass-nav border border-white/[0.08] shadow-2xl overflow-hidden max-h-[70vh] flex flex-col"
              >
                {popover === 'friends' && (
                  <div className="w-72 flex-1 min-h-0 flex flex-col">
                    <FriendsPanel />
                  </div>
                )}
                {popover === 'account' && (
                  <AccountPopoverContent unreadNotifications={unreadNotifications} onNavigate={() => setPopover(null)} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <DockIcon href="/home" label={t('home')} icon={Home} active={pathname.startsWith('/home')} />
          <DockIcon
            label={t('friends')}
            icon={Users}
            active={popover === 'friends' || pathname.startsWith('/friends')}
            badge={pendingRequestsCount}
            onClick={() => setPopover((p) => (p === 'friends' ? null : 'friends'))}
          />
          <DockIcon href="/messages" label={t('messages')} icon={MessageCircle} active={pathname.startsWith('/messages')} badge={unreadMessagesCount} />
          <DockIcon
            label={t('sectionAccount')}
            icon={User}
            active={popover === 'account' || isAccountRoute}
            badge={unreadNotifications}
            onClick={() => setPopover((p) => (p === 'account' ? null : 'account'))}
          />
        </div>
      </div>
    </>
  );
}
