'use client';

/**
 * Desktop yon paneli (`lg` dan boshlab).
 *
 * Ilgari barcha o'lchamlarda faqat pastdagi suzuvchi dok bor edi. Katta
 * ekranda bu ikki muammo tug'dirardi: (1) navigatsiya nomlari ko'rinmasdi —
 * faqat ikonkalar, ya'ni bo'lim nomini taxmin qilish kerak edi; (2) 1440px
 * kenglikda kontent chetdan chetga cho'zilib, o'qish qulayligi yo'qolardi.
 *
 * Mobil/planshetda esa yon panel ekranning yarmini yeb qo'yadi — u yerda dok
 * qoladi (`FloatingNav` endi `lg:hidden`). Ya'ni ikkalasi bir vaqtda
 * ko'rinmaydi, har o'lchamda bitta navigatsiya.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home,
  Users,
  MessageCircle,
  Bell,
  User,
  Settings,
  Headphones,
  LogOut,
  Plus,
} from 'lucide-react';
import { WeWatchLogo } from '@/components/common/WeWatchLogo';
import { useAuthStore } from '@/store/auth.store';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { useFriendRequests } from '@/hooks/use-friends';
import { useConversations } from '@/hooks/use-dm';
import { avatarColor } from '@/lib/utils';
import { trackClick } from '@/lib/analytics';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--ww-live)] px-1 text-[10px] font-bold tabular-nums text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={() => trackClick('sidebar:nav', { href })}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex h-10 items-center gap-3 rounded-[var(--ww-r-md)] px-3 text-[13.5px] font-medium transition-colors ${
        active
          ? 'bg-[var(--ww-accent-soft)] text-white'
          : 'text-[var(--ww-text-3)] hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]'
      }`}
    >
      {/* Faol bo'limning chap chekkasidagi belgi — rang ko'rmaydiganlar uchun
          ham holat faqat rangga tayanmasligi kerak */}
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--ww-accent-hi)]"
        />
      )}
      <Icon
        size={17}
        aria-hidden="true"
        className={active ? 'text-[var(--ww-accent-hi)]' : ''}
      />
      <span className="flex-1 truncate">{label}</span>
      <Badge count={badge} />
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1.5 pt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ww-text-4)]">
      {children}
    </p>
  );
}

interface Props {
  /** Bosh sahifadagi "Yaratish" bilan bir xil dialogni ochadi */
  onCreateRoom?: () => void;
}

export function AppSidebar({ onCreateRoom }: Props) {
  const t = useTranslations('nav');
  const tHome = useTranslations('home');
  const { user, logout } = useAuthStore();
  const { count: unreadNotifications } = useUnreadCount();
  const { data: friendRequests } = useFriendRequests();
  const { data: conversations } = useConversations();

  const pendingRequests = friendRequests?.length ?? 0;
  const unreadMessages = (conversations ?? []).reduce((s, c) => s + (c.unreadCount || 0), 0);
  const color = avatarColor(user?._id ?? user?.username ?? 'u');

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--ww-sidebar)] flex-col border-r border-[var(--ww-line)] bg-[var(--ww-bg)] lg:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <WeWatchLogo iconSize={26} href="/home" className="transition-opacity hover:opacity-80" />
      </div>

      {/* Asosiy harakat navigatsiyadan yuqorida — mahsulotda eng ko'p
          takrorlanadigan amal xona yaratish */}
      {onCreateRoom && (
        <div className="px-3 pb-1">
          <button
            type="button"
            onClick={() => {
              trackClick('sidebar:create_room');
              onCreateRoom();
            }}
            className="ww-btn-accent flex h-10 w-full items-center justify-center gap-2 rounded-[var(--ww-r-md)] text-[13.5px] font-semibold text-white"
          >
            <Plus size={16} aria-hidden="true" />
            {tHome('quickCreate')}
          </button>
        </div>
      )}

      <nav className="scrollbar-hide flex-1 overflow-y-auto px-3 pb-4">
        <SectionLabel>{t('sectionMain')}</SectionLabel>
        <div className="flex flex-col gap-0.5">
          <NavItem href="/home" label={t('home')} icon={Home} />
          <NavItem href="/friends" label={t('friends')} icon={Users} badge={pendingRequests} />
          <NavItem
            href="/messages"
            label={t('messages')}
            icon={MessageCircle}
            badge={unreadMessages}
          />
          <NavItem
            href="/notifications"
            label={t('notifications')}
            icon={Bell}
            badge={unreadNotifications}
          />
        </div>

        <SectionLabel>{t('sectionAccount')}</SectionLabel>
        <div className="flex flex-col gap-0.5">
          <NavItem href="/profile" label={t('myProfile')} icon={User} />
          <NavItem href="/support" label={t('support')} icon={Headphones} />
          <NavItem href="/settings" label={t('settings')} icon={Settings} />
        </div>
      </nav>

      {/* Foydalanuvchi kartasi — pastda, chunki u navigatsiya emas, kontekst */}
      <div className="shrink-0 border-t border-[var(--ww-line)] p-3">
        <div className="flex items-center gap-2.5 rounded-[var(--ww-r-md)] px-2 py-2">
          <Link
            href="/profile"
            className="flex min-w-0 flex-1 items-center gap-2.5"
            aria-label={t('myProfile')}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[12px] font-bold text-white"
              style={{ background: user?.avatar ? undefined : color }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (user?.username?.[0]?.toUpperCase() ?? '?')
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-[var(--ww-text)]">
                {user?.username ?? '—'}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => {
              trackClick('sidebar:logout');
              logout();
            }}
            aria-label={t('logout')}
            title={t('logout')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--ww-text-4)] transition-colors hover:bg-[var(--ww-danger-soft)] hover:text-[var(--ww-danger)]"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
