// WeWatch Mobile — useEnsureSocket hook
// DM chat realtime uchun socket ulanishini kafolatlaydi. Watch party socket
// lifecycle'iga TEGMAYDI: bu yerda hech qachon disconnectSocket chaqirilmaydi —
// uzish faqat logout (auth.store) yoki watch party yopilishida bo'ladi.
//
// Muammo (bug): useSocket() hech qayerda mount qilinmagan edi → global socket
// faqat watch party ichida ulanardi → DMChatScreen'da getSocket()=null →
// kelayotgan xabarlar realtime yetib kelmasdi. Bu hook DM ekranlari ochiq
// bo'lganda socketni ulab qo'yadi (singleton — connectSocket mavjudini qaytaradi).
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@store/auth.store';
import { connectSocket, getSocket } from '@socket/client';

export function useEnsureSocket(): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const ensure = () => {
      const sock = getSocket();
      if (!sock || !sock.connected) {
        connectSocket(accessToken);
      }
    };

    ensure();

    // Ilova fonga ketib qaytganda socket uzilgan bo'lishi mumkin — qayta ulash
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') ensure();
    });

    return () => sub.remove();
  }, [isAuthenticated, accessToken]);
}
