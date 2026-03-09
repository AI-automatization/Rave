// CineSync Mobile — useSocket hook
import { useEffect } from 'react';
import { useAuthStore } from '@store/auth.store';
import { connectSocket, disconnectSocket } from '@socket/client';

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    connectSocket(accessToken);

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, accessToken]);
}
