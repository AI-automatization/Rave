'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import { AppNav } from '@/components/common/AppNav';
import { FloatingNav } from '@/components/common/FloatingNav';
import { MaintenanceBanner } from '@/components/common/MaintenanceBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useHeartbeat();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
      <MaintenanceBanner />
      <AppNav />
      <div className="flex flex-1">
        {/* FloatingNav is fixed-position — takes no flex space, main gets the full width on
            every breakpoint now (that's the point of the floating-dock option). */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 overflow-x-hidden">
          {children}
        </main>
      </div>
      <FloatingNav />
    </div>
  );
}
