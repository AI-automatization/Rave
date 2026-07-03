'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { WIcon } from '@/components/common/WeWatchLogo';
import { useAuthStore } from '@/store/auth.store';
import { useUnreadCount } from '@/hooks/use-unread-count';

const PALETTE = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#DB2777', '#0891B2'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function AppNav() {
  const { user, isLoading } = useAuthStore();
  const pathname = usePathname();
  const { count: unreadCount } = useUnreadCount();

  return (
    <header className="glass-nav sticky top-0 z-50 h-12 border-b border-white/[0.07] px-4 flex items-center justify-between">
      <Link href="/home" className="flex items-center gap-2" aria-label="WeWatch">
        <WIcon size={20} />
        <span className="font-bold text-[14px] tracking-tight text-white">We<span style={{ color: '#7C3AED' }}>Watch</span></span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/notifications"
          className={`relative p-2 rounded-md transition-colors ${
            pathname.startsWith('/notifications') ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-200'
          }`}
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          )}
        </Link>

        {isLoading && (
          <div className="w-7 h-7 rounded-full bg-white/[0.06] animate-pulse ml-1" />
        )}

        {!isLoading && user && (
          <Link href="/profile" className="ml-1 hover:opacity-80 transition-opacity" aria-label="Profile">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden"
              style={{ background: user.avatar ? undefined : avatarColor(user._id ?? user.username ?? 'u') }}
            >
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : (user.username?.[0]?.toUpperCase() ?? '?')}
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
