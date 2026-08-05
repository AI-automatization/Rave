'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import { AppNav } from '@/components/common/AppNav';
import { AppSidebar } from '@/components/common/AppSidebar';
import { FloatingNav } from '@/components/common/FloatingNav';
import { MaintenanceBanner } from '@/components/common/MaintenanceBanner';
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useHeartbeat();

  return (
    // lg:pl-[--ww-sidebar] — yon panel `fixed`, ya'ni oqimda joy egallamaydi,
    // shuning uchun kontent uning kengligiga suriladi. Kenglik globals.css
    // dagi `--ww-sidebar` da — yagona manba.
    <div className="min-h-screen lg:pl-[var(--ww-sidebar)]">
      <MaintenanceBanner />

      {/* Navigatsiya o'lchamga qarab BITTA bo'ladi:
          < lg — yuqorida ixcham panel + pastda suzuvchi dok
          ≥ lg — chapda yon panel (dok ham, yuqori panel ham yashiriladi)
          Ilgari dok barcha o'lchamlarda edi: katta ekranda bo'lim nomlari
          ko'rinmasdi va kontent 1440px da chetdan chetga cho'zilardi. */}
      <div className="lg:hidden">
        <AppNav />
      </div>

      <AppSidebar onCreateRoom={() => setCreateOpen(true)} />

      <main className="overflow-x-hidden p-4 pb-24 md:p-6 lg:p-8 lg:pb-8">{children}</main>

      <div className="lg:hidden">
        <FloatingNav />
      </div>

      {/* Dialog layout darajasida — yon paneldagi "Yaratish" har sahifada
          ishlaydi, faqat bosh sahifada emas */}
      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
