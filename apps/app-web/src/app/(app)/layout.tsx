'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import { useTokenRefresh } from '@/hooks/use-token-refresh';
import { AppNav } from '@/components/common/AppNav';
import { AppSidebar } from '@/components/common/AppSidebar';
import { FloatingNav } from '@/components/common/FloatingNav';
import { MaintenanceBanner } from '@/components/common/MaintenanceBanner';
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog';
import { WIcon } from '@/components/common/WeWatchLogo';

// Shown instead of the app until /me confirms who the user is. The app used to render right away
// and fill the account in later — the desktop opened on a dashboard with "--" for the account
// while the session was still being checked (or was already dead).
function AuthGate({ error, onRetry }: { error: boolean; onRetry: () => void }) {
  const tc = useTranslations('common');
  const th = useTranslations('home');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--ww-bg)] px-4 text-center">
      <WIcon size={40} />
      {error ? (
        <>
          <p className="text-sm text-[var(--ww-text)]">{tc('error')}</p>
          <button
            type="button"
            onClick={onRetry}
            className="h-10 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            {th('retry')}
          </button>
        </>
      ) : (
        <p role="status" className="text-sm text-[var(--ww-text-4)]">{tc('loading')}</p>
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authError = useAuthStore((s) => s.authError);
  const [createOpen, setCreateOpen] = useState(false);
  const pathname = usePathname();
  // A room is an immersive, focused view with its own header (RoomHeader) and its own
  // controls (chat/participants/queue) — the mobile top bar and floating Home/Friends/
  // Messages/Account dock were real-user-reported as sitting directly on top of the video
  // player there, duplicating navigation the room already provides for itself. The desktop
  // AppSidebar doesn't have this problem (persistent left rail, not an overlay) so it stays.
  const inRoom = pathname?.startsWith('/room/');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useHeartbeat();
  useTokenRefresh();

  if (!isAuthenticated) return <AuthGate error={authError} onRetry={() => { void checkAuth(); }} />;

  return (
    // lg:pl-[--ww-sidebar] — yon panel `fixed`, ya'ni oqimda joy egallamaydi,
    // shuning uchun kontent uning kengligiga suriladi. Kenglik globals.css
    // dagi `--ww-sidebar` da — yagona manba.
    <div className="min-h-screen lg:pl-[var(--ww-sidebar)]">
      <MaintenanceBanner />

      {/* Navigatsiya o'lchamga qarab BITTA bo'ladi:
          < lg — yuqorida ixcham panel + pastda suzuvchi dok (xona sahifasida ikkalasi ham
          yashiriladi — video pleer ustiga chiqib ketardi, real foydalanuvchi xabar bergan)
          ≥ lg — chapda yon panel (dok ham, yuqori panel ham yashiriladi) */}
      {!inRoom && (
        <div className="lg:hidden">
          <AppNav />
        </div>
      )}

      <AppSidebar onCreateRoom={() => setCreateOpen(true)} />

      <main className={inRoom ? 'overflow-x-hidden' : 'overflow-x-hidden p-4 pb-24 md:p-6 lg:p-8 lg:pb-8'}>
        {children}
      </main>

      {!inRoom && (
        <div className="lg:hidden">
          <FloatingNav />
        </div>
      )}

      {/* Dialog layout darajasida — yon paneldagi "Yaratish" har sahifada
          ishlaydi, faqat bosh sahifada emas */}
      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
