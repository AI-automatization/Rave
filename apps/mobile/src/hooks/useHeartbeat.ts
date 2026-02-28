import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';

const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function useHeartbeat() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const beat = async () => {
      try {
        await userApi.heartbeat();
      } catch {
        // silent — heartbeat failure is non-critical
      }
    };

    beat();
    intervalRef.current = setInterval(beat, HEARTBEAT_INTERVAL);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') beat();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [isAuthenticated]);
}
