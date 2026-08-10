'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import { useTokenRefresh } from '@/hooks/use-token-refresh';
import { AppNav } from '@/components/common/AppNav';
import { FloatingNav } from '@/components/common/FloatingNav';
import { MaintenanceBanner } from '@/components/common/MaintenanceBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const pathname = usePathname();
  // A room is an immersive, focused view with its own header (RoomHeader) and its own
  // controls (chat/participants/queue) — the global top bar and the floating Home/Friends/
  // Messages/Account dock were real-user-reported as sitting directly on top of the video
  // player there, duplicating navigation the room already provides for itself.
  const inRoom = pathname?.startsWith('/room/');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useHeartbeat();
  useTokenRefresh();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
      <MaintenanceBanner />
      {!inRoom && <AppNav />}
      <div className="flex flex-1">
        {/* FloatingNav is fixed-position — takes no flex space, main gets the full width on
            every breakpoint now (that's the point of the floating-dock option). */}
        <main className={inRoom ? 'flex-1 overflow-x-hidden' : 'flex-1 p-4 md:p-6 lg:p-8 pb-24 overflow-x-hidden'}>
          {children}
        </main>
      </div>
      {!inRoom && <FloatingNav />}
    </div>
  );
}
