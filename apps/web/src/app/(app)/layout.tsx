'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { AppNav } from '@/components/common/AppNav';
import { AppSidebar } from '@/components/common/AppSidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen flex flex-col bg-[#060608]">
      <AppNav />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
