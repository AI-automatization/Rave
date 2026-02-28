import { useEffect } from 'react';
import { useAuthStore } from '@store/auth.store';
import { connectSocket, disconnectSocket } from '@socket/client';

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);
}
